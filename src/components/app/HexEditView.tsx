import * as React from "react";
import { styled } from "styled-components";
import { CommonProps } from "../Types";
import { NotificationType } from "../../hooks/UseNotify";
import { HextEditViewComponent } from "./HexEditViewComponent";

/**
 * The props for the {@link HexEditView} component.
 */
export type HexEditViewProps = {
    rows: number;
    fileIndex: number;
    hexUpperCase?: boolean;
    fileSize: number;
    notification: (type: NotificationType, title: string | Error | null | undefined, duration?: number | undefined) => void;
} & CommonProps;

export const columns: number = 16;

export const renderTableHeading = (columIndex: number, runningId: number) => {
    const result =
        columIndex === 0 ? (
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
                    {(columIndex - 1).toString(16).padStart(2, "0")}
                </div>
            </th>
        );
    return { jsx: result, runningId };
};

export const renderDataCell = (
    columIndex: number,
    rowIndex: number,
    buffPosition: number,
    inputId: number,
    runningId: number,
    fromPosition: number,
    hexData: Array<number>,
    inputs: Array<JSX.Element>
) => {
    const result =
        columIndex === 0 ? (
            <td key={runningId++}>
                <div //
                    className="OffsetCell"
                >
                    {(fromPosition + rowIndex).toString(16).padStart(8, "0")}
                </div>
            </td>
        ) : // eslint-disable-next-line prettier/prettier
    (buffPosition >= hexData.length ? (
            <td key={runningId++} />
        ) : (
            <td className="InputCell" key={runningId++}>
                {inputs[inputId++]}
            </td>
            // eslint-disable-next-line prettier/prettier
    ));

    return { jsx: result, runningId, inputId };
};

const formatter = (value: number, hexUpperCase: boolean) => {
    return hexUpperCase === true ? `${value.toString(16).padStart(8, "0").toUpperCase()}` : `${value.toString(16).padStart(8, "0")}`;
};

export const formatterUpper = (value: number) => {
    return formatter(value, true) as React.ReactNode;
};

export const formatterLower = (value: number) => {
    return formatter(value, false) as React.ReactNode;
};

const HexEditView = styled(HextEditViewComponent)`
    font-family: monospace;
    .HexEditView-Editor {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: row;
    }
    .HexEditView-Slider-Container {
        display: flex;
        min-height: 0px;
    }
    .HexEditView-Bytes-Container {
        width: 370px;
    }
    .InputCell {
        width: 40px;
        ${props => props.hexUpperCase && "text-transform: uppercase;"}
    }
    .InputRow {
        height: 20px;
    }
    InputTable {
        display: flex;
    }
    .InputCellInput {
        height: 25px;
        border-radius: 0px; // For maximum space, disable rounded corners
        font-family: monospace; // Monospace for hex edit input
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
