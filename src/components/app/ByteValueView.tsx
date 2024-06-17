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
} & CommonProps;

/**
 * A  component ...
 * @param param0 The component props: {@link ByteValueViewProps}.
 * @returns A component.
 */
const ByteValueViewComponent = ({
    className, //
    value,
}: ByteValueViewProps) => {
    // Get DataInPositionResult type keys
    const keys = Object.keys(value || {});

    const dataCells = React.useMemo(() => {
        const result: JSX.Element[] = [];

        for (const key of keys) {
            result.push(
                <tr>
                    <td>
                        <div> {key.split("_")[1]}</div>
                    </td>
                    <td>
                        <div>{value ? (value[key as keyof DataInPositionResult] as string) : ""}</div>
                    </td>
                </tr>
            );
        }

        return result;
    }, [keys, value]);

    return (
        <table //
            className={classNames(ByteValueView.name, className)}
        >
            <tbody>{dataCells}</tbody>
        </table>
    );
};

const ByteValueView = styled(ByteValueViewComponent)`
    overflow: auto;
    .DataRow {
        height: 10px;
    }

    .DataCell {
        text-align: right;
        height: 10px;
    }
`;

export { ByteValueView };
