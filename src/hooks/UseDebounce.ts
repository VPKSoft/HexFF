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

/**
 * A custom hook to debounce a callback for a specified time.
 * The timer resets if the callback it self is changed or the optional dependencies change.
 * @param {() => void} callBack The callback to be debounced.
 * @param {number} timeOut The debounce time in milliseconds.
 * @param {React.DependencyList} deps Additional dependencies for the effect.
 */
const useDebounce = (callBack: () => void | Promise<void>, timeOut: number, deps?: React.DependencyList) => {
    const lastTime = React.useRef<Date>(new Date());
    const effectPending = React.useRef<boolean>(false);

    const intervalCallBack = React.useCallback(() => {
        const timeDiffMs = Date.now() - lastTime.current.getTime();
        if (timeDiffMs > timeOut && effectPending.current) {
            lastTime.current = new Date();
            effectPending.current = false;
            void callBack();
            lastTime.current = new Date();
        }
    }, [callBack, timeOut]);

    React.useEffect(() => {
        const onInterval = setInterval(intervalCallBack, 50);

        return () => clearInterval(onInterval);
    }, [intervalCallBack]);

    // biome-ignore lint/correctness/useExhaustiveDependencies: These are supposed to be user defined dependencies
    React.useEffect(() => {
        lastTime.current = new Date();
        effectPending.current = true;
    }, [deps]);
};

/**
 * A custom hook to debounce a callback after a specified time if the user has not performed any interaction within the specified time interval.
 * @param {() => void} callBack The callback to be debounced.
 * @param {number} timeOut The debounce time in milliseconds.
 * @param {React.DependencyList} deps Additional dependencies for the effect.
 */
const useUserIdleDebounce = (callBack: () => void | Promise<void>, timeOut: number, deps?: React.DependencyList) => {
    const [interactionOccurred, setInteractionOccurred] = React.useState<Date>(new Date());

    const idleDebounce = React.useCallback(() => {
        void callBack();
    }, [callBack]);

    const useInteraction = React.useCallback(() => {
        setInteractionOccurred(new Date());
    }, []);

    React.useEffect(() => {
        globalThis.addEventListener("mousemove", useInteraction);
        globalThis.addEventListener("mousedown", useInteraction);
        globalThis.addEventListener("mouseup", useInteraction);
        globalThis.addEventListener("mousewheel", useInteraction);
        globalThis.addEventListener("keydown", useInteraction);
        globalThis.addEventListener("keyup", useInteraction);
        globalThis.addEventListener("keypress", useInteraction);
        return () => {
            globalThis.removeEventListener("mousemove", useInteraction);
            globalThis.removeEventListener("mousedown", useInteraction);
            globalThis.removeEventListener("mouseup", useInteraction);
            globalThis.removeEventListener("mousewheel", useInteraction);
            globalThis.removeEventListener("keydown", useInteraction);
            globalThis.removeEventListener("keyup", useInteraction);
            globalThis.removeEventListener("keypress", useInteraction);
        };
    }, [useInteraction]);

    useDebounce(idleDebounce, timeOut, [...(deps ?? []), interactionOccurred]);
};

export { useDebounce, useUserIdleDebounce };
