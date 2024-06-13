import * as React from "react";
import { styled } from "styled-components";
import classNames from "classnames";
import { Slider } from "antd";
import { CommonProps } from "../Types";
import { readFile } from "../../utilities/app/TauriWrappers";
import { NotificationType } from "../../hooks/UseNotify";
import { useTranslate } from "../../localization/Localization";
import { useDebounce } from "../../hooks/UseDebounce";
import { InputHex } from "./InputHex";

/**
 * The props for the {@link HexEditView} component.
 */
type HexEditViewProps = {
    rows: number;
    fileIndex: number;
    hexUpperCase?: boolean;
    fileSize: number;
    notification: (type: NotificationType, title: string | Error | null | undefined, duration?: number | undefined) => void;
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
    fileIndex,
    fileSize,
    hexUpperCase,
    notification,
}: HexEditViewProps) => {
    const [fromPosition, setFromPosition] = React.useState(0);
    const [hexData, setHexData] = React.useState<Array<number>>([]);

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

    // Memoize the inputs so that they don't need to be recreated on every render
    const inputsMemo = React.useMemo(() => {
        const inputs: JSX.Element[] = [];
        for (let i = 0; i < rows * columns; i++) {
            inputs.push(
                <InputHex //
                    className="InputCellInput"
                    key={i}
                    numId={i}
                    onHexValueChange={onHexValueChange}
                    hexValue={hexData[i]}
                    bytePosition={i}
                    hexUpperCase={hexUpperCase}
                />
            );
        }
        return inputs;
    }, [rows, onHexValueChange, hexData, hexUpperCase]);

    const tableMemo = React.useMemo(() => {
        const rowMap = Array.from({ length: rows });
        const columnMap = Array.from({ length: columns + 1 });
        let runningId = 0;
        let currentRow = -columns;
        const buffPosition = 0;
        let inputId = 0;

        return (
            <table>
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
                        max={fileSize}
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
            </div>
        </div>
    );
};

const renderTableHeading = (columIndex: number, runningId: number) => {
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

const renderDataCell = (columIndex: number, rowIndex: number, buffPosition: number, inputId: number, runningId: number, fromPosition: number, hexData: Array<number>, inputs: Array<JSX.Element>) => {
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

const formatterUpper = (value: number) => {
    return formatter(value, true) as React.ReactNode;
};

const formatterLower = (value: number) => {
    return formatter(value, false) as React.ReactNode;
};

const HexEditView = styled(HexEditViewComponent)`
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
    .InputCell {
        width: 40px;
        ${props => props.hexUpperCase && "text-transform: uppercase;"}
    }
    .InputRow {
        height: 20px;
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
