use crate::protocol::{encode_polling, encode_sensor, SensorProfile};
use serde::{Deserialize, Serialize};
use std::{fs, path::Path};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Profile { pub id: String, pub name: String, pub sensor: SensorProfile, pub polling: u16 }

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct ProfileLibrary { pub schema_version: u8, pub selected_id: String, pub profiles: Vec<Profile> }

impl ProfileLibrary {
    pub fn validate(&self) -> Result<(), String> {
        if self.schema_version != 1 || self.profiles.is_empty() || self.profiles.len() > 64 { return Err("Invalid profile library".into()); }
        let mut ids = std::collections::HashSet::new();
        for p in &self.profiles {
            if p.id.is_empty() || p.id.len() > 64 || !ids.insert(&p.id) || p.name.trim().is_empty() || p.name.chars().count() > 80 { return Err("Invalid profile identity".into()); }
            encode_sensor(&p.sensor).map_err(str::to_owned)?;
            encode_polling(p.polling).map_err(str::to_owned)?;
        }
        if !ids.contains(&self.selected_id) { return Err("Selected profile not found".into()); }
        Ok(())
    }
}

impl Default for ProfileLibrary {
    fn default() -> Self {
        Self { schema_version: 1, selected_id: "default".into(), profiles: vec![Profile {
            id: "default".into(), name: "X3".into(), polling: 1000,
            sensor: SensorProfile { dpi: [800,1600,2400,3200,5000,10000,50,50], enabled: [true,true,true,true,true,true,false,false], colors: [[255,0,0],[0,255,0],[0,0,255],[255,255,0],[0,255,255],[255,0,255],[255,64,0],[255,255,255]], active_stage: 2, lod_mm: 1, ripple_control: false, angle_snap: false, motion_sync: false }
        }] }
    }
}

pub fn load(path: &Path) -> Result<ProfileLibrary, String> {
    match fs::read(path) {
        Ok(bytes) => { let library: ProfileLibrary = serde_json::from_slice(&bytes).map_err(|e| e.to_string())?; library.validate()?; Ok(library) },
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(ProfileLibrary::default()),
        Err(e) => Err(e.to_string())
    }
}

/// Same-directory staging + write-through replacement preserves the old file
/// if serialization or staging fails. Never silently replaces malformed input.
pub fn save(path: &Path, library: &ProfileLibrary) -> Result<(), String> {
    library.validate()?;
    let bytes = serde_json::to_vec_pretty(library).map_err(|e| e.to_string())?;
    let parent = path.parent().ok_or("Invalid profile directory")?;
    fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    let temp = path.with_extension("json.pending");
    let mut file = fs::OpenOptions::new().write(true).create_new(true).open(&temp).map_err(|e| format!("Profile staging failed: {e}"))?;
    use std::io::Write;
    let staged = file.write_all(&bytes).and_then(|_| file.sync_all());
    drop(file);
    if let Err(e) = staged { let _ = fs::remove_file(&temp); return Err(e.to_string()); }
    use std::os::windows::ffi::OsStrExt;
    let source: Vec<u16> = temp.as_os_str().encode_wide().chain(Some(0)).collect();
    let destination: Vec<u16> = path.as_os_str().encode_wide().chain(Some(0)).collect();
    #[link(name="kernel32")]
    extern "system" { fn MoveFileExW(source: *const u16, destination: *const u16, flags: u32) -> i32; }
    if unsafe { MoveFileExW(source.as_ptr(), destination.as_ptr(), 1 | 8) } == 0 {
        let error = std::io::Error::last_os_error(); let _ = fs::remove_file(&temp); return Err(error.to_string());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn library_rejects_duplicates_invalid_selection_and_partial_sensor() {
        let library = ProfileLibrary::default(); assert!(library.validate().is_ok());
        let mut duplicate = library.clone(); duplicate.profiles.push(library.profiles[0].clone()); assert!(duplicate.validate().is_err());
        let mut invalid = library.clone(); invalid.selected_id = "missing".into(); assert!(invalid.validate().is_err());
        let mut invalid = library.clone(); invalid.profiles[0].sensor.dpi[0] = 49; assert!(invalid.validate().is_err());
        let mut invalid = library.clone(); invalid.schema_version = 2; assert!(invalid.validate().is_err());
    }
    #[test] fn persistence_roundtrip_preserves_eight_slots() {
        let folder = std::env::temp_dir().join(format!("x3-profile-test-{}-{}",std::process::id(),std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos()));
        let path = folder.join("profiles.json"); let library = ProfileLibrary::default();
        save(&path,&library).unwrap(); let loaded = load(&path).unwrap();
        assert_eq!(loaded.profiles[0].sensor.dpi, library.profiles[0].sensor.dpi);
        assert_eq!(loaded.profiles[0].sensor.colors, library.profiles[0].sensor.colors);
        save(&path,&loaded).unwrap();
        fs::remove_file(&path).unwrap(); fs::remove_dir(folder).unwrap();
    }
}
