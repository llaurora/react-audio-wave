import { memo, useState, forwardRef, useImperativeHandle } from "react";
import type { ForwardedRef } from "react";

export interface LoadedPercentMethodType {
    changeLoadedPercent?: (currentPercent: string) => void;
}

const LoadedPercent = forwardRef((_, ref: ForwardedRef<LoadedPercentMethodType>) => {
    const [percent, setPercent] = useState<string>();

    useImperativeHandle(ref, () => ({
        changeLoadedPercent: (currentPercent: string) => {
            if (currentPercent !== undefined) {
                setPercent(currentPercent);
            }
        },
    }));

    return <span>{percent}</span>;
});

export default memo(LoadedPercent);
