import type { CSSProperties, ReactElement, ForwardedRef } from "react";
import { memo, useState, forwardRef, useImperativeHandle } from "react";
import classNames from "classnames";

interface WaveProgressProps {
    progressColor: string;
    children: ReactElement;
    className?: string;
    progressCursorVisible?: boolean;
    cursorColor?: string;
    progressStyle?: CSSProperties;
}

export interface WaveProgressInstanceMethodType {
    changeOffsetPixels?: (currentPixels: number) => void;
}

const WaveProgress = forwardRef(
    (
        { className, progressColor, progressStyle, children, cursorColor, progressCursorVisible }: WaveProgressProps,
        ref: ForwardedRef<WaveProgressInstanceMethodType>,
    ) => {
        const [offsetPixels, setOffsetPixels] = useState<number>(0);

        useImperativeHandle(ref, () => ({
            changeOffsetPixels: (currentPixels: number) => {
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
