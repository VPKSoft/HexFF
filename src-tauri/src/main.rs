/*
MIT License

Copyright (c) 2024 VPKSoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use base64::prelude::*;
use config::{get_app_config, set_app_config, AppConfig};
use hex_data::{get_data_in_bytes, read_byte_encodings};
use serde::{Deserialize, Serialize};
use std::io::Seek;
use std::path::Path;
use std::{
    io::Read, // Add Write when the file is to be written into.
};
use string_encodings::TextDataInPosition;
use tauri::State;
use types::{AppFileState, AppFileStateResult, AppState, DataInPosition};

mod config;
mod hex_data;
mod string_encodings;
mod types;

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
            get_data_in_position,
            get_text_data_in_position
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
async fn get_text_data_in_position(
    file_index: usize,
    app_state: State<'_, AppState>,
) -> Result<TextDataInPosition, String> {
    match app_state.file.lock() {
        Ok(files) => {
            let buffer = &files[file_index].bytes_at_pos;

            let data = read_byte_encodings(buffer);
            Ok(data)
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
            let buffer_pos = match file_pos.checked_sub(files[file_index].prev_seek_pos) {
                Some(pos) => pos,
                None => 0,
            };

            if (buffer_pos as usize) >= files[file_index].bytes_at_pos.len() {
                return Err("Invalid file position".to_string());
            }

            let buffer = &files[file_index].bytes_at_pos[buffer_pos as usize..1024];

            let data = get_data_in_bytes(buffer);

            Ok(data)
        }
        Err(e) => Err(e.to_string()),
    }
}
