import type { ChangeEvent } from "react";
import { useCallback, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import classNames from "classnames";
// 本地开发调试时用的下面路径
// import { LoadStateEnum, ReactAudioWave } from "../src";
// import type { LoadStateEnumType, InstanceMethodType } from "../src";
// 1、本地跑example可用软链接；2、在实际项目中使用的时候直接安装react-audio-wave包引入使用
import { LoadStateEnum, ReactAudioWave } from "../src";
import type { LoadStateEnumType, InstanceMethodType } from "../src";
import TimeDuration from "./components/time-duration";
import Placeholder from "./components/placeholder";
import VolumeSlider from "./components/volume-slider";
import { timeFormat as timeFormatFunc } from "./utils";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import audioSrc from "./qifengle.mp3";
import "./index.scss";
import "./iconfont/iconfont.scss";

const waveHeight = 60;
const colors = {
    waveColor: "#d8d8d8",
    progressColor: "#8E128E",
    cursorColor: "#8E128E",
};

const downloadAudio = () => {
    window.open(audioSrc, "_parent");
};

const AudioPlayer = () => {
    const [paused, setPaused] = useState<boolean>(true);
    const [playbackRate, setPlaybackRate] = useState<string>("1.0");
    const [loadState, setLoadState] = useState<LoadStateEnumType>(LoadStateEnum.INIT);
    const audioWaveRef = useRef<InstanceMethodType>(null);
    const durationRef = useRef<number>(null);
    const timeDurationRef = useRef(null);

    const onChangeLoadState = useCallback((state: LoadStateEnumType, duration: number) => {
        setLoadState(state);
        if (state === LoadStateEnum.SUCCESS) {
            durationRef.current = duration;
        }
    }, []);

    const onPlayEnded = useCallback(() => {
        setPaused(true);
    }, []);

    const onCurrentTimeChange = useCallback((current: number) => {
        timeDurationRef.current?.changeCurrentTime(current);
    }, []);

    const onChangeVolume = useCallback((volume: number) => {
        audioWaveRef.current?.volume(volume);
    }, []);

    const timeFormat = useCallback((seconds: number) => {
        return timeFormatFunc(seconds, "hh:mm:ss.u");
    }, []);

    const changePlaybackRate = (rate) => {
        setPlaybackRate(rate);
        audioWaveRef.current?.playbackRate(Number(rate));
    };

    const playPause = () => {
        setPaused((bool: boolean) => !bool);
        if (paused) {
            audioWaveRef.current?.play();
            return;
        }
        audioWaveRef.current?.pause();
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
                    <TimeDuration ref={timeDurationRef} className="audio-time" duration={durationRef.current} />
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
                    <VolumeSlider onChangeVolume={onChangeVolume} className="volume-slider" />
                </div>
            ) : null}
            <ReactAudioWave
                supportPlaybackRate
                className="audio-wave-container"
                ref={audioWaveRef}
                waveHeight={waveHeight}
                colors={colors}
                audioSrc={audioSrc}
                onChangeLoadState={onChangeLoadState}
                onCurrentTimeChange={onCurrentTimeChange}
                onPlayEnded={onPlayEnded}
                timeFormat={timeFormat}
                placeholder={Placeholder}
            />
        </div>
    );
};

const root = ReactDOM.createRoot(document.querySelector("#root"));
root.render(<AudioPlayer />);
