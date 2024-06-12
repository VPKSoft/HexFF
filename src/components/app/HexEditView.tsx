import * as React from "react";
import { styled } from "styled-components";
import classNames from "classnames";
import { Input, InputRef, Slider } from "antd";
import { CommonProps } from "../Types";
import { readFile } from "../../utilities/app/TauriWrappers";
import { NotificationType } from "../../hooks/UseNotify";
import { useTranslate } from "../../localization/Localization";
import { useDebounce } from "../../hooks/UseDebounce";

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
    const inputs = React.useRef<JSX.Element[]>([]);
    const [table, setTable] = React.useState<JSX.Element>();

    const readError = React.useRef(false);

    const { translate } = useTranslate();

    const onCellChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const id = Number.parseInt(e.target.id);
        // eslint-disable-next-line no-console
        console.log(`${newValue} / ${id}`);
    }, []);

    // Memoize the inputs so that they don't need to be recreated on every render
    const makeInputs = React.useCallback(
        (valueBuff: Uint8Array) => {
            inputs.current = [];
            for (let i = 0; i < rows * columns; i++) {
                inputs.current.push(
                    <Input //
                        className="InputCellInput"
                        width={20}
                        key={i}
                        id={i.toString()}
                        onChange={onCellChange}
                        value={i + fromPosition >= fileSize ? "" : valueBuff[i].toString(16).padStart(2, "0")}
                    />
                );
            }
        },
        [rows, onCellChange, fromPosition, fileSize]
    );

    const makeTable = React.useCallback(
        (valueBuff: Uint8Array) => {
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
                                        ) : // eslint-disable-next-line prettier/prettier
                                    (buffPosition >= valueBuff.length ? (
                                            <td key={runningId++} />
                                        ) : (
                                            <td className="InputCell" key={runningId++}>
                                                {inputs.current[inputId++]}
                                            </td>
                                            // eslint-disable-next-line prettier/prettier
                                    ));
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            );
        },
        [fromPosition, inputs, rows]
    );

    const readFromPosition = React.useCallback(() => {
        readFile(fileIndex, fromPosition)
            .then(res => {
                const buff = Uint8Array.from(atob(res.file_data), c => c.codePointAt(0) ?? 0);
                makeInputs(buff);
                setTable(makeTable(buff));
                readError.current = false;
            })
            .catch((error: Error) => {
                readError.current = true;
                notification("error", translate("fileReadFailed", undefined, { error }));
            });
    }, [fileIndex, fromPosition, makeInputs, makeTable, notification, translate]);

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
                {table}
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
