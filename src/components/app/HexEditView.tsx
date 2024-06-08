import * as React from "react";
import { styled } from "styled-components";
import classNames from "classnames";
import { Input } from "antd";
import { CommonProps } from "../Types";

/**
 * The props for the {@link HexEditView} component.
 */
type HexEditViewProps = {
    rows: number;
    fromPosition: number;
    value: string | null;
    hexUpperCase?: boolean;
} & CommonProps;

const columns: number = 16;

/**
 * A component to edit and view binary data in hexadecimal format.
 * @param param0 The component props: {@link HexEditViewProps}.
 * @returns A component.
 */
const HexEditViewComponent = ({
    className, //
    rows,
    fromPosition,
    value,
}: HexEditViewProps) => {
    const valueBuff = React.useMemo(() => {
        if (value === null) {
            return new Uint8Array();
        }

        try {
            return Uint8Array.from(atob(value), c => c.codePointAt(0) ?? 0);
        } catch {
            return new Uint8Array();
        }
    }, [value]);

    const onCellChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const id = Number.parseInt(e.target.id);
        console.log(`${newValue} / ${id}`);
    }, []);

    const tableMemo = React.useMemo(() => {
        const rowMap = Array.from({ length: rows });
        const columnMap = Array.from({ length: columns + 1 });
        let runningId = 0;
        let currentRow = -columns;
        let buffPosition = 0;
        let inputId = 0;

        return (
            <table>
                <thead>
                    <tr>
                        {columnMap.map((_, i: number) => {
                            return i === 0 ? (
                                <th key={runningId++}>
                                    <div //
                                        className="HeaderCell"
                                        key={runningId++}
                                    >
                                        {"Offset (h)"}
                                    </div>
                                </th>
                            ) : (
                                <th key={runningId++}>
                                    <div //
                                        className="HeaderCell"
                                    >
                                        {(i - 1).toString(16).padStart(2, "0")}
                                    </div>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {rowMap.map(() => {
                        currentRow += columns;
                        return (
                            <tr key={runningId++} className="InputRow">
                                {columnMap.map((_, i: number) => {
                                    return i === 0 ? (
                                        <td key={runningId++}>
                                            <div //
                                                className="OffsetCell"
                                            >
                                                {(fromPosition + currentRow).toString(16).padStart(8, "0")}
                                            </div>
                                        </td>
                                    ) : (buffPosition >= valueBuff.length ? (
                                        <td key={runningId++} />
                                    ) : (
                                        <td className="InputCell" key={runningId++}>
                                            <Input //
                                                className="InputCellInput"
                                                width={20}
                                                key={runningId++}
                                                id={(inputId++).toString()}
                                                onChange={onCellChange}
                                                value={valueBuff[buffPosition++].toString(16).padStart(2, "0")}
                                            />
                                        </td>
                                    ));
                                })}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    }, [fromPosition, onCellChange, rows, valueBuff]);

    return (
        <div //
            className={classNames(HexEditView.name, className)}
        >
            {tableMemo}
        </div>
    );
};

const HexEditView = styled(HexEditViewComponent)`
    font-family: monospace;
    .InputCell {
        width: 40px;
        ${props => props.hexUpperCase && "text-transform: uppercase;"}
    }
    .InputRow {
        height: 20px;
    }
    .InputCellInput {
        height: 25px;
        ${props => props.hexUpperCase && "text-transform: uppercase;"}
    }
    .HeaderCell {
        font-align: center;
        ${props => props.hexUpperCase && "text-transform: uppercase;"}
    }
    .OffsetCell {
        ${props => props.hexUpperCase && "text-transform: uppercase;"}
        font-align: center;
        font-weight: bolder;
    }
`;

export { HexEditView };
