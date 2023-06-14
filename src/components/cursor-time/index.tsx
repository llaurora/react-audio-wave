import type { CSSProperties } from "react";
import { memo, forwardRef, useImperativeHandle, useState, useRef } from "react";
import useSize from "@/useSize";
import "./index.scss";

export interface CursorTimeConfig {
    zIndex?: number;
    formatTimeCallback?: (cursorTime: number) => string;
    customShowTimeStyle?: CSSProperties;
}

export interface CursorTimeProps {
    config: CursorTimeConfig;
}

const CursorTime = forwardRef(({ config }: CursorTimeProps, ref) => {
    const { zIndex = 4, customShowTimeStyle = {}, formatTimeCallback } = config || {};
    const { backgroundColor, color, padding, fontSize } = customShowTimeStyle;

    const [left, setLeft] = useState<number>(0);
    const [opacity, setOpacity] = useState<number>(0);
    const [flip, setFlip] = useState<boolean>(false);
    const [cursorTime, setCursorTime] = useState<string>("00:00:00");
    const timeContentRef = useRef<HTMLDivElement>(null);
    const { width: timeContentWidth } = useSize(timeContentRef);

    useImperativeHandle(ref, () => ({
        updateCursorPosition: (timeValue: number, x: number, clientX: number, right: number) => {
            const formatValue = formatTimeCallback?.(timeValue);
            setCursorTime(formatValue);
            setOpacity(1);
            setFlip(right < clientX + timeContentWidth);
            setLeft(x);
        },
        hideCursor: () => {
            setOpacity(0);
        },
        showCursor: () => {
            setOpacity(1);
        },
    }));

    if (!config) {
        return null;
    }

    return (
        <div
            className="cursor-time"
            style={{
                opacity,
                zIndex,
                left,
                borderLeftStyle: "solid",
                borderLeftWidth: 1,
                borderLeftColor: backgroundColor,
            }}
        >
            <div
                ref={timeContentRef}
                className="time"
                style={{
                    backgroundColor,
                    color,
                    padding,
                    fontSize,
                    marginLeft: flip ? -timeContentWidth : 0,
                }}
            >
                {cursorTime}
            </div>
        </div>
    );
});

export default memo(CursorTime);
