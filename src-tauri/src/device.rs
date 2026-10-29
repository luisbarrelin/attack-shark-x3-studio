//! Windows HID discovery and narrowly scoped polling-rate transport.
use std::{ffi::c_void, ptr};
use serde::Serialize;

#[repr(C)]
struct Guid { data1: u32, data2: u16, data3: u16, data4: [u8; 8] }
#[repr(C)]
struct InterfaceData { size: u32, guid: Guid, flags: u32, reserved: usize }
#[link(name = "hid")]
extern "system" {
    fn HidD_GetHidGuid(guid: *mut Guid);
    fn HidD_GetAttributes(handle: *mut c_void, attributes: *mut Attributes) -> u8;
    fn HidD_GetPreparsedData(handle: *mut c_void, data: *mut *mut c_void) -> u8;
    fn HidD_FreePreparsedData(data: *mut c_void) -> u8;
    fn HidP_GetCaps(data: *mut c_void, caps: *mut u16) -> i32;
    fn HidD_SetFeature(handle: *mut c_void, data: *mut u8, length: u32) -> u8;
}
#[repr(C)]
struct Attributes { size: u32, vendor: u16, product: u16, version: u16 }
#[link(name = "setupapi")]
extern "system" {
    fn SetupDiGetClassDevsW(guid: *const Guid, enumerator: *const u16, parent: *mut c_void, flags: u32) -> *mut c_void;
    fn SetupDiEnumDeviceInterfaces(set: *mut c_void, info: *mut c_void, guid: *const Guid, index: u32, data: *mut InterfaceData) -> i32;
    fn SetupDiGetDeviceInterfaceDetailW(set: *mut c_void, data: *mut InterfaceData, detail: *mut c_void, size: u32, required: *mut u32, info: *mut c_void) -> i32;
    fn SetupDiDestroyDeviceInfoList(set: *mut c_void) -> i32;
}
#[link(name = "kernel32")]
extern "system" {
    fn GetLastError() -> u32;
    fn CreateFileW(path: *const u16, access: u32, share: u32, security: *mut c_void, creation: u32, flags: u32, template: *mut c_void) -> *mut c_void;
    fn CloseHandle(handle: *mut c_void) -> i32;
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DevicePresence { pub present: bool, pub product_ids: Vec<String>, #[serde(skip)] paths: Vec<String> }

struct DeviceSet(*mut c_void);
impl Drop for DeviceSet { fn drop(&mut self) { unsafe { SetupDiDestroyDeviceInfoList(self.0); } } }

pub fn enumerate() -> Result<DevicePresence, String> {
    unsafe {
        let mut guid = std::mem::zeroed::<Guid>();
        HidD_GetHidGuid(&mut guid);
        let handle = SetupDiGetClassDevsW(&guid, ptr::null(), ptr::null_mut(), 0x12);
        if handle as isize == -1 { return Err(format!("SetupAPI error {}", GetLastError())); }
        let set = DeviceSet(handle);
        let mut ids = Vec::new();
        let mut paths = Vec::new();
        for index in 0..4096 {
            let mut data = std::mem::zeroed::<InterfaceData>();
            data.size = std::mem::size_of::<InterfaceData>() as u32;
            if SetupDiEnumDeviceInterfaces(set.0, ptr::null_mut(), &guid, index, &mut data) == 0 {
                let error = GetLastError();
                if error == 259 { return Ok(DevicePresence { present: !ids.is_empty(), product_ids: ids, paths }); }
                return Err(format!("SetupAPI enumeration error {error}"));
            }
            let mut required = 0;
            SetupDiGetDeviceInterfaceDetailW(set.0, &mut data, ptr::null_mut(), 0, &mut required, ptr::null_mut());
            if !(8..=1_048_576).contains(&required) { return Err("Invalid HID interface size".into()); }
            // Aligned storage: DevicePath begins at byte 4 even on x64.
            let mut buffer = vec![0u64; (required as usize + 7) / 8];
            let detail = buffer.as_mut_ptr() as *mut u8;
            *(detail as *mut u32) = if cfg!(target_pointer_width = "64") { 8 } else { 6 };
            if SetupDiGetDeviceInterfaceDetailW(set.0, &mut data, detail.cast(), required, &mut required, ptr::null_mut()) == 0 {
                return Err(format!("SetupAPI detail error {}", GetLastError()));
            }
            let words = std::slice::from_raw_parts(detail.add(4) as *const u16, (required as usize - 4) / 2);
            let end = words.iter().position(|&c| c == 0).unwrap_or(words.len());
            let path = String::from_utf16_lossy(&words[..end]).to_ascii_lowercase();
            if path.contains("vid_1d57") {
                for (needle, label) in [("pid_fa60", "FA60"), ("pid_fa61", "FA61")] {
                    if path.contains(needle) {
                        paths.push(path.clone());
                        if !ids.iter().any(|id| id == label) { ids.push(label.to_owned()); }
                    }
                }
            }
        }
        Err("HID enumeration exceeded its safety limit".into())
    }
}

struct DeviceHandle(*mut c_void);
impl Drop for DeviceHandle { fn drop(&mut self) { unsafe { CloseHandle(self.0); } } }

/// Sends only report 06. No generic report-write command is exposed to the UI.
/// A successful OS return is not firmware readback or persistence verification.
pub fn send_polling(hz: u16) -> Result<(), String> {
    let mut packet = crate::protocol::encode_polling(hz).map_err(str::to_owned)?;
    send_report(&mut packet)
}

pub fn send_sensor(profile: &crate::protocol::SensorProfile) -> Result<(), String> {
    let mut packet = crate::protocol::encode_sensor(profile).map_err(str::to_owned)?;
    send_report(&mut packet)
}

fn send_report(packet: &mut [u8]) -> Result<(), String> {
    let presence = enumerate()?;
    let mut candidates = Vec::new();
    for path in presence.paths {
        let wide: Vec<u16> = path.encode_utf16().chain(Some(0)).collect();
        unsafe {
            let raw = CreateFileW(wide.as_ptr(), 0xc0000000, 3, ptr::null_mut(), 3, 0, ptr::null_mut());
            if raw as isize == -1 { continue; }
            let handle = DeviceHandle(raw);
            let mut attributes = Attributes { size: std::mem::size_of::<Attributes>() as u32, vendor: 0, product: 0, version: 0 };
            if HidD_GetAttributes(raw, &mut attributes) == 0 || attributes.vendor != 0x1d57 || ![0xfa60,0xfa61].contains(&attributes.product) { continue; }
            let mut preparsed = ptr::null_mut();
            if HidD_GetPreparsedData(raw, &mut preparsed) == 0 { continue; }
            let mut caps = [0u16; 32];
            let status = HidP_GetCaps(preparsed, caps.as_mut_ptr());
            HidD_FreePreparsedData(preparsed);
            if status == 0x00110000 && caps[0] == 0 && caps[1] == 0x0b && caps[4] >= packet.len() as u16 { candidates.push(handle); }
        }
    }
    if candidates.len() != 1 { return Err(format!("Expected one configuration interface; found {}", candidates.len())); }
    if unsafe { HidD_SetFeature(candidates[0].0, packet.as_mut_ptr(), packet.len() as u32) } == 0 {
        return Err(format!("HID send failed: {}", unsafe { GetLastError() }));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn enumerates_hid_without_opening_devices() {
        let result = enumerate().expect("HID enumeration should succeed");
        assert_eq!(result.present, !result.product_ids.is_empty());
        assert!(result.product_ids.iter().all(|id| id == "FA60" || id == "FA61"));
        eprintln!("Detected product IDs: {:?}", result.product_ids);
    }
}
