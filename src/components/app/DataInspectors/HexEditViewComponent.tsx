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

import * as React from "react";
import classNames from "classnames";
import { Slider, Switch, Tabs } from "antd";
import { styled } from "styled-components";
import { readFile, DataInPositionResult, getDataInPosition, TextDataInPosition, getTextDataInPosition } from "../../../utilities/app/TauriWrappers";
import { useTranslate } from "../../../localization/Localization";
import { useDebounce, useUserIdleDebounce } from "../../../hooks/UseDebounce";
import { InputHex } from "../Inputs/InputHex";
import { HexEditViewProps, columns, renderTableHeading, renderDataCell, formatterUpper, formatterLower } from "./HexEditView";
import { ByteValueView } from "./ByteValueView";
import { TextValueView } from "./TextValueView";
import { HexEditViewKeyBoardHandler, HexEditViewMouseWheelHandler } from "./Utilities.ts/HexEditViewEvents";

/**
 * A component to edit and view binary data in hexadecimal format.
 * @param param0 The component props: {@link HexEditViewProps}.
 * @returns A component.
 */
const HextEditViewComponent = ({
    className, //
    rows,
    fileIndex,
    fileSize,
    hexUpperCase,
    activeTabKey,
    thisTabKey,
    notification,
}: HexEditViewProps) => {
    const [fromPosition, setFromPosition] = React.useState(0);
    const [hexData, setHexData] = React.useState<Array<number>>([]);
    const [positionByteValues, setPositionByteValues] = React.useState<DataInPositionResult | undefined>();
    const [positionTextValues, setPositionTextValues] = React.useState<TextDataInPosition | undefined>();
    const [bigEndian, setBigEndian] = React.useState(false);
    const [lastFocusedElement, setLastFocusedElement] = React.useState<HTMLElement | null>(null);

    const onElementFocus = React.useCallback(
        (e: FocusEvent) => {
            // eslint-disable-next-line unicorn/prefer-dom-node-dataset
            if (e.target instanceof HTMLElement && e.target.getAttribute("data-tab-id") === thisTabKey.toString()) {
                setLastFocusedElement(e.target);
            }
        },
        [thisTabKey]
    );

    const listenUserInteraction = React.useMemo(() => {
        return activeTabKey === thisTabKey;
    }, [activeTabKey, thisTabKey]);

    const focusPreviousElement = React.useCallback(() => {
        if (thisTabKey === activeTabKey && lastFocusedElement && lastFocusedElement !== document.activeElement) {
            lastFocusedElement.focus();
        }
    }, [activeTabKey, lastFocusedElement, thisTabKey]);

    // Add a listener for the focus event to keep the hex edit input focuced.
    React.useEffect(() => {
        document.addEventListener("focus", onElementFocus, true);
        return () => {
            document.removeEventListener("focus", onElementFocus);
        };
    }, [onElementFocus]);

    useUserIdleDebounce(focusPreviousElement, 700);

    const readError = React.useRef(false);

    const { translate } = useTranslate();

    const onHexValueChange = React.useCallback(
        (value: number, bytePosition: number) => {
            const modifyHexData = [...hexData];
            modifyHexData[bytePosition] = value;
            setHexData(modifyHexData);
        },
        [hexData]
    );

    const onFilePositionChange = React.useCallback(
        (value: number) => {
            void getDataInPosition(fileIndex, value).then(f => {
                setPositionByteValues(f);
            });
        },
        [fileIndex]
    );

    React.useEffect(() => {
        void getTextDataInPosition(fileIndex).then(f => {
            setPositionTextValues(f);
        });
    }, [fileIndex, fromPosition]);

    // Memoize the inputs so that they don't need to be recreated on every render
    const inputsMemo = React.useMemo(() => {
        const inputs: JSX.Element[] = [];
        for (let i = 0; i < rows * columns; i++) {
            inputs.push(
                <InputHex //
                    className="InputCellInput"
                    data-input-id={`${fileIndex}_${i}`}
                    key={i}
                    numId={i}
                    onHexValueChange={onHexValueChange}
                    hexValue={fromPosition + i >= fileSize ? undefined : hexData[i]}
                    bytePosition={i}
                    readonly={fromPosition + i >= fileSize}
                    filePosition={fromPosition + i}
                    onFilePositionChange={onFilePositionChange}
                    hexUpperCase={hexUpperCase}
                    tabId={thisTabKey}
                />
            );
        }
        return inputs;
    }, [rows, fileIndex, onHexValueChange, fromPosition, fileSize, hexData, onFilePositionChange, hexUpperCase, thisTabKey]);

    const tableMemo = React.useMemo(() => {
        const rowMap = Array.from({ length: rows });
        const columnMap = Array.from({ length: columns + 1 });
        let runningId = 0;
        let currentRow = -columns;
        const buffPosition = 0;
        let inputId = 0;

        return (
            <div>
                <table className="InputTable">
                    <thead>
                        <tr>
                            {columnMap.map((_, i: number) => {
                                const result = renderTableHeading(i, runningId);
                                runningId = result.runningId;
                                return result.jsx;
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {rowMap.map(() => {
                            currentRow += columns;
                            return (
                                <tr key={runningId++} className="InputRow">
                                    {columnMap.map((_, i: number) => {
                                        const result = renderDataCell(i, currentRow, buffPosition, inputId, runningId, fromPosition, hexData, inputsMemo);
                                        runningId = result.runningId;
                                        inputId = result.inputId;
                                        return result.jsx;
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    }, [fromPosition, hexData, inputsMemo, rows]);

    const readFromPosition = React.useCallback(() => {
        readFile(fileIndex, fromPosition)
            .then(res => {
                const buff = Uint8Array.from(atob(res.file_data), c => c.codePointAt(0) ?? 0);
                setHexData([...buff]);
                readError.current = false;
            })
            .catch((error: Error) => {
                readError.current = true;
                notification("error", translate("fileReadFailed", undefined, { error }));
            });
    }, [fileIndex, fromPosition, notification, translate]);

    useDebounce(readFromPosition, 100);

    // Memoize either the upper or lower case formatter.
    const formatter = React.useMemo(() => {
        return hexUpperCase === true ? (value?: number | undefined) => formatterUpper(value ?? 0) : (value?: number | undefined) => formatterLower(value ?? 0);
    }, [hexUpperCase]);

    const onChange = React.useCallback((value: number) => {
        setFromPosition(value);
    }, []);

    const onSwitchChange = React.useCallback((checked: boolean) => {
        setBigEndian(checked);
    }, []);

    const onKeyDown = React.useCallback(
        (event: KeyboardEvent) => {
            HexEditViewKeyBoardHandler(event, fromPosition, setFromPosition, listenUserInteraction, fileSize, rows, fileIndex);
        },
        [fileIndex, fileSize, fromPosition, listenUserInteraction, rows]
    );

    const onMouseWheel = React.useCallback(
        (event: WheelEvent) => {
            HexEditViewMouseWheelHandler(event, fromPosition, setFromPosition, listenUserInteraction, fileSize, rows);
        },
        [fileSize, fromPosition, listenUserInteraction, rows]
    );

    React.useEffect(() => {
        if (listenUserInteraction) {
            window.addEventListener("keydown", onKeyDown);
            window.addEventListener("wheel", onMouseWheel);
        }
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("wheel", onMouseWheel);
        };
    }, [onKeyDown, listenUserInteraction, onMouseWheel]);

    return (
        <div //
            className={classNames(HexEditView.name, className)}
        >
            <div //
                className="HexEditView-Editor"
            >
                {tableMemo}
                <div className="HexEditView-Slider-Container">
                    <Slider //
                        min={0}
                        max={fileSize - rows * columns}
                        value={fromPosition}
                        onChange={onChange}
                        vertical
                        className="HexEditView-Slider"
                        reverse
                        step={columns}
                        tooltip={{
                            formatter,
                        }}
                    />
                </div>
                <Tabs //
                    items={[
                        {
                            label: translate("dataInspector"),
                            key: "1",
                            children: (
                                <div className="HexEditView-Bytes-Container">
                                    <ByteValueView //
                                        value={positionByteValues}
                                        bigEndian={bigEndian}
                                    />
                                    <div>
                                        {translate("bigEndian")}
                                        <Switch //
                                            className="Switch"
                                            checked={bigEndian}
                                            onChange={onSwitchChange}
                                        />
                                    </div>
                                </div>
                            ),
                        },
                        {
                            label: translate("textInspector"),
                            key: "2",
                            children: (
                                <TextValueView //
                                    rows={rows}
                                    value={positionTextValues}
                                />
                            ),
                        },
                    ]}
                />
            </div>
        </div>
    );
};

const HexEditView = styled(HextEditViewComponent)`
    .Switch {
        margin-left: 10px;
    }
`;

export { HexEditView as HextEditViewComponent };
