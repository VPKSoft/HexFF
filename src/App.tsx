/*
MIT License

Copyright (c) 2024 VPKSoft

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

import * as React from "react";
import { useState } from "react";
import { exit } from "@tauri-apps/plugin-process";
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
import { useAntdTheme, useAntdToken } from "./context/AntdThemeContext";

/**
 * Renders the main application component.
 *
 * @return {JSX.Element} The rendered application component.
 */
const App = () => {
    const [aboutPopupVisible, setAboutPopupVisible] = React.useState(false);
    const [preferencesVisible, setPreferencesVisible] = React.useState(false);
    const [settings, settingsLoaded, updateSettings, reloadSettings] = useSettings();
    const [contextHolder, notification] = useNotify();
    const [openFiles, setOpenFiles] = useState<AppFileStateResult[]>([]);
    const { translate, setLocale } = useTranslate();
    const { token } = useAntdToken();
    const { setTheme, updateBackround } = useAntdTheme();
    const [previewDarkMode, setPreviewDarkMode] = React.useState<boolean | null>(null);

    const { setStateSaverEnabled, restoreState } = useWindowStateSaver(10_000);

    // Refresh the list of open files for the frontend side
    // as the state of the backend may already exist. E.g. for the reason
    // of the frontend refresh or similar.
    React.useEffect(() => {
        getOpenFiles()
            .then((openFiles: AppFileStateResult[]) => {
                setOpenFiles(openFiles);
            })
            .catch((error: Error) => {
                notification("error", translate("couldNotGetOpenedFiles", undefined, { error }));
            });
    }, [notification, translate]);

    // Enable the window state saver if the settings are loaded.
    // Also restore the previous window state.
    React.useEffect(() => {
        if (settingsLoaded && settings !== null) {
            setStateSaverEnabled(settings.save_window_state);
            void restoreState();
        }
    }, [restoreState, settingsLoaded, settings, setStateSaverEnabled]);

    // Set the locale used in to frontend.
    React.useEffect(() => {
        if (settings) {
            void setLocale(settings.locale);
        }
    }, [setLocale, settings]);

    // Return false to to allow the window to close.
    // In the future we may want to add a confirmation dialog here.
    const onClose = React.useCallback(() => {
        return false;
    }, []);

    // Close the about popup.
    const aboutPopupClose = React.useCallback(() => {
        setAboutPopupVisible(false);
    }, []);

    // Generate the menu items with the current locale.
    const menuItems = React.useMemo(() => {
        return appMenuItems(translate);
    }, [translate]);

    // Handle menu item and toolbar item clicks.
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

    // Close the preferences popup.
    const onPreferencesClose = React.useCallback(() => {
        setPreferencesVisible(false);
        void reloadSettings().then(() => {
            setPreviewDarkMode(null);
            setTheme?.(settings?.dark_mode ? "dark" : "light");
        });
    }, [reloadSettings, setTheme, settings?.dark_mode]);

    React.useEffect(() => {
        if (settings && setTheme) {
            void setLocale(settings.locale);
            setTheme(settings.dark_mode ? "dark" : "light");
        }
    }, [setLocale, setTheme, settings]);

    // This effect occurs when the theme token has been changed and updates the
    // root and body element colors to match to the new theme.
    React.useEffect(() => {
        updateBackround?.(token);
    }, [token, updateBackround]);

    const toggleDarkMode = React.useCallback(
        (antdTheme: "light" | "dark") => {
            setTheme?.(antdTheme);
            setPreviewDarkMode(antdTheme === "dark");
        },
        [setTheme]
    );

    // Don't render the app if the settings are not loaded yet.
    if (!settingsLoaded || settings === null) {
        return <div>Loading...</div>;
    }

    return (
        <>
            {contextHolder}
            <StyledTitle //
                title="HexFF"
                onClose={onClose}
                darkMode={previewDarkMode ?? settings.dark_mode ?? false}
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
                textColor="white"
            />
            {updateSettings && (
                <PreferencesPopup //
                    visible={preferencesVisible}
                    onClose={onPreferencesClose}
                    updateSettings={updateSettings}
                    settings={settings}
                    translate={translate}
                    toggleDarkMode={toggleDarkMode}
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
