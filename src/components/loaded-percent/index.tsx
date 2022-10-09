import { memo, useState, forwardRef, useImperativeHandle } from "react";

const LoadedPercent = forwardRef((_, ref) => {
    const [percent, setPercent] = useState<string>();

    useImperativeHandle(ref, () => ({
        changeLoadedPercent: (currentPercent) => {
            if (currentPercent !== undefined) {
                setPercent(currentPercent);
            }
        },
    }));

    return <span>{percent}</span>;
});

export default memo(LoadedPercent);
