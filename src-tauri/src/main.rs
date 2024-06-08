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
    io::{Read, Write},
};

use tauri::State;

/// The application file state for the Tauri application.
struct AppFileState {
    file: File,
    file_name: String,
    file_index: i32,
    file_size: u64,
    prev_seek_pos: u64,
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
            read_file_current_pos
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
            let file = std::fs::OpenOptions::new()
                .write(rw)
                .read(true)
                .open(file_name.clone())
                .unwrap();

            let file_len = file.metadata().unwrap().len();

            let index = state.len() as i32;

            state.push(AppFileState {
                file: file,
                file_name: file_name,
                file_index: index,
                file_size: file_len,
                prev_seek_pos: 0,
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
                Ok(_) => Ok(FileReadResult {
                    file_index: file_index,
                    file_data: BASE64_STANDARD.encode(&buffer),
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
