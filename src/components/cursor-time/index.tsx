import type { CSSProperties, ForwardedRef } from "react";
import { memo, forwardRef, useImperativeHandle, useState, useRef } from "react";
import useSize from "../../useSize";
import "./index.scss";

export interface CursorTimeConfig {
    zIndex?: number;
    customShowTimeStyle?: CSSProperties;
}

export interface CursorTimeProps {
    config?: CursorTimeConfig;
    cursorColor?: string;
    cursorVisible?: boolean;
    timeFormat?: (seconds: number) => string;
}

export interface CursorTimeMethodType {
    updateCursorPosition?: (timeValue: number, x: number, clientX: number, right: number) => void;
    hideCursor?: () => void;
    showCursor?: () => void;
}

const CursorTime = forwardRef(
    ({ config, cursorColor, cursorVisible, timeFormat }: CursorTimeProps, ref: ForwardedRef<CursorTimeMethodType>) => {
        const { zIndex = 4, customShowTimeStyle } = config || {};
        const {
            backgroundColor = cursorColor,
            color = "#fff",
            padding = "2px",
            fontSize = "10px",
            ...restStyles
        } = customShowTimeStyle || {};

        const [left, setLeft] = useState<number>(0);
        const [opacity, setOpacity] = useState<number>(0);
        const [flip, setFlip] = useState<boolean>(false);
        const [cursorTime, setCursorTime] = useState<string>(() => timeFormat?.(0) || "00:00:00");
        const timeContentRef = useRef<HTMLDivElement>(null);
        const { width: timeContentWidth } = useSize(timeContentRef);

        useImperativeHandle(ref, () => ({
            updateCursorPosition: (timeValue: number, x: number, clientX: number, right: number) => {
                const formatValue = timeFormat?.(timeValue);
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

        if (!cursorVisible) {
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
                        ...restStyles,
                    }}
                >
                    {cursorTime}
                </div>
            </div>
        );
    },
);

export default memo(CursorTime);
