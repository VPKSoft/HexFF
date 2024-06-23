import * as React from "react";
import classNames from "classnames";
import { Tabs } from "antd";
import { styled } from "styled-components";
import { AppFileStateResult, FileReadResult, readFileCurrentPos } from "../../utilities/app/TauriWrappers";
import { useTranslate } from "../../localization/Localization";
import { CommonProps } from "../Types";
import { NotificationType } from "../../hooks/UseNotify";
import { HexEditView } from "./DataInspectors/HexEditView";

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
    const [activeTabKey, setActiveTabKey] = React.useState(0);
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
                notification("error", translate("fileReadFailed", undefined, { error }));
            });
    }, [notification, openFiles, translate]);

    const items = React.useMemo(() => {
        return openFileData.map(f => {
            return {
                label: f.file_name_no_path,
                key: f.file_index.toString(),
                closable: true,
                children: (
                    <HexEditView //
                        notification={notification}
                        rows={16}
                        fileIndex={f.file_index}
                        fileSize={f.file_size}
                        activeTabKey={activeTabKey}
                        thisTabKey={f.file_index}
                    />
                ),
            };
        });
    }, [activeTabKey, notification, openFileData]);

    const onTabChange = React.useCallback((activeTabKey?: string) => {
        setActiveTabKey(activeTabKey ? Number.parseInt(activeTabKey) : 0);
    }, []);

    return (
        <Tabs //
            className={classNames(TabbedFiles.name, className)}
            items={items}
            type="editable-card"
            hideAdd
            onChange={onTabChange}
        />
    );
};

const TabbedFiles = styled(TabbedFilesComponent)`
    width: 100%;
    height: 100%;
`;

export { TabbedFiles };
