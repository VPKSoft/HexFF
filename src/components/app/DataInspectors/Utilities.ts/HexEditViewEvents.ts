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

import { columns } from "../HexEditView";

const getHexInputElement = (fileIndex: number, id: number) => {
    return document.querySelector(`[data-input-id="${fileIndex}_${id}"]`) as HTMLElement | undefined;
};

const eventPreventAndStop = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
};

const focusInputId = (file_index: number, id: number) => {
    getHexInputElement(file_index, id)?.focus();
};

const HexEditViewKeyBoardHandler = (
    event: KeyboardEvent,
    fromPosition: number,
    setFromPosition: (value: number) => void,
    listenKeyboard: boolean,
    fileSize: number,
    rows: number,
    file_index: number
) => {
    if (!listenKeyboard) {
        return;
    }

    let currentPosition = fromPosition;
    const pageSize = rows * columns;
    const maxId = pageSize - 1;
    let id = -1;

    if (event.target instanceof HTMLElement) {
        const element = event.target as HTMLElement;
        if (element.classList.contains("InputCellInput")) {
            id = Number.parseInt(element.attributes.getNamedItem("id")?.value ?? "0");
            currentPosition = fromPosition + id;
        }
    }

    const maxPosition = fileSize - pageSize;

    switch (event.key) {
        case "PageUp": {
            if (id > 0) {
                // Move the cursor to the first input.
                focusInputId(file_index, 0);
                eventPreventAndStop(event);
            } else if (currentPosition - pageSize >= 0) {
                // Move the file position by one page size backward.
                setFromPosition(currentPosition - pageSize);
                eventPreventAndStop(event);
            } else if (currentPosition > 0) {
                // Move the file position to the start of the file.
                setFromPosition(0);
                eventPreventAndStop(event);
            }

            break;
        }
        case "PageDown": {
            if (id + 1 < pageSize) {
                // Move the cursor to the last input.
                focusInputId(file_index, pageSize - 1);
                eventPreventAndStop(event);
            } else if (fromPosition + pageSize <= maxPosition) {
                // Move the file position by one page size forward.
                setFromPosition(fromPosition + pageSize);
                eventPreventAndStop(event);
            } else if (fromPosition < maxPosition) {
                // Move the file position to the end of the file.
                setFromPosition(maxPosition);
                eventPreventAndStop(event);
            }

            break;
        }
        case "ArrowUp": {
            if (id > 0 && id - columns < 0) {
                // Move the cursor to the previous input if the first row is focused.
                focusInputId(file_index, id - 1);
                eventPreventAndStop(event);
            } else if (id - columns >= 0) {
                // Move the cursor to the previous row.
                focusInputId(file_index, id - columns);
                eventPreventAndStop(event);
            } else if (fromPosition - columns >= 0) {
                // Move the file position by one row backward.
                setFromPosition(fromPosition - columns);
                eventPreventAndStop(event);
            }

            break;
        }
        case "ArrowDown": {
            if (id < maxId && id + columns >= maxId) {
                // Move the cursor to the next input if the last row is focused.
                focusInputId(file_index, id + 1);
                eventPreventAndStop(event);
            } else if (id + 1 < pageSize) {
                // Move the cursor to the next row.
                focusInputId(file_index, id + columns);
                eventPreventAndStop(event);
            } else if (fromPosition + columns < fileSize) {
                // Move the file position by one row forward.
                setFromPosition(fromPosition + columns);
                eventPreventAndStop(event);
            }
            break;
        }

        case "ArrowLeft": {
            if (id > 0) {
                // Move the cursor to the previous input.
                focusInputId(file_index, id - 1);
                eventPreventAndStop(event);
            } else if (fromPosition - columns >= 0) {
                // Move the file position by one column backward.
                setFromPosition(fromPosition - columns);
                focusInputId(file_index, columns - 1);
                eventPreventAndStop(event);
            }

            break;
        }
        case "ArrowRight": {
            if (id < maxId) {
                // Move the cursor to the next input.
                const inputElement = getHexInputElement(file_index, id + 1);
                inputElement?.focus();
                eventPreventAndStop(event);
            } else if (fromPosition + columns < fileSize) {
                // Move the file position by one column forward.
                setFromPosition(fromPosition + columns);
                focusInputId(file_index, maxId + 1 - columns);
                eventPreventAndStop(event);
            }

            break;
        }

        // No default
    }
};

const HexEditViewMouseWheelHandler = (
    event: WheelEvent,
    fromPosition: number,
    setFromPosition: (value: number) => void,
    listenKeyboard: boolean,
    fileSize: number,
    rows: number
) => {
    if (!listenKeyboard) {
        return;
    }

    const pageSize = rows * columns;
    const maxPosition = fileSize - pageSize;

    if (event.deltaY < 0) {
        if (fromPosition - columns >= 0) {
            // Move the file position by one row size backward.
            setFromPosition(fromPosition - columns);
        } else {
            // Move the file position to the start of the file.
            setFromPosition(0);
        }
    } else if (event.deltaY > 0) {
        if (fromPosition + columns < maxPosition) {
            // Move the file position by one page size forward.
            setFromPosition(fromPosition + columns);
        } else if (fromPosition < maxPosition) {
            // Move the file position to the end of the file.
            setFromPosition(maxPosition);
        }
    }
};

export { HexEditViewKeyBoardHandler, HexEditViewMouseWheelHandler };
