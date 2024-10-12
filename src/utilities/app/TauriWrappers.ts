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

import { invoke } from "@tauri-apps/api/core";

/**
 * Reads bytes from the specified file position specified by the file index.
 * @param {number} fileIndex The index of the file to read.
 * @param {number} filePos The position in the file to start reading.
 * @returns {Promise<FileReadResult>} The read file content as a base64 encoded string.
 */
const readFile = async (fileIndex: number, filePos: number) => {
    try {
        return (await invoke("read_file", { fileIndex, filePos })) as FileReadResult;
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Reads bytes from the current position in the file specified by the file index.
 * @param {number} fileIndex The index of the file to read.
 * @returns {Promise<FileReadResult>} The read file content as a base64 encoded string.
 */
const readFileCurrentPos = async (fileIndex: number) => {
    try {
        return (await invoke("read_file_current_pos", { fileIndex })) as FileReadResult;
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Opens a file specified by the file name and returns the file index.
 * @param {string} fileName The name of the file to open.
 * @param {boolean} readWrite A value indicating whether the file should be opened for reading and writing.
 * @returns {Promise<number>} The index of the opened file.
 */
const openFile = async (fileName: string, readWrite: boolean): Promise<number> => {
    try {
        return (await invoke("open_file", { fileName, rw: readWrite })) as number;
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * Reads the data in the specified position in the file specified by the file index in different formats.
 * @param {number} fileIndex The index of the file to read.
 * @param {number} filePos The position in the file to start reading from.
 * @returns {Promise<DataInPositionResult>} The read data in different formats.
 */
const getDataInPosition = async (fileIndex: number, filePos: number) => {
    try {
        return (await invoke("get_data_in_position", { fileIndex, filePos })) as DataInPositionResult;
    } catch (error) {
        throw new Error(`${error}`);
    }
};

/**
 * The file data in different formats in bot little and big endian.
 */
type DataInPositionResult = {
    value_le_u8: string;
    value_le_i8: string;
    value_le_u16: string;
    value_le_i16: string;
    value_le_u32: string;
    value_le_i32: string;
    value_le_u64: string;
    value_le_i64: string;
    value_le_u128: string;
    value_le_i128: string;
    value_le_f32: string;
    value_le_f64: string;
    char_le_ascii: string;
    char_le_utf8: string;
    char_le_utf16: string;
    char_le_utf32: string;
    value_be_u8: string;
    value_be_i8: string;
    value_be_u16: string;
    value_be_i16: string;
    value_be_u32: string;
    value_be_i32: string;
    value_be_u64: string;
    value_be_i64: string;
    value_be_u128: string;
    value_be_i128: string;
    value_be_f32: string;
    value_be_f64: string;
    char_be_ascii: string;
    char_be_utf8: string;
    char_be_utf16: string;
    char_be_utf32: string;
};

/**
 * The backend side application state.
 */
type AppFileStateResult = {
    file_name: string;
    file_index: number;
    file_size: number;
    file_name_no_path: string;
};

/**
 * The result file data in base64 encoded string and the file index.
 */
type FileReadResult = {
    file_index: number;
    file_data: string;
};

type TextDataInPosition = {
    text_ascii: string;
    text_le_utf8: string;
    text_le_utf16: string;
    text_le_utf32: string;
    text_be_utf8: string;
    text_be_utf16: string;
    text_be_utf32: string;
};

/**
 * Retrieves the list of open files.
 *
 * @return {Promise<AppFileStateResult[]>} A promise that resolves to an array of `AppFileStateResult` objects.
 * @throws {Error} If an error occurs during the retrieval of the open files.
 */
const getOpenFiles = async () => {
    try {
        return (await invoke("get_open_files")) as AppFileStateResult[];
    } catch (error) {
        throw new Error(`${error}`);
    }
};

const getTextDataInPosition = async (fileIndex: number) => {
    try {
        return (await invoke("get_text_data_in_position", { fileIndex })) as TextDataInPosition;
    } catch (error) {
        throw new Error(`${error}`);
    }
};

export { readFile, openFile, readFileCurrentPos, getOpenFiles, getDataInPosition, getTextDataInPosition };
export type { AppFileStateResult, FileReadResult, DataInPositionResult, TextDataInPosition };
