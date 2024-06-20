// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::prelude::*;
use config::{get_app_config, set_app_config, AppConfig};
use serde::{Deserialize, Serialize};
use std::io::Seek;
use std::path::Path;
use std::sync::Mutex;
use std::{
    fs::File,
    io::Read, // Add Write when the file is to be written into.
};
use tauri::State;

/// The application file state for the Tauri application.
struct AppFileState {
    file: File,
    file_name: String,
    file_index: i32,
    file_size: u64,
    prev_seek_pos: u64,
    bytes_at_pos: [u8; 1024],
}

#[derive(Serialize, Deserialize)]
struct DataInPosition {
    value_le_u8: String,
    value_le_i8: String,
    value_le_u16: String,
    value_le_i16: String,
    value_le_u32: String,
    value_le_i32: String,
    value_le_u64: String,
    value_le_i64: String,
    value_le_u128: String,
    value_le_i128: String,
    value_le_f32: String,
    value_le_f64: String,
    char_le_ascii: String,
    char_le_utf8: String,
    char_le_utf16: String,
    char_le_utf32: String,
    value_be_u8: String,
    value_be_i8: String,
    value_be_u16: String,
    value_be_i16: String,
    value_be_u32: String,
    value_be_i32: String,
    value_be_u64: String,
    value_be_i64: String,
    value_be_u128: String,
    value_be_i128: String,
    value_be_f32: String,
    value_be_f64: String,
    char_be_ascii: String,
    char_be_utf8: String,
    char_be_utf16: String,
    char_be_utf32: String,
}

/// The application state for the Tauri application.
struct AppState {
    file: Mutex<Vec<AppFileState>>,
}

/// The application default state for the Tauri application.
impl ::std::default::Default for AppState {
    fn default() -> Self {
        Self {
            file: Mutex::new(Vec::new()),
        }
    }
}

/// The application state seriazable result data.
#[derive(Serialize, Deserialize)]
struct AppFileStateResult {
    file_name: String,
    file_name_no_path: String,
    file_index: usize,
    file_size: u64,
}

mod config;

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            load_settings,
            save_settings,
            open_file,
            read_file,
            get_open_files,
            read_file_current_pos,
            get_data_in_position
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// Loads the application settings requested by the frontend.
///
/// # Returns
/// Application settings.
#[tauri::command]
async fn load_settings() -> AppConfig {
    get_app_config()
}

/// Saves the settings passed from the frontend.
///
/// # Arguments
///
/// `config` - the application configuration.
///
/// # Returns
/// `true` if the settings were saved successfully; `false` otherwise.
#[tauri::command]
async fn save_settings(config: AppConfig) -> bool {
    set_app_config(config)
}

/// Opens a file to the application.
///
/// # Arguments
/// * `file_name` - the name of the file to open.
/// * `rw` - whether the file should be opened for reading or writing.
///
/// # Returns
///
#[tauri::command]
async fn open_file(
    file_name: String,
    rw: bool,
    app_state: State<'_, AppState>,
) -> Result<i32, String> {
    match app_state.file.lock() {
        Ok(mut state) => {
            let mut file = std::fs::OpenOptions::new()
                .write(rw)
                .read(true)
                .open(file_name.clone())
                .unwrap();

            let file_len = file.metadata().unwrap().len();

            let index = state.len() as i32;

            let mut buffer = [0; 1024];
            match file.read(&mut buffer) {
                Ok(_) => {}
                Err(e) => return Err(e.to_string()),
            }

            state.push(AppFileState {
                file: file,
                file_name: file_name,
                file_index: index,
                file_size: file_len,
                prev_seek_pos: 0,
                bytes_at_pos: buffer,
            });

            Ok(index)
        }
        Err(e) => Err(e.to_string()),
    }
}

/// The file read result data.
#[derive(Serialize, Deserialize)]
struct FileReadResult {
    file_index: usize,
    file_data: String,
}

/// Reads the current position in the file from the application.
///
/// # Arguments
/// * `file_index` - the index of the file to read.
///
/// # Returns
/// The read file content as a base64 encoded string.
#[tauri::command]
async fn read_file_current_pos(
    file_index: usize,
    app_state: State<'_, AppState>,
) -> Result<FileReadResult, String> {
    let pos = match app_state.file.lock() {
        Ok(files) => files[file_index].prev_seek_pos,
        Err(e) => return Err(e.to_string()),
    };

    read_file(file_index, pos, app_state).await
}

/// Reads a file from the application.
///
/// # Arguments
/// * `file_index` - the index of the file to read.
/// * `file_pos` - the position in the file to start reading.
///
/// # Returns
/// The read file content as a base64 encoded string.
#[tauri::command]
async fn read_file(
    file_index: usize,
    file_pos: u64,
    app_state: State<'_, AppState>,
) -> Result<FileReadResult, String> {
    let mut buffer: [u8; 1024] = [0; 1024];

    match app_state.file.lock() {
        Ok(mut files) => {
            if file_index >= files.len() {
                return Err("Invalid file index".to_string());
            }
            if file_pos >= files[file_index].file_size {
                return Err("Invalid file position".to_string());
            }

            files[file_index].prev_seek_pos = file_pos;
        }
        Err(e) => return Err(e.to_string()),
    }

    match app_state.file.lock() {
        Ok(mut file) => match file[file_index]
            .file
            .seek(std::io::SeekFrom::Start(file_pos))
        {
            Ok(_) => match file[file_index].file.read(&mut buffer) {
                Ok(_) => Ok({
                    file[file_index].bytes_at_pos = buffer;

                    FileReadResult {
                        file_index: file_index,
                        file_data: BASE64_STANDARD.encode(&buffer),
                    }
                }),
                Err(e) => Err(e.to_string()),
            },
            Err(e) => Err(e.to_string()),
        },
        Err(e) => Err(e.to_string()),
    }
}

/// Returns the list of open files from the Tauri application state.
///
/// # Arguments
/// * `app_state` - The application state.
///
/// # Returns
/// A list of open files.
#[tauri::command]
fn get_open_files(app_state: State<'_, AppState>) -> Result<Vec<AppFileStateResult>, String> {
    match app_state.file.lock() {
        Ok(files) => {
            let mut file_list = Vec::new();

            for (_, file) in files.iter().enumerate() {
                let path = Path::new(&file.file_name);
                let filename = path.file_name().unwrap();

                file_list.push(AppFileStateResult {
                    file_name: file.file_name.clone(),
                    file_index: file.file_index as usize,
                    file_size: file.file_size,
                    file_name_no_path: filename.to_str().unwrap().to_string(),
                });
            }
            Ok(file_list)
        }
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn get_data_in_position(
    file_index: usize,
    file_pos: u64,
    app_state: State<'_, AppState>,
) -> Result<DataInPosition, String> {
    match app_state.file.lock() {
        Ok(files) => {
            let buffer_pos = file_pos - files[file_index].prev_seek_pos;
            let buffer = &files[file_index].bytes_at_pos[buffer_pos as usize..];

            let buffer8: [u8; 1] = buffer[0..1].try_into().unwrap();
            let buffer8_2: [u8; 1] = buffer[1..2].try_into().unwrap();
            let buffer16: [u8; 2] = buffer[0..2].try_into().unwrap();
            let buffer32: [u8; 4] = buffer[0..4].try_into().unwrap();
            let buffer64 = buffer[0..8].try_into().unwrap();
            let buffer128 = buffer[0..16].try_into().unwrap();

            let char_ascii = char::from(buffer8[0]).to_string();
            let char_utf8 = match String::from_utf8(buffer16.to_vec()) {
                Ok(s) => s,
                Err(_) => String::new(),
            };

            let mut buffer16be: [u8; 2] = [0, 2];
            let value_u8: u8 = u8::from_be_bytes(buffer8);
            let char_ascii_be = char::from(value_u8).to_string();
            buffer16be[1] = value_u8;
            let value_u8: u8 = u8::from_be_bytes(buffer8_2);
            buffer16be[0] = value_u8;
            let char_utf8_be = match String::from_utf8(buffer16be.to_vec()) {
                Ok(s) => s,
                Err(_) => String::new(),
            };

            let number = if buffer.len() > 1 {
                ((buffer[0] as u16) << 8) | buffer[1] as u16
            } else {
                0 as u16
            };

            let number_be = if buffer.len() > 1 {
                ((buffer16be[0] as u16) << 8) | buffer16be[1] as u16
            } else {
                0 as u16
            };

            let mut u16vec: Vec<u16> = Vec::new();
            u16vec.push(number);

            let char_utf16 = match String::from_utf16(&u16vec) {
                Ok(s) => s,
                Err(_) => String::new(),
            };

            let mut u16vec: Vec<u16> = Vec::new();
            u16vec.push(number_be);

            let char_utf16be = match String::from_utf16(&u16vec) {
                Ok(s) => s,
                Err(_) => String::new(),
            };

            let char_utf32 = match char::from_u32(u32::from_le_bytes(buffer32)) {
                Some(c) => c.to_string(),
                None => String::new(),
            };

            let char_utf32_be = match char::from_u32(u32::from_be_bytes(buffer32)) {
                Some(c) => c.to_string(),
                None => String::new(),
            };

            let data = DataInPosition {
                value_le_u8: u8::from_le_bytes(buffer8).to_string(),
                value_le_i8: i8::from_le_bytes(buffer8).to_string(),
                value_le_u16: u16::from_le_bytes(buffer16).to_string(),
                value_le_i16: i16::from_le_bytes(buffer16).to_string(),
                value_le_u32: u32::from_le_bytes(buffer32).to_string(),
                value_le_i32: i32::from_le_bytes(buffer32).to_string(),
                value_le_u64: u64::from_le_bytes(buffer64).to_string(),
                value_le_i64: i64::from_le_bytes(buffer64).to_string(),
                value_le_u128: u128::from_le_bytes(buffer128).to_string(),
                value_le_i128: i128::from_le_bytes(buffer128).to_string(),
                value_le_f32: format!("{:e}", f32::from_le_bytes(buffer32)),
                value_le_f64: format!("{:e}", f64::from_le_bytes(buffer64)),
                value_be_u8: u8::from_be_bytes(buffer8).to_string(),
                value_be_i8: i8::from_be_bytes(buffer8).to_string(),
                value_be_u16: u16::from_be_bytes(buffer16).to_string(),
                value_be_i16: i16::from_be_bytes(buffer16).to_string(),
                value_be_u32: u32::from_be_bytes(buffer32).to_string(),
                value_be_i32: i32::from_be_bytes(buffer32).to_string(),
                value_be_u64: u64::from_be_bytes(buffer64).to_string(),
                value_be_i64: i64::from_be_bytes(buffer64).to_string(),
                value_be_u128: u128::from_be_bytes(buffer128).to_string(),
                value_be_i128: i128::from_be_bytes(buffer128).to_string(),
                value_be_f32: format!("{:e}", f32::from_be_bytes(buffer32)),
                value_be_f64: format!("{:e}", f64::from_be_bytes(buffer64)),
                char_le_ascii: char_ascii,
                char_le_utf8: char_utf8,
                char_le_utf16: char_utf16,
                char_le_utf32: char_utf32,
                char_be_ascii: char_ascii_be,
                char_be_utf8: char_utf8_be,
                char_be_utf16: char_utf16be,
                char_be_utf32: char_utf32_be,
            };

            Ok(data)
        }
        Err(e) => Err(e.to_string()),
    }
}
