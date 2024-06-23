use serde_derive::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct TextDataInPosition {
    pub text_ascii: String,
    pub text_le_utf8: String,
    pub text_le_utf16: String,
    pub text_le_utf32: String,
    pub text_be_utf8: String,
    pub text_be_utf16: String,
    pub text_be_utf32: String,
}

pub fn bytes_to_ascii(bytes: &[u8]) -> String {
    let mut result = String::new();
    for i in 0..bytes.len() {
        result.push(char::from(bytes[i] & 0x7f));
    }
    result
}

pub fn bytes_to_utf8(bytes: &[u8], big_endian: bool) -> String {
    let mut result = String::new();

    let mut last_skip = false;
    for i in 0..bytes.len() - 2 {
        if last_skip {
            last_skip = false;
            continue;
        }

        let buffer8: [u8; 1] = [bytes[i]];
        let buffer8_2: [u8; 1] = [bytes[i + 1]];

        let buffer16: [u8; 2] = if big_endian {
            [buffer8_2[0], buffer8[0]]
        } else {
            [buffer8[0], buffer8_2[0]]
        };

        let char_utf8_b1 = match String::from_utf8(buffer8.to_vec()) {
            Ok(s) => s,
            Err(_) => String::new(),
        };
        let char_utf8_b2 = match String::from_utf8(buffer16.to_vec()) {
            Ok(s) => s,
            Err(_) => String::new(),
        };

        let char1 = match char_utf8_b1.chars().nth(0) {
            Some(c) => c,
            None => ' ',
        };

        let char2_1 = match char_utf8_b2.chars().nth(0) {
            Some(c) => c,
            None => ' ',
        };

        let char2_2 = match char_utf8_b2.chars().nth(1) {
            Some(c) => c,
            None => '\0',
        };

        // The UTF-8 can consist of one or two bytes
        if char1 == char2_1 {
            // One character was generated from one byte
            result.push(char1);
        } else if char2_2 == '\0' {
            // One character was generated from two bytes
            result.push(char2_1);
        } else {
            // The two bytes generated to different characters
            result.push(char2_1);
            result.push(char2_2);
            last_skip = true;
        }
    }

    // The loop skipped the last byte, so make a character out of it
    if last_skip {
        let start_index = bytes.len() - 2;
        let stop_index = bytes.len() - 1;
        let buffer8: [u8; 1] = match bytes[start_index..stop_index] {
            [b] => [b],
            _ => [0],
        };

        let char_utf8_b1 = match String::from_utf8(buffer8.to_vec()) {
            Ok(s) => s,
            Err(_) => String::new(),
        };

        let char = match char_utf8_b1.chars().nth(0) {
            Some(c) => c,
            None => ' ',
        };
        result.push(char);
    }

    result
}

pub fn bytes_to_utf16(bytes: &[u8], big_endian: bool) -> String {
    let mut result = String::new();
    for i in 0..bytes.len() - 2 {
        let buffer16: [u8; 2] = if big_endian {
            [bytes[i], bytes[i + 1]]
        } else {
            [bytes[i + 1], bytes[i]]
        };
        let char_utf16 = match String::from_utf16(&[u16::from_le_bytes(buffer16)]) {
            Ok(s) => s,
            Err(_) => " ".to_string(),
        };
        result.push_str(&char_utf16);
        result.push(' ');
    }
    result
}

pub fn bytes_to_utf32(bytes: &[u8], big_endian: bool) -> String {
    let mut result = String::new();
    for i in 0..bytes.len() - 4 {
        let buffer32: [u8; 4] = if big_endian {
            [bytes[i], bytes[i + 1], bytes[i + 2], bytes[i + 3]]
        } else {
            [bytes[i + 3], bytes[i + 2], bytes[i + 1], bytes[i]]
        };
        let char_utf32 = match char::from_u32(u32::from_le_bytes(buffer32)) {
            Some(c) => c.to_string(),
            None => " ".to_string(),
        };
        result.push_str(&char_utf32);
        (0..3).into_iter().for_each(|_| result.push(' '));
    }
    result
}
