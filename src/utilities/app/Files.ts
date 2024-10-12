import { save, open } from "@tauri-apps/plugin-dialog";

/**
 * Displays an open file dialog and returns the user selected file.
 * @param extensionName The name of the file extension to display to the user via the open file dialog.
 * @param extension The file extension used in the open file dialog.
 * @returns The user selected file name as string or null if the dialog was canceled.
 */
const selectFileToOpen = async (extensionName: string) => {
    const filePath = await open({
        filters: [
            {
                name: extensionName,
                extensions: [],
            },
        ],
    });

    return filePath as string | null;
};

/**
 * Displays a save file dialog and returns the file name.
 * @param extensionName The name of the file extension to display to the user via the open file dialog.
 * @param extension The file extension used in the open file dialog.
 * @returns The user specified file name as string or null if the dialog was canceled.
 */
const selectFileToSave = async (extensionName: string) => {
    const filePath = await save({
        filters: [
            {
                name: extensionName,
                extensions: [],
            },
        ],
    });

    return filePath as string | null;
};

export { selectFileToOpen, selectFileToSave };
