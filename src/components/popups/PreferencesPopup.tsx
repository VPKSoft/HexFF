/*
MIT License

Copyright (c) 2024 Petteri Kautonen

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

import { Button, Checkbox, Modal, Select } from "antd";
import type { CheckboxChangeEvent } from "antd/es/checkbox";
import classNames from "classnames";
import * as React from "react";
import { styled } from "styled-components";
import { type Locales, type LocalizeFunction, currentLocales } from "../../localization/Localization";
import type { Settings } from "../../utilities/app/Settings";
import type { CommonProps } from "../Types";

/**
 * The props for the {@link PreferencesPopup} component.
 */
type PreferencesPopupProps = {
    /** A value indicating whether this popup is visible. */
    visible: boolean;
    /** The current program settings. */
    settings: Settings;
    /** A call back to toggle the dark mode. */
    toggleDarkMode: (antdTheme: "light" | "dark") => void;
    /** A call back to update the settings. */
    updateSettings: (settings: Settings) => Promise<void>;
    /** A call back to close the popup. */
    onClose: () => void;
    /** The function to get the localized string. */
    translate: LocalizeFunction;
} & CommonProps;

/**
 * A component to set the application preferences.
 * @param param0 The component props: {@link PreferencesPopupProps}.
 * @returns A component.
 */
const PreferencesPopupComponent = ({
    className, //
    visible,
    settings,
    toggleDarkMode,
    onClose,
    updateSettings,
    translate,
}: PreferencesPopupProps) => {
    const [settingsInternal, setSettingsInternal] = React.useState<Settings>(settings);

    React.useEffect(() => {
        setSettingsInternal(settings);
    }, [settings]);

    // Memoize the popup title.
    const title = React.useMemo(() => translate("settings"), [translate]);

    // Save the locale Lookup value into the internal state.
    const onLocaleValueChanged = React.useCallback(
        (value: string) => {
            const valueNew = value as Locales;
            setSettingsInternal({ ...settingsInternal, locale: valueNew });
        },
        [settingsInternal]
    );

    const setSaveWindowState = React.useCallback(
        (e: CheckboxChangeEvent) => {
            setSettingsInternal({ ...settingsInternal, save_window_state: e.target.checked === true });
        },
        [settingsInternal]
    );

    const setDarkMode = React.useCallback(
        (e: CheckboxChangeEvent) => {
            toggleDarkMode(e.target.checked === true ? "dark" : "light");
            setSettingsInternal({ ...settingsInternal, dark_mode: e.target.checked === true });
        },
        [settingsInternal, toggleDarkMode]
    );

    // The OK button was clicked.
    const onOkClick = React.useCallback(() => {
        void updateSettings(settingsInternal).then(() => {
            onClose();
        });
    }, [onClose, settingsInternal, updateSettings]);

    // The Cancel button was clicked.
    const onCancelClick = React.useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <Modal //
            title={title}
            open={visible}
            width={600}
            centered
            onCancel={onCancelClick}
            keyboard
            footer={null}
        >
            <div className={classNames(PreferencesPopup.name, className)}>
                <table>
                    <tbody>
                        <tr>
                            <td>
                                <div>{translate("language")}</div>
                            </td>
                            <td>
                                <Select //
                                    className="Select-width"
                                    options={currentLocales}
                                    fieldNames={{ label: "name", value: "code" }}
                                    onChange={onLocaleValueChanged}
                                    value={settingsInternal.locale}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div>{translate("saveWindowPosition")}</div>
                            </td>
                            <td>
                                <Checkbox //
                                    checked={settingsInternal.save_window_state}
                                    onChange={setSaveWindowState}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <div>{translate("darkMode")}</div>
                            </td>
                            <td>
                                <Checkbox //
                                    checked={settingsInternal.dark_mode}
                                    onChange={setDarkMode}
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div className="Popup-ButtonRow">
                    <Button //
                        onClick={onOkClick}
                    >
                        {translate("ok")}
                    </Button>
                    <Button //
                        onClick={onCancelClick}
                    >
                        {translate("cancel")}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

const PreferencesPopup = styled(PreferencesPopupComponent)`
    display: flex;
    flex-direction: column;
    height: 100%;
    .Popup-content {
        height: 100%;
    }
    .Popup-ButtonRow {
        display: flex;
        width: 100%;
        flex-direction: row;
        justify-content: flex-end;
    }
    .Select-width {
        width: 300px;
    }
`;

export { PreferencesPopup };
