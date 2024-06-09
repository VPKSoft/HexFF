import * as React from "react";
import { useState } from "react";
import { exit } from "@tauri-apps/api/process";
import { styled } from "styled-components";
import "./App.css";
import { StyledTitle } from "./components/app/WindowTitle";
import { useTranslate } from "./localization/Localization";
import { AppMenu } from "./menu/AppMenu";
import { MenuKeys, appMenuItems } from "./menu/MenuItems";
import { AboutPopup } from "./components/popups/AboutPopup";
import { AppToolbar } from "./menu/AppToolbar";
import { appToolbarItems } from "./menu/ToolbarItems";
import { PreferencesPopup } from "./components/popups/PreferencesPopup";
import { useSettings } from "./utilities/app/Settings";
import { useWindowStateSaver } from "./hooks/UseWindowStateListener";
import { selectFileToOpen } from "./utilities/app/Files";
import { useNotify } from "./hooks/UseNotify";
import { AppFileStateResult, getOpenFiles, openFile } from "./utilities/app/TauriWrappers";
import { TabbedFilesComponent } from "./components/app/TabbedFilesComponent";

const textColor = "white";
const backColor = "#199CF4";

/**
 * Renders the main application component.
 *
 * @return {JSX.Element} The rendered application component.
 */
const App = () => {
    const [aboutPopupVisible, setAboutPopupVisible] = React.useState(false);
    const [preferencesVisible, setPreferencesVisible] = React.useState(false);
    const [settings, settingsLoaded, updateSettings] = useSettings();
    const [contextHolder, notification] = useNotify();
    const [openFiles, setOpenFiles] = useState<AppFileStateResult[]>([]);
    const { translate, setLocale } = useTranslate();

    const { setStateSaverEnabled, restoreState } = useWindowStateSaver(10_000);

    React.useEffect(() => {
        getOpenFiles()
            .then((openFiles: AppFileStateResult[]) => {
                setOpenFiles(openFiles);
            })
            .catch((error: Error) => {
                notification("error", translate("couldNotGetOpenedFiles", undefined, { error }));
            });
    }, [notification, translate]);

    React.useEffect(() => {
        if (settingsLoaded && settings !== null) {
            setStateSaverEnabled(settings.save_window_state);
            void restoreState();
        }
    }, [restoreState, settingsLoaded, settings, setStateSaverEnabled]);

    React.useEffect(() => {
        if (settings) {
            void setLocale(settings.locale);
        }
    }, [setLocale, settings]);

    const onClose = React.useCallback(() => {
        return false;
    }, []);

    const aboutPopupClose = React.useCallback(() => {
        setAboutPopupVisible(false);
    }, []);

    const menuItems = React.useMemo(() => {
        return appMenuItems(translate);
    }, [translate]);

    const onMenuItemClick = React.useCallback(
        (key: unknown) => {
            const keyValue = key as MenuKeys;
            switch (keyValue) {
                case "exitMenu": {
                    void exit(0);
                    break;
                }
                case "aboutMenu": {
                    setAboutPopupVisible(true);
                    break;
                }
                case "preferencesMenu": {
                    setPreferencesVisible(true);
                    break;
                }
                case "openFile": {
                    void selectFileToOpen(translate("allFiles"))
                        .then((filePath: string | null) => {
                            if (filePath === null) {
                                return;
                            }
                            openFile(filePath, false)
                                .then(() => {
                                    getOpenFiles()
                                        .then((openFiles: AppFileStateResult[]) => {
                                            setOpenFiles(openFiles);
                                        })
                                        .catch((error: Error) => {
                                            notification("error", translate("couldNotGetOpenedFiles", undefined, { error }));
                                        });
                                })
                                .catch((error: Error) => {
                                    notification("error", translate("fileOpenFailed", undefined, { error }));
                                });
                        })
                        .catch((error: Error) => {
                            notification("error", translate("fileOpenFailed", undefined, { error }));
                        });

                    break;
                }
                default: {
                    break;
                }
            }
        },
        [notification, translate]
    );

    const onPreferencesClose = React.useCallback(() => {
        setPreferencesVisible(false);
    }, []);

    if (!settingsLoaded || settings === null) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {contextHolder}
            <StyledTitle //
                title="HexFF"
                onClose={onClose}
                textColor={textColor}
                backColor={backColor}
                maximizeTitle={translate("maximize")}
                minimizeTitle={translate("minimize")}
                closeTitle={translate("close")}
            />
            <div className="AppMenu">
                <AppMenu //
                    items={menuItems}
                    onItemClick={onMenuItemClick}
                />
                <AppToolbar //
                    toolBarItems={appToolbarItems(translate)}
                    onItemClick={onMenuItemClick}
                />
            </div>
            <div>
                <TabbedFilesComponent //
                    openFiles={openFiles}
                    notification={notification}
                />
            </div>
            <AboutPopup //
                visible={aboutPopupVisible}
                onClose={aboutPopupClose}
                textColor={textColor}
            />
            {updateSettings && (
                <PreferencesPopup //
                    visible={preferencesVisible}
                    onClose={onPreferencesClose}
                    updateSettings={updateSettings}
                    settings={settings}
                    translate={translate}
                />
            )}
        </>
    );
};

const SyledApp = styled(App)`
    height: 100%;
    width: 100%;
    display: contents;
    .AppMenu {
        display: flex;
        flex-direction: column;
        min-height: 0px;
        margin-bottom: 10px;
    }
`;

export { SyledApp as App };
