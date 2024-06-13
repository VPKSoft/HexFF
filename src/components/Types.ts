/**
 * The common props for to be shared with among the components.
 */
type CommonProps = {
    /** The HTML class attribute. */
    className?: string;

    /** A value which uniquely identifies a node among items in an array. */
    key?: React.Key | null | undefined;
};

export type { CommonProps };
