//! Offline encoders reconstructed from X3.exe; no transport or device access.
//! Hardware acceptance, acknowledgement, and readback remain unverified.

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct SensorProfile {
    pub dpi: [u16; 8],
    pub enabled: [bool; 8],
    pub colors: [[u8; 3]; 8],
    pub active_stage: usize,
    pub lod_mm: u8,
    pub ripple_control: bool,
    pub angle_snap: bool,
    pub motion_sync: bool,
}

pub fn encode_polling(hz: u16) -> Result<[u8; 9], &'static str> {
    let rate = match hz { 125 => 8, 250 => 4, 500 => 2, 1000 => 1, _ => return Err("unsupported polling rate") };
    Ok([6, 9, 1, rate, rate ^ 0xff, 0, 0, 0, 0])
}

pub fn encode_sensor(profile: &SensorProfile) -> Result<[u8; 56], &'static str> {
    if profile.dpi.iter().any(|dpi| *dpi < 50 || *dpi > 26000 || *dpi % 50 != 0) { return Err("invalid DPI"); }
    if profile.active_stage >= 8 || !profile.enabled[profile.active_stage] { return Err("active stage must be enabled"); }
    if !(1..=2).contains(&profile.lod_mm) { return Err("invalid lift-off distance"); }
    let mut packet = [0u8; 56];
    packet[..3].copy_from_slice(&[4, 0x38, 1]);
    packet[3] = profile.lod_mm - 1;
    packet[4] = profile.ripple_control as u8;
    packet[5] = profile.enabled.iter().enumerate().fold(0, |mask, (i, enabled)| mask | ((*enabled as u8) << i));
    packet[6] = profile.angle_snap as u8;
    packet[7] = profile.motion_sync as u8;
    for (i, dpi) in profile.dpi.iter().enumerate() {
        let encoded = dpi / 50 - 1;
        packet[8 + i] = encoded as u8;
        packet[16 + i] = (encoded >> 8) as u8;
    }
    packet[24] = profile.active_stage as u8 + 1;
    for (i, color) in profile.colors.iter().enumerate() { packet[25 + i * 3..28 + i * 3].copy_from_slice(color); }
    packet[49] = 1;
    let checksum: u16 = packet[3..50].iter().map(|&byte| byte as u16).sum();
    packet[50..52].copy_from_slice(&checksum.to_be_bytes());
    Ok(packet)
}

/// Decodes the monitor collection's report 03. A successful decode is not
/// evidence that a particular configuration was applied or persisted.
#[derive(Debug, PartialEq, Eq)]
pub struct MonitorReport {
    pub event_code: u16,
    pub value: u16,
}

impl MonitorReport {
    pub fn indicates_sender_stop(&self) -> bool {
        self.event_code == 0x5010 && self.value & 0xff == 0
    }
}

pub fn decode_monitor(report: &[u8]) -> Result<MonitorReport, &'static str> {
    if report.len() != 5 || report[0] != 3 { return Err("invalid monitor report"); }
    Ok(MonitorReport {
        event_code: u16::from_le_bytes([report[1], report[2]]),
        value: u16::from_le_bytes([report[3], report[4]]),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn example() -> SensorProfile { SensorProfile { dpi: [800,1600,2400,3200,5000,26000,50,50], enabled: [true,true,true,true,true,true,false,false], colors: [[255,0,0],[0,255,0],[0,0,255],[255,255,0],[0,255,255],[255,0,255],[0,0,0],[0,0,0]], active_stage: 1, lod_mm: 1, ripple_control: false, angle_snap: false, motion_sync: false } }
    #[test] fn polling_matches_original_vectors() {
        for (hz, rate) in [(125,8),(250,4),(500,2),(1000,1)] { assert_eq!(encode_polling(hz).unwrap(), [6,9,1,rate,rate ^ 255,0,0,0,0]); }
        assert!(encode_polling(999).is_err());
    }
    #[test] fn sensor_matches_offline_reference() {
        assert_eq!(encode_sensor(&example()).unwrap(), [4,56,1,0,0,63,0,0,15,31,47,63,99,7,0,0,0,0,0,0,0,2,0,0,2,255,0,0,0,255,0,0,0,255,255,255,0,0,255,255,255,0,255,0,0,0,0,0,0,1,10,65,0,0,0,0]);
    }
    #[test] fn rejects_incomplete_or_invalid_values() {
        let mut p = example(); p.active_stage = 6; assert!(encode_sensor(&p).is_err());
        p.active_stage = 1; p.dpi[0] = 51; assert!(encode_sensor(&p).is_err());
        p.dpi[0] = 50; p.lod_mm = 0; assert!(encode_sensor(&p).is_err());
    }
    #[test] fn monitor_decodes_little_endian_and_stop_flag() {
        let report = decode_monitor(&[3, 0x10, 0x50, 0, 0xab]).unwrap();
        assert_eq!(report, MonitorReport { event_code: 0x5010, value: 0xab00 });
        assert!(report.indicates_sender_stop());
        assert!(!decode_monitor(&[3, 0x10, 0x50, 1, 0]).unwrap().indicates_sender_stop());
        assert!(!decode_monitor(&[3, 0, 0x10, 0, 0]).unwrap().indicates_sender_stop());
        assert!(decode_monitor(&[3, 0, 0]).is_err());
        assert!(decode_monitor(&[4, 0, 0, 0, 0]).is_err());
    }
}
