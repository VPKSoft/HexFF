import * as React from "react";
import classNames from "classnames";
import { Tabs } from "antd";
import { styled } from "styled-components";
import { AppFileStateResult, FileReadResult, readFileCurrentPos } from "../../utilities/app/TauriWrappers";
import { useTranslate } from "../../localization/Localization";
import { CommonProps } from "../Types";
import { NotificationType } from "../../hooks/UseNotify";
import { HexEditView } from "./HexEditView";

/**
 * The props for the {@link TabbedFiles} component.
 */
export type TabbedFilesProps = {
    openFiles: AppFileStateResult[];
    notification: (type: NotificationType, title: string | Error | null | undefined, duration?: number | undefined) => void;
} & CommonProps;

/**
 * A  component ...
 * @param param0 The component props: {@link TabbedFilesProps}.
 * @returns A component.
 */
export const TabbedFilesComponent = ({
    className, //
    openFiles,
    notification,
}: TabbedFilesProps) => {
    const [openFileData, setOpenFileData] = React.useState<Array<AppFileStateResult & { data: string }>>([]);
    const { translate } = useTranslate();

    React.useEffect(() => {
        const openFileDataPromises = openFiles.map(f => {
            return readFileCurrentPos(f.file_index);
        });

        const newOpenFileData: Array<AppFileStateResult & { data: string }> = [];

        Promise.all(openFileDataPromises)
            .then((res: FileReadResult[]) => {
                newOpenFileData.push(...res.map(r => ({ ...openFiles[r.file_index], data: r.file_data })));
                setOpenFileData(newOpenFileData);
            })
            .catch((error: Error) => {
                notification("error", translate("fileReadFailed", undefined, { error: error }));
            });
    }, [notification, openFiles, translate]);

    const items = React.useMemo(() => {
        return openFileData.map(f => {
            return {
                label: f.file_name_no_path,
                key: f.file_index.toString(),
                children: (
                    <HexEditView //
                        rows={16}
                        fromPosition={0}
                        value={f.data}
                    />
                ),
            };
        });
    }, [openFileData]);

    return (
        <Tabs //
            className={classNames(TabbedFiles.name, className)}
            items={items}
        ></Tabs>
    );
};

const TabbedFiles = styled(TabbedFilesComponent)`
    width: 100%;
    height: 100%;
`;

export { TabbedFiles };
