import { faDoorOpen, faFolderOpen, faGear, faInfo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import * as React from "react";
import type { LocalizeFunction } from "../localization/Localization";
import type { ToolBarItem, ToolBarSeparator } from "./AppToolbar";
import type { MenuKeys } from "./MenuItems";

export const appToolbarItems = (localize?: LocalizeFunction): (ToolBarItem<MenuKeys> | ToolBarSeparator)[] => [
    {
        icon: <FontAwesomeIcon icon={faGear} />,
        title: localize?.("preferences") ?? "Preferences",
        tooltipTitle: localize?.("preferences") ?? "Preferences",
        clickActionObject: "preferencesMenu",
    },
    {
        icon: <FontAwesomeIcon icon={faDoorOpen} />,
        title: localize?.("exitMenu") ?? "Exit",
        tooltipTitle: localize?.("exitMenu") ?? "Exit",
        clickActionObject: "exitMenu",
    },
    "|",
    {
        icon: <FontAwesomeIcon icon={faInfo} />,
        title: localize?.("aboutMenu") ?? "About",
        tooltipTitle: localize?.("aboutMenu") ?? "About",
        clickActionObject: "aboutMenu",
    },
    "|",
    {
        icon: <FontAwesomeIcon icon={faFolderOpen} />,
        title: localize?.("openFile") ?? "Open file",
        tooltipTitle: localize?.("openFile") ?? "Open file",
        clickActionObject: "openFile",
    },
];
