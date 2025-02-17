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

import { notification } from "antd";
import * as React from "react";

/**
 * Notification types for the {@link useNotify} hook.
 */
export type NotificationType = "success" | "info" | "warning" | "error";

/**
 * A custom hook for antd notifications.
 * @returns A context holder for the notifications to be embedded into the JSX and a callback to display notifications.
 */
const useNotify = (): [
    React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>>,
    (type: NotificationType, title: string | null | undefined | Error, duration?: number) => void,
] => {
    const [api, contextHolder] = notification.useNotification();

    const openNotificationWithIcon = React.useCallback(
        (type: NotificationType, title: string | null | undefined | Error, duration?: number) => {
            api[type]({
                message: title instanceof Error ? title?.toString() : title,
                duration: duration ?? 5,
            });
        },
        [api]
    );

    return [contextHolder, openNotificationWithIcon];
};

export { useNotify };
