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

use crate::{
    string_encodings::{
        bytes_to_ascii, bytes_to_utf16, bytes_to_utf32, bytes_to_utf8, TextDataInPosition,
    },
    types::DataInPosition,
};

pub fn read_byte_encodings(data: &[u8]) -> TextDataInPosition {
    let text_ascii = bytes_to_ascii(data);
    let text_le_utf8 = bytes_to_utf8(data, false);
    let text_le_utf16 = bytes_to_utf16(data, false);
    let text_le_utf32 = bytes_to_utf32(data, false);
    let text_be_utf8 = bytes_to_utf8(data, true);
    let text_be_utf16 = bytes_to_utf16(data, true);
    let text_be_utf32 = bytes_to_utf32(data, true);

    TextDataInPosition {
        text_ascii,
        text_le_utf8,
        text_le_utf16,
        text_le_utf32,
        text_be_utf8,
        text_be_utf16,
        text_be_utf32,
    }
}

pub fn get_data_in_bytes(data: &[u8]) -> DataInPosition {
    let buffer8: [u8; 1] = data[0..1].try_into().unwrap();
    let buffer8_2: [u8; 1] = data[1..2].try_into().unwrap();
    let buffer16: [u8; 2] = data[0..2].try_into().unwrap();
    let buffer32: [u8; 4] = data[0..4].try_into().unwrap();
    let buffer64 = data[0..8].try_into().unwrap();
    let buffer128 = data[0..16].try_into().unwrap();

    let mut string_ascii: String = String::new();

    for b in buffer8.iter() {
        string_ascii.push(char::from(*b & 0x7f));
    }

    let mut buffer16be: [u8; 2] = [0, 2];
    let value_u8: u8 = u8::from_be_bytes(buffer8);
    let char_ascii = char::from(value_u8).to_string();
    let char_ascii_be = char::from(value_u8).to_string();
    buffer16be[1] = value_u8;
    let value_u8: u8 = u8::from_be_bytes(buffer8_2);
    buffer16be[0] = value_u8;

    let char_utf8 = match String::from_utf8(buffer16.to_vec()) {
        Ok(s) => s,
        Err(_) => String::new(),
    };

    let char_utf8_be = match String::from_utf8(buffer16be.to_vec()) {
        Ok(s) => s,
        Err(_) => String::new(),
    };

    let number = if data.len() > 1 {
        ((data[0] as u16) << 8) | data[1] as u16
    } else {
        0 as u16
    };

    let number_be = if data.len() > 1 {
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
        char_be_ascii: char_ascii_be,
        char_le_utf16: char_utf16,
        char_be_utf16: char_utf16be,
        char_le_utf32: char_utf32,
        char_be_utf32: char_utf32_be,
        char_le_utf8: char_utf8,
        char_be_utf8: char_utf8_be,
    };

    data
}
