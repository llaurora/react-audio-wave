import { ChangeEvent, useCallback, useRef, useState } from "react";
import ReactDOM from "react-dom";
import classNames from "classnames";
import AudioWave, { EventEmitter, LoadStateEnum, timeformat } from "../src";
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
        return timeformat(cursorTime, "hh:mm:ss.u");
    },
};

const downloadAudio = () => {
    window.open(audioSrc, "_parent");
};

const AudioPlayer = () => {
    const [paused, setPaused] = useState<boolean>(true);
    const [playbackRate, setPlaybackRate] = useState<string>("1.0");
    const [loadState, setLoadState] = useState<LoadStateEnum>(LoadStateEnum.INIT);
    const obseverRef = useRef<EventEmitter>(null);
    const durationRef = useRef<number>(null);
    const timeDurationRef = useRef(null);

    if (!obseverRef.current) {
        obseverRef.current = new EventEmitter();
    }

    const onChangeLoadState = useCallback((state: LoadStateEnum, duration: number) => {
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
            <AudioWave
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

ReactDOM.render(<AudioPlayer />, document.querySelector("#root"));
