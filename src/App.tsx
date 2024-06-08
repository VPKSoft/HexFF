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

    const { setStateSaverEnabled, restoreState } = useWindowStateSaver(10_000);

    React.useEffect(() => {
        if (settingsLoaded && settings !== null) {
            setStateSaverEnabled(settings.save_window_state);
            void restoreState();
        }
    }, [restoreState, settingsLoaded, settings, setStateSaverEnabled]);

    const { translate, setLocale } = useTranslate();

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
                                            notification("error", "Untranslated error: " + error);
                                        });
                                })
                                .catch((error: Error) => {
                                    notification("error", translate("fileOpenFailed", undefined, error));
                                });
                        })
                        .catch((error: Error) => {
                            notification("error", translate("fileOpenFailed", undefined, { error: error }));
                        });

                    break;
                }
                case "readFile": {
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
                {/* <HexEditView
                    rows={16}
                    fromPosition={256}
                    //                    value="aW1wb3J0ICogYXMgUmVhY3QgZnJvbSAicmVhY3QiOwppbXBvcnQgeyBzdHlsZWQgfSBmcm9tICJzdHlsZWQtY29tcG9uZW50cyI7CmltcG9ydCBjbGFzc05hbWVzIGZyb20gImNsYXNzbmFtZXMiOwppbXBvcnQgeyBJbnB1dCB9IGZyb20gImFudGQiOwppbXBvcnQgeyBDb21tb25Qcm9wcyB9IGZyb20gIi4uL1R5cGVzIjsKCi8qKgogKiBUaGUgcHJvcHMgZm9yIHRoZSB7QGxpbmsgSGV4RWRpdFZpZXd9IGNvbXBvbmVudC4KICovCnR5cGUgSGV4RWRpdFZpZXdQcm9wcyA9IHsKICAgIHJvd3M6IG51bWJlcjsKICAgIGZyb21Qb3NpdGlvbjogbnVtYmVyOwogICAgdmFsdWU6IHN0cmluZzsKfSAmIENvbW1vblByb3BzOwoKY29uc3QgY29sdW1uczogbnVtYmVyID0gMTY7CgovKioKICogQSAgY29tcG9uZW50IC4uLgogKiBAcGFyYW0gcGFyYW0wIFRoZSBjb21wb25lbnQgcHJvcHM6IHtAbGluayBIZXhFZGl0Vmlld1Byb3BzfS4KICogQHJldHVybnMgQSBjb21wb25lbnQuCiAqLwpjb25zdCBIZXhFZGl0Vmlld0NvbXBvbmVudCA9ICh7CiAgICBjbGFzc05hbWUsIC8vCiAgICByb3dzLAogICAgZnJvbVBvc2l0aW9uLAogICAgdmFsdWUsCn06IEhleEVkaXRWaWV3UHJvcHMpID0+IHsKICAgIGNvbnN0IHZhbHVlQnVmZiA9IFJlYWN0LnVzZU1lbW8oKCkgPT4gewogICAgICAgIHRyeSB7CiAgICAgICAgICAgIHJldHVybiBVaW50OEFycmF5LmZyb20oYXRvYih2YWx1ZSksIGMgPT4gYy5jb2RlUG9pbnRBdCgwKSA/PyAwKTsKICAgICAgICB9IGNhdGNoIHsKICAgICAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KCk7CiAgICAgICAgfQogICAgfSwgW3ZhbHVlXSk7CgogICAgY29uc3QgdGFibGVNZW1vID0gUmVhY3QudXNlTWVtbygoKSA9PiB7CiAgICAgICAgY29uc3Qgcm93TWFwID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogcm93cyB9KTsKICAgICAgICBjb25zdCBjb2x1bW5NYXAgPSBBcnJheS5mcm9tKHsgbGVuZ3RoOiBjb2x1bW5zICsgMSB9KTsKICAgICAgICBsZXQgcnVubmluZ0lkID0gMDsKICAgICAgICBsZXQgY3VycmVudFJvdyA9IC1jb2x1bW5zOwogICAgICAgIGxldCBidWZmUG9zaXRpb24gPSAwOwoKICAgICAgICByZXR1cm4gKAogICAgICAgICAgICA8dGFibGU+CiAgICAgICAgICAgICAgICB7Y29sdW1uTWFwLm1hcCgoXywgaTogbnVtYmVyKSA9PiB7CiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGkgPT09IDAgPyA8dGQga2V5PXtydW5uaW5nSWQrK30+eyJPZmZzZXQgKGgpIn08L3RkPiA6IDx0ZCBrZXk9e3J1bm5pbmdJZCsrfT57KGkgLSAxKS50b1N0cmluZygxNikucGFkU3RhcnQoMiwgIjAiKX08L3RkPjsKICAgICAgICAgICAgICAgIH0pfQogICAgICAgICAgICAgICAge3Jvd01hcC5tYXAoKCkgPT4gewogICAgICAgICAgICAgICAgICAgIGN1cnJlbnRSb3cgKz0gY29sdW1uczsKICAgICAgICAgICAgICAgICAgICByZXR1cm4gKAogICAgICAgICAgICAgICAgICAgICAgICA8dHIga2V5PXtydW5uaW5nSWQrK30+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7Y29sdW1uTWFwLm1hcCgoXywgaTogbnVtYmVyKSA9PiB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGkgPT09IDAgPyAoCiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDx0ZCBrZXk9e3J1bm5pbmdJZCsrfT57KGZyb21Qb3NpdGlvbiArIGN1cnJlbnRSb3cpLnRvU3RyaW5nKDE2KS5wYWRTdGFydCg4LCAiMCIpfTwvdGQ+CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKSA6ICgKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPHRkIGtleT17cnVubmluZ0lkKyt9PgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPElucHV0IGtleT17cnVubmluZ0lkKyt9IHZhbHVlPXt2YWx1ZUJ1ZmZbYnVmZlBvc2l0aW9uKytdLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCAiMCIpfSAvPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8L3RkPgogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KX0KICAgICAgICAgICAgICAgICAgICAgICAgPC90cj4KICAgICAgICAgICAgICAgICAgICApOwogICAgICAgICAgICAgICAgfSl9CiAgICAgICAgICAgIDwvdGFibGU+CiAgICAgICAgKTsKICAgIH0sIFtmcm9tUG9zaXRpb24sIHJvd3MsIHZhbHVlQnVmZl0pOwoKICAgIHJldHVybiAoCiAgICAgICAgPGRpdiAvLwogICAgICAgICAgICBjbGFzc05hbWU9e2NsYXNzTmFtZXMoSGV4RWRpdFZpZXcubmFtZSwgY2xhc3NOYW1lKX0KICAgICAgICA+CiAgICAgICAgICAgIHt0YWJsZU1lbW99CiAgICAgICAgPC9kaXY+CiAgICApOwp9OwoKY29uc3QgSGV4RWRpdFZpZXcgPSBzdHlsZWQoSGV4RWRpdFZpZXdDb21wb25lbnQpYAogICAgLy8gQWRkIHN0eWxlKHMpIGhlcmUKYDsKCmV4cG9ydCB7IEhleEVkaXRWaWV3IH07Cg=="
                    // value={"aW1wb3J0ICogYXMgUmVhY3QgZnJvbSAicmVhY3QiOwppbXBvcg=="}
                    value={hexEditValue}
                    hexUpperCase={true}
                /> */}
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
