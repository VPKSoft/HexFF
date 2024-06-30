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
 * A custom hook to get the data props of the component props. The props must be passed as an object rather than destructured in this case. E.g. `const MyComponent = (props: Props) => { ... }`.
 * React does not prevent arbitrary data props from being passed to the component even though the they don't match the props object type.
 * @param props The props object to filter the data props from.
 * @returns An object containing the data props.
 */
const useDataProps = <T,>(props: T | undefined | null) => {
    const result = React.useMemo(() => {
        const result: Record<string, unknown> = {};
        if (props === undefined || props === null) {
            return result;
        }
        const keys = Object.keys(props);
        for (const key of keys) {
            if (/data-(\S+)/.test(key)) {
                result[key] = (props as Record<string, unknown>)[key];
            }
        }
        return result;
    }, [props]);

    return result;
};

export { useDataProps };
