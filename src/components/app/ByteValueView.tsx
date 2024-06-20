/* eslint-disable unicorn/prefer-string-replace-all */
import * as React from "react";
import { styled } from "styled-components";
import classNames from "classnames";
import { CommonProps } from "../Types";
import { DataInPositionResult } from "../../utilities/app/TauriWrappers";

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
    const keys = React.useMemo(() => Object.keys(value || {}).filter(f => f.includes(bigEndian ? "_be" : "_le")), [bigEndian, value]);
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
                            {value ? (value[key as keyof DataInPositionResult] as string) : ""}
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
