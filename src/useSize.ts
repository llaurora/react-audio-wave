import { useState, useLayoutEffect, MutableRefObject } from "react";
import ResizeObserver from "resize-observer-polyfill";

export type Size = { width: number; height: number };

type TargetValue<T> = T | undefined | null;

type TargetType = HTMLElement | Element | Window | Document;

export type BasicTarget<T extends TargetType = Element> =
    | (() => TargetValue<T>)
    | TargetValue<T>
    | MutableRefObject<TargetValue<T>>;

const useSize = (target: BasicTarget, onSizeChange?: (size: Size) => void): Size => {
    const [size, setSize] = useState<Size>({ width: undefined, height: undefined });

    useLayoutEffect(() => {
        let targetElement;

        if (typeof target === "function") {
            targetElement = target();
        } else if ("current" in target) {
            targetElement = target.current;
        } else {
            targetElement = target;
        }

        if (!targetElement) {
            return;
        }
        const resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
            entries.forEach((entry: ResizeObserverEntry) => {
                const { clientWidth, clientHeight } = entry.target;
                const newSize = {
                    width: clientWidth,
                    height: clientHeight,
                };
                onSizeChange?.(newSize);
                setSize(newSize);
            });
        });

        resizeObserver.observe(targetElement);

        return () => {
            resizeObserver.disconnect();
        };
    }, [onSizeChange, target]);

    return size;
};

export default useSize;
