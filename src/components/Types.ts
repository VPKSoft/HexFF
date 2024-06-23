/**
 * The common props for to be shared with among the components.
 */
type CommonProps = {
    /** The HTML class attribute. */
    className?: string;

    /** A value which uniquely identifies a node among items in an array. */
    key?: React.Key | null | undefined;
};

enum CharacterMode {
    Ascii,
    Utf8,
    Utf16,
    Utf32,
}

const encodingLookupOptions = [
    // eslint-disable-next-line unicorn/text-encoding-identifier-case
    { value: CharacterMode.Ascii, label: "ASCII" },
    // eslint-disable-next-line unicorn/text-encoding-identifier-case
    { value: CharacterMode.Utf8, label: "UTF-8" },
    { value: CharacterMode.Utf16, label: "UTF-16" },
    { value: CharacterMode.Utf32, label: "UTF-32" },
];

export { CharacterMode, encodingLookupOptions };
export type { CommonProps };
