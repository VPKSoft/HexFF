import classNames from "classnames";
import * as React from "react";
import type { JSX } from "react";
import { styled } from "styled-components";
import type { DataInPositionResult } from "../../../utilities/app/TauriWrappers";
import type { CommonProps } from "../../Types";

/**
 * The props for the {@link ByteValueView} component.
 */
type ByteValueViewProps = {
    value: DataInPositionResult | undefined;
    bigEndian: boolean;
} & CommonProps;

const replaceEndiannes = /_le|_be/g;

/**
 * A component to visualize different data from file position.
 * @param param0 The component props: {@link ByteValueViewProps}.
 * @returns A component.
 */
const ByteValueViewComponent = ({
    className, //
    value,
    bigEndian,
}: ByteValueViewProps) => {
    // Get DataInPositionResult type keys
    const keys = React.useMemo(
        () => Object.keys(value ?? dataInPositionResultDefault).filter(f => f.includes(bigEndian ? "_be" : "_le")),
        [bigEndian, value]
    );
    let componentKey = 0;

    const dataCells = React.useMemo(() => {
        const result: JSX.Element[] = [];

        for (const key of keys) {
            result.push(
                <tr className="DataRow" key={componentKey++}>
                    <td key={componentKey++} className="DataCellHeader">
                        <div className="DataRow" key={componentKey++}>
                            {key.replace(replaceEndiannes, "").split("_")[1]}
                        </div>
                    </td>
                    <td key={componentKey++} className="DataRow">
                        <div className="DataCell" key={componentKey++}>
                            {value ? getValueByKey(key as DataInPositionResultKey, value) : ""}
                        </div>
                    </td>
                </tr>
            );
        }

        return result;
    }, [componentKey, keys, value]);

    return (
        <table //
            className={classNames(ByteValueView.name, className)}
        >
            <tbody //
                className="TableBody"
            >
                {dataCells}
            </tbody>
        </table>
    );
};

type DataInPositionResultKey = keyof DataInPositionResult;

// This will allow the component to render correcly even if there is no data available.
const dataInPositionResultDefault: DataInPositionResult = {
    value_le_u8: "",
    value_le_i8: "",
    value_le_u16: "",
    value_le_i16: "",
    value_le_u32: "",
    value_le_i32: "",
    value_le_u64: "",
    value_le_i64: "",
    value_le_u128: "",
    value_le_i128: "",
    value_le_f32: "",
    value_le_f64: "",
    char_le_ascii: "",
    char_le_utf8: "",
    char_le_utf16: "",
    char_le_utf32: "",
    value_be_u8: "",
    value_be_i8: "",
    value_be_u16: "",
    value_be_i16: "",
    value_be_u32: "",
    value_be_i32: "",
    value_be_u64: "",
    value_be_i64: "",
    value_be_u128: "",
    value_be_i128: "",
    value_be_f32: "",
    value_be_f64: "",
    char_be_ascii: "",
    char_be_utf8: "",
    char_be_utf16: "",
    char_be_utf32: "",
};

const getValueByKey = (key: DataInPositionResultKey, value: DataInPositionResult) => {
    if (
        key === "char_le_ascii" ||
        key === "char_be_ascii" ||
        key === "char_le_utf8" ||
        key === "char_be_utf8" ||
        key === "char_le_utf16" ||
        key === "char_be_utf16" ||
        key === "char_le_utf32" ||
        key === "char_be_utf32"
    ) {
        return (value[key] as string)[0];
    }
    return value[key];
};

const ByteValueView = styled(ByteValueViewComponent)`
    display: flex;
    width: 100%;
    .TableBody {
        width: 100%;
    }
    .DataRow {
        width: 100%;
    }
    .DataCellHeader {
        width: 100%;
        font-weight: bolder;
    }
    .DataCell {
        text-align: right;
        width: 100%;
    }
`;

export { ByteValueView };
