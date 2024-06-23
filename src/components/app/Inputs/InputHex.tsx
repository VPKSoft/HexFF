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
import { styled } from "styled-components";
import classNames from "classnames";
import { Input } from "antd";
import { CommonProps } from "../../Types";

/**
 * The props for the {@link InputHex} component.
 */
type InputHexProps = {
    numId?: number;
    hexValue?: number;
    hexUpperCase?: boolean;
    bytePosition: number;
    filePosition: number;
    tabId?: number;
    onFilePositionChange: (value: number) => void;
    onHexValueChange: (value: number, bytePosition: number) => void;
} & CommonProps;

const validateValue = /[\dA-Fa-f]{1,2}/;
const fullValidateValue = /[\dA-Fa-f]{2}/;

/**
 * A hexadecimal input component.
 * @param param0 The component props: {@link InputHexProps}.
 * @returns A component.
 */
const InputHexComponent = ({
    className, //
    key,
    numId,
    hexValue,
    bytePosition,
    filePosition,
    tabId,
    onFilePositionChange,
    onHexValueChange,
}: InputHexProps) => {
    const [editValue, setEdditValue] = React.useState<string | null>(null);

    const onChange = React.useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = e.target.value;

            if (newValue === "") {
                setEdditValue(newValue);
            } else if (fullValidateValue.test(newValue)) {
                setEdditValue(null);
                const hexValue = Number.parseInt(newValue, 16);
                onHexValueChange(hexValue, bytePosition);
            } else if (validateValue.test(newValue)) {
                setEdditValue(newValue);
            } else {
                setEdditValue(null); // Clear the focused cell on invalid input
            }
        },
        [bytePosition, onHexValueChange]
    );

    const onBlur = React.useCallback(() => {
        setEdditValue(null);
    }, []);

    const onFocus = React.useCallback(() => {
        onFilePositionChange(filePosition);
    }, [filePosition, onFilePositionChange]);

    return (
        <Input //
            className={classNames(InputHex.name, className)}
            key={key}
            id={numId?.toString()}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            maxLength={2}
            data-tab-id={tabId}
            minLength={1}
            value={editValue ?? hexValue?.toString(16).padStart(2, "0") ?? ""}
            pattern="[\dA-Fa-f]{0,2}"
            required
        />
    );
};

const InputHex = styled(InputHexComponent)`
    ${props => props.hexUpperCase && "text-transform: uppercase;"}
`;

export { InputHex };
