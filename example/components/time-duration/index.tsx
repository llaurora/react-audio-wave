import type { PropsWithChildren } from "react";
import { memo, useState, useImperativeHandle, forwardRef } from "react";
import classNames from "classnames";
import { timeFormat } from "../../utils";
import "./index.scss";

const initTime = "00:00:00.0";

interface TimeDurationProps {
    className?: string;
    duration?: number;
}

const TimeDuration = forwardRef(({ className, duration = 0 }: PropsWithChildren<TimeDurationProps>, ref) => {
    const [currentTime, setCurrentTime] = useState<string>(initTime);

    useImperativeHandle(ref, () => ({
        changeCurrentTime: (current: number) => {
            setCurrentTime(() => timeFormat(current, "hh:mm:ss.u"));
        },
    }));

    return (
        <div className={classNames("audio-time", { [className]: !!className })}>
            <span className="current-time">{currentTime}</span>
            <span className="divider">/</span>
            <span className="total-time">{timeFormat(duration, "hh:mm:ss.u")}</span>
        </div>
    );
});

export default memo(TimeDuration);
