import { memo, useState, forwardRef, useImperativeHandle, CSSProperties, ReactElement } from "react";
import classNames from "classnames";

interface WaveProgressProps {
    progressColor: string;
    children: ReactElement;
    className?: string;
    progressCursorVisible?: boolean;
    cursorColor?: string;
    progressStyle?: CSSProperties;
}

const WaveProgress = forwardRef(
    (
        { className, progressColor, progressStyle, children, cursorColor, progressCursorVisible }: WaveProgressProps,
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
            <div
                className={classNames(className)}
                style={{
                    ...progressStyle,
                    width: offsetPixels,
                    borderRight: progressCursorVisible ? `1px solid ${cursorColor || progressColor}` : "none",
                }}
            >
                {children}
            </div>
        );
    },
);

export default memo(WaveProgress);
