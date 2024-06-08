import { invoke } from "@tauri-apps/api/tauri";

const readFile = async (fileIndex: number, filePos: number) => {
    try {
        return (await invoke("read_file", { fileIndex, filePos })) as FileReadResult;
    } catch (error) {
        throw new Error(`${error}`);
    }
};

const readFileCurrentPos = async (fileIndex: number) => {
    try {
        return (await invoke("read_file_current_pos", { fileIndex })) as FileReadResult;
    } catch (error) {
        throw new Error(`${error}`);
    }
};

const openFile = async (fileName: string, readWrite: boolean): Promise<number> => {
    try {
        return (await invoke("open_file", { fileName, rw: readWrite })) as number;
    } catch (error) {
        throw new Error(`${error}`);
    }
};

type AppFileStateResult = {
    file_name: string;
    file_index: number;
    file_size: number;
    file_name_no_path: string;
};

type FileReadResult = {
    file_index: number;
    file_data: string;
};

const getOpenFiles = async () => {
    try {
        return (await invoke("get_open_files")) as AppFileStateResult[];
    } catch (error) {
        throw new Error(`${error}`);
    }
};

export { readFile, openFile, readFileCurrentPos, getOpenFiles };
export type { AppFileStateResult, FileReadResult };
