import { memo, useState, forwardRef, useImperativeHandle, CSSProperties } from "react";
import classNames from "classnames";

interface WaveProgressProps {
    progressCursor: boolean;
    progressColor: string;
    progressClassName?: string;
    progressCursorClassName?: string;
    progressStyle?: CSSProperties;
}

const WaveProgress = forwardRef(
    (
        { progressCursor, progressClassName, progressColor, progressCursorClassName, progressStyle }: WaveProgressProps,
        ref,
    ) => {
        const [offsetPixels, setOffsetPixels] = useState<number>(0);

        useImperativeHandle(ref, () => ({
            changeOffsetPixels: (currentPixels) => {
                if (currentPixels !== undefined) {
                    setOffsetPixels(currentPixels);
                }
            },
        }));

        return (
            <>
                <div
                    className={classNames({ [progressClassName]: !!progressClassName })}
                    style={{ ...progressStyle, backgroundColor: progressColor, width: offsetPixels }}
                />
                {progressCursor ? (
                    <div
                        className={classNames({ [progressCursorClassName]: !!progressCursorClassName })}
                        style={{ backgroundColor: progressColor, transform: `translateX(${offsetPixels}px)` }}
                    />
                ) : null}
            </>
        );
    },
);

export default memo(WaveProgress);
