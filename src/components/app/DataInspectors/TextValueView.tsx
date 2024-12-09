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

import { Select, Switch } from "antd";
import classNames from "classnames";
import * as React from "react";
import type { JSX } from "react";
import { styled } from "styled-components";
import { useTranslate } from "../../../localization/Localization";
import type { TextDataInPosition } from "../../../utilities/app/TauriWrappers";
import { CharacterMode, type CommonProps, encodingLookupOptions } from "../../Types";
import { columns } from "./HexEditView";
/**
 * The props for the {@link TextValueView} component.
 */
type TextValueViewProps = {
    rows: number;
    value: TextDataInPosition | undefined;
} & CommonProps;

/**
 * A component to visualize a byte array in a table as text with different encodings.
 * @param param0 The component props: {@link TextValueViewProps}.
 * @returns A component.
 */
const TextValueViewComponent = ({
    className, //
    rows,
    value,
}: TextValueViewProps) => {
    const [characterMode, setCharacterMode] = React.useState(CharacterMode.Ascii);
    const { translate } = useTranslate();
    const [bigEndian, setBigEndian] = React.useState(false);

    const tableMemo = React.useMemo(() => {
        const result: JSX.Element[] = [];
        // Create an array with the length of columns.
        const columnMap = Array.from({ length: columns }).fill(0);
        for (let i = 0; i < rows; i++) {
            result.push(
                <tr key={i}>
                    {columnMap.map((_, j: number) => {
                        return <td key={j}>{getCharCode(value, i * columns + j, bigEndian, characterMode)}</td>;
                    })}
                </tr>
            );
        }
        return result;
    }, [bigEndian, characterMode, rows, value]);

    const onSwitchChange = React.useCallback((checked: boolean) => {
        setBigEndian(checked);
    }, []);

    return (
        <div //
            className={classNames(TextValueView.name, className)}
        >
            <div className="EncodingSelect">
                <div className="EncodingSelectLabel">{translate("characterEncoding")}</div>
                <Select //
                    className="EncodingSelectSelect"
                    value={characterMode}
                    onChange={setCharacterMode}
                    options={encodingLookupOptions}
                />
            </div>
            <table className="TextValueTable">
                <tbody>{tableMemo}</tbody>
            </table>
            <div className="EncodingSelect">
                <div className="EncodingSelectLabel">{translate("bigEndian")}</div>
                <Switch //
                    className="Switch"
                    checked={bigEndian}
                    onChange={onSwitchChange}
                />
            </div>
        </div>
    );
};

const getCharCode = (
    value: TextDataInPosition | undefined,
    position: number,
    bigEndian: boolean,
    characterMode: CharacterMode
) => {
    switch (characterMode) {
        case CharacterMode.Ascii: {
            const result = value?.text_ascii[position];
            return result;
        }
        case CharacterMode.Utf8: {
            const result = bigEndian ? value?.text_be_utf8[position] : value?.text_le_utf8[position];
            return result;
        }
        case CharacterMode.Utf16: {
            const result = bigEndian ? value?.text_be_utf16[position] : value?.text_le_utf16[position];
            return result;
        }
        case CharacterMode.Utf32: {
            const result = bigEndian ? value?.text_be_utf32[position] : value?.text_le_utf32[position];
            return result;
        }
    }
};

const TextValueView = styled(TextValueViewComponent)`
    width: 370px;
    flex-direction: column;
    .TextValueTable {
        width: 100%;
        font-family: monospace;
        font-size: 0.8rem;
    }
    .EncodingSelect {
        display: flex;
        width: 100%;
        gap: 10px;
    }
    .EncodingSelectLabel {
        align-self: center;
        width: auto;
        text-wrap: nowrap;
    }
    .EncodingSelectSelect {
        width: 100%;
    }
`;

export { TextValueView };
