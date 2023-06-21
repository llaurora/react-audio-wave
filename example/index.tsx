import type { ChangeEvent } from "react";
import { useCallback, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import classNames from "classnames";
// 本地开发调试时用的下面路径
// import { EventEmitter, LoadStateEnum, timeFormat, ReactAudioWave } from "../src";
// import type { LoadStateEnumType } from "../src";
// 1、本地跑example可用软链接；2、在实际项目中使用的时候直接安装react-audio-wave包引入使用
import { EventEmitter, LoadStateEnum, timeFormat, ReactAudioWave } from "../src";
import type { LoadStateEnumType } from "../src";
import TimeDuration from "./components/time-duration";
import Placeholder from "./components/placeholder";
import VolumeSlider from "./components/volume-slider";
import audioSrc from "./qifengle.mp3";
import "./index.scss";
import "./iconfont/iconfont.scss";

const waveHeight = 60;
const colors = {
    waveColor: "#d8d8d8",
    waveBackground: "#f7f7f7",
    progressColor: "#4056e1",
    cursorColor: "#4056e1",
};
const cursorTimeConfig = {
    zIndex: 4,
    opacity: 1,
    customShowTimeStyle: {
        backgroundColor: "#4056e1",
        color: "#fff",
        padding: "2px",
        fontSize: "10px",
    },
    formatTimeCallback(cursorTime) {
        return timeFormat(cursorTime, "hh:mm:ss.u");
    },
};

const downloadAudio = () => {
    window.open(audioSrc, "_parent");
};

const AudioPlayer = () => {
    const [paused, setPaused] = useState<boolean>(true);
    const [playbackRate, setPlaybackRate] = useState<string>("1.0");
    const [loadState, setLoadState] = useState<LoadStateEnumType>(LoadStateEnum.INIT);
    const obseverRef = useRef<EventEmitter>(null);
    const durationRef = useRef<number>(null);
    const timeDurationRef = useRef(null);

    if (!obseverRef.current) {
        // eslint-disable-next-line unicorn/prefer-event-target
        obseverRef.current = new EventEmitter();
    }

    const onChangeLoadState = useCallback((state: LoadStateEnumType, duration: number) => {
        setLoadState(state);
        if (state === LoadStateEnum.SUCCESS) {
            durationRef.current = duration;
            timeDurationRef.current?.changeTotalTime(duration);
        }
    }, []);

    const onPlayEnded = useCallback(() => {
        setPaused(true);
    }, []);

    const onCurrentTimeChange = useCallback((current: number) => {
        timeDurationRef.current?.changeCurrentTime(current);
    }, []);

    const changePlaybackRate = (rate) => {
        setPlaybackRate(rate);
        obseverRef.current.emit("playbackRate", Number(rate));
    };

    const playPause = () => {
        setPaused((bool: boolean) => !bool);
        if (paused) {
            obseverRef.current.emit("play");
            return;
        }
        obseverRef.current.emit("pause");
    };

    return (
        <div className="audio-player">
            {loadState === LoadStateEnum.SUCCESS ? (
                <div className="audio-controls">
                    <span
                        onClick={playPause}
                        className={classNames("iconfont", "icon-switch-paly", {
                            "icon-pause": !paused,
                            "icon-play": paused,
                        })}
                    />
                    <TimeDuration ref={timeDurationRef} className="audio-time" />
                    <span
                        className={classNames("iconfont icon-circledownload", "icon-download")}
                        onClick={downloadAudio}
                    />
                    <select
                        value={playbackRate}
                        onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                            changePlaybackRate(event.target.value);
                        }}
                        className="audio-rate"
                    >
                        <option value="0.5">playbackRate 0.5</option>
                        <option value="1.0">playbackRate 1.0</option>
                        <option value="1.5">playbackRate 1.5</option>
                        <option value="2.0">playbackRate 2.0</option>
                    </select>
                    <VolumeSlider obsever={obseverRef.current} className="volume-slider" />
                </div>
            ) : null}
            <ReactAudioWave
                supportPlaybackRate
                className="audio-wave-container"
                obsever={obseverRef.current}
                waveHeight={waveHeight}
                colors={colors}
                cursorTimeConfig={cursorTimeConfig}
                audioSrc={audioSrc}
                onChangeLoadState={onChangeLoadState}
                onCurrentTimeChange={onCurrentTimeChange}
                onPlayEnded={onPlayEnded}
                placeholder={Placeholder}
            />
        </div>
    );
};

const root = ReactDOM.createRoot(document.querySelector("#root"));
root.render(<AudioPlayer />);
