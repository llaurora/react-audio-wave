import { memo, useRef, useCallback, useEffect, useState, useMemo, CSSProperties, PropsWithChildren } from "react";
import classNames from "classnames";
import useSize, { Size } from "./useSize";
import WaveCanvas from "./components/wave-canvas";
import WaveProgress from "./components/wave-progress";
import LoadedPercent from "./components/loaded-percent";
import CursorTime, { CursorTimeConfig } from "./components/cursor-time";
import { formatPercent } from "./utils";
import { WebAudio, fetchFile, EventEmitter } from "./helpers";
import type { PeakData, Peaks } from "./helpers";
import "./wave.scss";

export enum LoadStateEnum {
    "EMPTY" = -1,
    "INIT" = 0,
    "LOADING" = 1,
    "SUCCESS" = 2,
    "ERROR" = 3,
}

interface Wavecolors {
    progressColor: string;
    waveColor: string;
    waveBackground: string;
}

interface AudioWaveProps {
    waveHeight: number;
    colors: Wavecolors;
    audioSrc: string;
    obsever: EventEmitter;
    placeholder: any;
    progressStyle?: CSSProperties;
    supportPlaybackRate?: boolean;
    mono?: boolean;
    progressCursor?: boolean;
    cursorTimeConfig?: CursorTimeConfig;
    className?: string;
    errorContainerClassName?: string;
    onChangeLoadState?: (state: LoadStateEnum, duration?: number) => void;
    onCurrentTimeChange?: (current: number) => void;
    onWaveSizeChange?: (size: Size) => void;
    onPlayEnded?: () => void;
}

interface CurrentPosition {
    time: number;
    x: number;
    clientX: number;
    right: number;
}

const initPeakData = { length: 0, data: [], bits: 8 };

const AudioWave = ({
    audioSrc,
    waveHeight,
    colors,
    progressStyle,
    obsever,
    onChangeLoadState,
    onCurrentTimeChange,
    onPlayEnded,
    cursorTimeConfig,
    className,
    errorContainerClassName,
    children,
    onWaveSizeChange,
    placeholder: Placeholder,
    mono = true,
    progressCursor = true,
    supportPlaybackRate = false,
}: PropsWithChildren<AudioWaveProps>) => {
    const [loadState, setLoadState] = useState<LoadStateEnum>(LoadStateEnum.INIT);
    const webAudioRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef(null);
    const waveProgressRef = useRef(null);
    const cursorTimeRef = useRef(null);
    const loadedPercentRef = useRef(null);
    const loadedErrorRef = useRef(null);
    const audioSourcePromiseRef = useRef<Promise<boolean>>(null);
    const { width } = useSize(containerRef, onWaveSizeChange);
    const containerWidthRef = useRef<number>(width);
    containerWidthRef.current = width;
    if (!webAudioRef.current) {
        webAudioRef.current = new WebAudio(supportPlaybackRate);
    }
    const { progressColor, waveBackground, waveColor } = colors;

    const peakData: PeakData = useMemo(() => {
        if (width && loadState === LoadStateEnum.SUCCESS) {
            // 加载成功以保障拿到了audiobuffer
            return webAudioRef.current.getWebaudioPeaks(width, mono);
        }
        return initPeakData;
    }, [loadState, mono, width]);

    const onAudioError = useCallback(
        (error: Error) => {
            loadedErrorRef.current = error;
            setLoadState(LoadStateEnum.ERROR);
            onChangeLoadState?.(LoadStateEnum.ERROR);
        },
        [onChangeLoadState],
    );

    // 加载音频资源
    const requestAudioFile = useCallback(async () => {
        try {
            setLoadState(LoadStateEnum.LOADING);
            onChangeLoadState?.(LoadStateEnum.LOADING);
            const request = await fetchFile(audioSrc);
            // 音频加载成功
            request.on("success", (data) => {
                if (data.byteLength === 0) {
                    setLoadState(LoadStateEnum.EMPTY);
                    return;
                }
                webAudioRef.current.initWebAudio(
                    data,
                    (duration: number) => {
                        // 音频解码完成
                        loadedErrorRef.current = null;
                        setLoadState(LoadStateEnum.SUCCESS);
                        onChangeLoadState?.(LoadStateEnum.SUCCESS, duration);
                    },
                    onAudioError, // 音频解码失败
                );
            });
            // 音频加载进度
            request.on("progress", (loadedState) => {
                if (loadedState === undefined) {
                    return;
                }
                loadedPercentRef.current.changeLoadedPercent(formatPercent(loadedState.loaded / loadedState.total));
            });
            // 音频加载失败
            request.on("error", onAudioError);
        } catch (error) {
            onAudioError(error);
        }
    }, [audioSrc, onAudioError, onChangeLoadState]);

    // 计算实时进度
    const calcRealTimeProgress = useCallback(() => {
        const currentOffsetTime = webAudioRef.current.getCurrentOffsetTime();
        const currentOffsetPixels = webAudioRef.current.getCurrentOffsetPixels();
        waveProgressRef.current?.changeOffsetPixels(currentOffsetPixels);
        onCurrentTimeChange?.(currentOffsetTime);
    }, [onCurrentTimeChange]);

    // 播放时实时计算播放进度
    const startAnimation = useCallback(() => {
        if (!webAudioRef.current.playing) {
            // 加这一步以防止在播放一段时间结束时，未能正常结束掉动画
            window.cancelAnimationFrame(animationRef.current);
            return;
        }
        calcRealTimeProgress();
        animationRef.current = window.requestAnimationFrame(startAnimation);
    }, [calcRealTimeProgress]);

    // 音频暂停
    const pauseAudio = useCallback(() => {
        webAudioRef.current.pause();
        window.cancelAnimationFrame(animationRef.current);
    }, []);

    // 音频播放
    const playAudio = useCallback(() => {
        audioSourcePromiseRef.current = webAudioRef.current.updateAudioSource(); // 如果是支持倍速而用的audio标签控制播放的话，这一步纯粹只是注册ended时间
        webAudioRef.current.play();
        startAnimation();

        audioSourcePromiseRef.current.then((ended) => {
            if (ended && webAudioRef.current.playing) {
                // 音频播放结束，这个结合播放状态判断是否播放结束仅用于audiobuffer，其实用audio标签的话，这个播放状态没啥用
                webAudioRef.current.ended();
                waveProgressRef.current.changeOffsetPixels(0);
                onPlayEnded?.();
                onCurrentTimeChange?.(0);
                window.cancelAnimationFrame(animationRef.current);
            }
        });
    }, [onCurrentTimeChange, onPlayEnded, startAnimation]);

    // 跳转到某个时间点，如果有第2个参数，则控制跳转后是否播放
    const seekTo = useCallback(
        (offsetTime: number, play?: boolean) => {
            const { playing: currentPlaying } = webAudioRef.current;
            // 如果当前音频状态是暂停状态
            if (currentPlaying === false) {
                webAudioRef.current.updateCurrentOffsetPositon(offsetTime);
                calcRealTimeProgress();
                if (play === true) {
                    playAudio();
                }
                // 如果跳转之后要暂停，因为本来就是暂停状态，无需做其他处理了
                return;
            }
            // 如果当前音频状态是播放状态
            if (currentPlaying === true) {
                if (supportPlaybackRate) {
                    // 如果支持倍速，即表示得使用audio标签控制播放
                    webAudioRef.current.updateCurrentOffsetPositon(offsetTime);
                    // 如果跳转之后继续播放，更改了audio的currentTime就可以了
                    if (play === false) {
                        pauseAudio();
                        calcRealTimeProgress();
                    }
                    return;
                }
                if (play === true || play === undefined) {
                    // 使用audiobuffer播放控制的话，并且正在播放得先暂停
                    pauseAudio();
                    webAudioRef.current.updateCurrentOffsetPositon(offsetTime);
                    audioSourcePromiseRef.current.then(() => {
                        playAudio();
                    });
                    return;
                }
                // 如果跳转之后要暂停播放
                pauseAudio();
                webAudioRef.current.updateCurrentOffsetPositon(offsetTime);
                calcRealTimeProgress();
            }
        },
        [calcRealTimeProgress, pauseAudio, playAudio, supportPlaybackRate],
    );

    // 控制音量大小 0~1
    const changeVolume = useCallback((volume) => {
        webAudioRef.current.changeVolume(volume);
    }, []);

    const changePlaybackRate = useCallback((playbackRate) => {
        webAudioRef.current.changePlaybackRate(playbackRate);
    }, []);

    // 根据鼠标点击的位置计算seek音频时间点
    const calcCurrentPosition = (event): CurrentPosition => {
        const containerRectInfo = containerRef.current.getBoundingClientRect();
        const x = event.clientX - containerRectInfo.left;
        const timeValue = Math.max(0, webAudioRef.current.getPixelsToSeconds(x));
        return {
            x,
            time: timeValue,
            clientX: event.clientX,
            right: containerRectInfo.right,
        };
    };

    const onWaveSeekClick = (event) => {
        const { time: offsetTime } = calcCurrentPosition(event);
        seekTo(offsetTime);
    };

    // 有实时指针的时候移动的时候实时计算移动到音频哪个时间点
    const onMouseMove = (event) => {
        if (!cursorTimeConfig || loadState !== LoadStateEnum.SUCCESS) {
            return;
        }
        const { time, x, clientX, right } = calcCurrentPosition(event);
        cursorTimeRef.current?.updateCursorPosition(time, x, clientX, right);
    };

    // 鼠标移除时隐藏实时指针
    const onMouseleave = () => {
        if (!cursorTimeConfig || loadState !== LoadStateEnum.SUCCESS) {
            return;
        }
        cursorTimeRef.current?.hideCursor();
    };

    // 鼠标移入时显示实时指针
    const onMouseEnter = () => {
        if (!cursorTimeConfig || loadState !== LoadStateEnum.SUCCESS) {
            return;
        }
        cursorTimeRef.current?.showCursor();
    };

    useEffect(() => {
        obsever.on("play", playAudio);
        obsever.on("pause", pauseAudio);
        obsever.on("volume", changeVolume);
        obsever.on("playbackRate", changePlaybackRate);
        obsever.on("seekTo", seekTo);
        return () => {
            obsever.off("play");
            obsever.off("pause");
            obsever.off("volume");
            obsever.off("playbackRate");
            obsever.off("seekTo");
            obsever.off("playRangeTime");
        };
    }, [obsever, pauseAudio, changeVolume, playAudio, changePlaybackRate, seekTo]);

    useEffect(() => {
        requestAudioFile();
    }, [requestAudioFile]);

    useEffect(() => {
        webAudioRef.current.initAudioElement(audioSrc, containerRef.current);
    }, [audioSrc]);

    const renderContent = () => {
        if (loadState === LoadStateEnum.EMPTY) {
            return <span>无音频内容</span>;
        }
        if (loadState === LoadStateEnum.LOADING) {
            return (
                <Placeholder>
                    <LoadedPercent ref={loadedPercentRef} />
                </Placeholder>
            );
        }
        if (loadState === LoadStateEnum.ERROR) {
            return (
                <div
                    className={classNames("error-container", {
                        [errorContainerClassName]: !!errorContainerClassName,
                    })}
                >
                    <span className="wave-error-text">解码失败 {loadedErrorRef.current?.toString()}</span>
                </div>
            );
        }
        return (
            <>
                {children}
                {peakData.data.map((data: Peaks, index: number) => {
                    const canvasWidth = peakData?.length ?? width;
                    return (
                        <div
                            key={index}
                            className="channel"
                            style={{ height: waveHeight, width: canvasWidth, backgroundColor: waveColor }}
                        >
                            <WaveProgress
                                ref={waveProgressRef}
                                progressStyle={progressStyle}
                                progressCursor={progressCursor}
                                progressColor={progressColor}
                                progressClassName="progress"
                                progressCursorClassName="progress-cursor"
                            />
                            <CursorTime ref={cursorTimeRef} config={cursorTimeConfig} />
                            <WaveCanvas
                                pixelRatio={webAudioRef.current.pixelRatio}
                                color={waveBackground}
                                peaks={data}
                                bits={peakData.bits}
                                width={canvasWidth}
                                height={waveHeight}
                                barGap={0}
                                barWidth={1}
                            />
                        </div>
                    );
                })}
            </>
        );
    };

    return (
        <div
            className={classNames("wave-container", {
                "wave-container-loading-state": loadState === LoadStateEnum.LOADING,
                [className]: !!className,
            })}
            style={{ minHeight: waveHeight }}
            ref={containerRef}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseleave}
            onMouseEnter={onMouseEnter}
            onClick={onWaveSeekClick}
        >
            {renderContent()}
        </div>
    );
};

export default memo(AudioWave);
