import type { ChangeEvent } from "react";
import { memo, useRef, useState } from "react";
import classNames from "classnames";
import type { EventEmitter } from "../../../src";
import "./index.scss";

interface VolumeSliderProps {
    className?: string;
    obsever: EventEmitter;
}

const fixedNumber = (num: number, fixed = 2): number => {
    if ([Number.isNaN(num), num === undefined, num === null].includes(true)) {
        return null;
    }
    if (Number.parseInt(String(num), 10) === num) {
        return num;
    }
    return Number(num.toFixed(fixed));
};

const VolumeSlider = ({ obsever, className }: VolumeSliderProps) => {
    const [sliderValue, setSliderValue] = useState<number>(100);
    const sliderValueRef = useRef<number>(sliderValue);

    const changeSlider = (val: number, needCache?: boolean) => {
        setSliderValue(val);
        obsever.emit("volume", fixedNumber(val / 100));
        if (needCache) {
            sliderValueRef.current = sliderValue;
        }
    };

    return (
        <div className={classNames("volume-slider", { [className]: !!className })}>
            {sliderValue === 0 ? (
                <span
                    className={classNames("iconfont icon-jingyin", "icon-switch-volume")}
                    onClick={() => {
                        changeSlider(sliderValueRef.current);
                    }}
                />
            ) : (
                <span
                    className={classNames("iconfont icon-shengyin", "icon-switch-volume")}
                    onClick={() => {
                        changeSlider(0);
                    }}
                />
            )}
            <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={sliderValue}
                className="slider"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    changeSlider(Number(event.target.value));
                }}
            />
        </div>
    );
};

export default memo(VolumeSlider);
