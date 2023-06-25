import type { ChangeEvent } from "react";
import { memo, useRef, useState } from "react";
import classNames from "classnames";
import "./index.scss";

interface VolumeSliderProps {
    onChangeVolume: (volume: number) => void;
    className?: string;
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

const VolumeSlider = ({ onChangeVolume, className }: VolumeSliderProps) => {
    const [sliderValue, setSliderValue] = useState<number>(100);
    const sliderValueRef = useRef<number>(sliderValue);

    const changeSlider = (val: number, needCache?: boolean) => {
        setSliderValue(val);
        onChangeVolume?.(fixedNumber(val / 100));
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
