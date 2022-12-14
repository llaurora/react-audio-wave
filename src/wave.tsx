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
            // ??????????????????????????????audiobuffer
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

    // ??????????????????
    const requestAudioFile = useCallback(async () => {
        try {
            setLoadState(LoadStateEnum.LOADING);
            onChangeLoadState?.(LoadStateEnum.LOADING);
            const request = await fetchFile(audioSrc);
            // ??????????????????
            request.on("success", (data) => {
                webAudioRef.current.initWebAudio(
                    data,
                    (duration: number) => {
                        // ??????????????????
                        loadedErrorRef.current = null;
                        setLoadState(LoadStateEnum.SUCCESS);
                        onChangeLoadState?.(LoadStateEnum.SUCCESS, duration);
                    },
                    onAudioError, // ??????????????????
                );
            });
            // ??????????????????
            request.on("progress", (loadedState) => {
                if (loadedState === undefined) {
                    return;
                }
                loadedPercentRef.current.changeLoadedPercent(formatPercent(loadedState.loaded / loadedState.total));
            });
            // ??????????????????
            request.on("error", onAudioError);
        } catch (error) {
            onAudioError(error);
        }
    }, [audioSrc, onAudioError, onChangeLoadState]);

    // ??????????????????
    const calcRealTimeProgress = useCallback(() => {
        const currentOffsetTime = webAudioRef.current.getCurrentOffsetTime();
        const currentOffsetPixels = webAudioRef.current.getCurrentOffsetPixels();
        waveProgressRef.current?.changeOffsetPixels(currentOffsetPixels);
        onCurrentTimeChange?.(currentOffsetTime);
    }, [onCurrentTimeChange]);

    // ?????????????????????????????????
    const startAnimation = useCallback(() => {
        if (!webAudioRef.current.playing) {
            // ?????????????????????????????????????????????????????????????????????????????????
            window.cancelAnimationFrame(animationRef.current);
            return;
        }
        calcRealTimeProgress();
        animationRef.current = window.requestAnimationFrame(startAnimation);
    }, [calcRealTimeProgress]);

    // ????????????
    const pauseAudio = useCallback(() => {
        webAudioRef.current.pause();
        window.cancelAnimationFrame(animationRef.current);
    }, []);

    // ????????????
    const playAudio = useCallback(() => {
        audioSourcePromiseRef.current = webAudioRef.current.updateAudioSource(); // ??????????????????????????????audio??????????????????????????????????????????????????????ended??????
        webAudioRef.current.play();
        startAnimation();

        audioSourcePromiseRef.current.then((ended) => {
            if (ended && webAudioRef.current.playing) {
                // ??????????????????????????????????????????????????????????????????????????????audiobuffer????????????audio??????????????????????????????????????????
                webAudioRef.current.ended();
                waveProgressRef.current.changeOffsetPixels(0);
                onPlayEnded?.();
                onCurrentTimeChange?.(0);
                window.cancelAnimationFrame(animationRef.current);
            }
        });
    }, [onCurrentTimeChange, onPlayEnded, startAnimation]);

    // ???????????????????????????????????????2??????????????????????????????????????????
    const seekTo = useCallback(
        (offsetTime: number, play?: boolean) => {
            const { playing: currentPlaying } = webAudioRef.current;
            // ???????????????????????????????????????
            if (currentPlaying === false) {
                webAudioRef.current.updateCurrentOffsetPositon(offsetTime);
                calcRealTimeProgress();
                if (play === true) {
                    playAudio();
                }
                // ???????????????????????????????????????????????????????????????????????????????????????
                return;
            }
            // ???????????????????????????????????????
            if (currentPlaying === true) {
                if (supportPlaybackRate) {
                    // ???????????????????????????????????????audio??????????????????
                    webAudioRef.current.updateCurrentOffsetPositon(offsetTime);
                    // ??????????????????????????????????????????audio???currentTime????????????
                    if (play === false) {
                        pauseAudio();
                        calcRealTimeProgress();
                    }
                    return;
                }
                if (play === true || play === undefined) {
                    // ??????audiobuffer???????????????????????????????????????????????????
                    pauseAudio();
                    webAudioRef.current.updateCurrentOffsetPositon(offsetTime);
                    audioSourcePromiseRef.current.then(() => {
                        playAudio();
                    });
                    return;
                }
                // ?????????????????????????????????
                pauseAudio();
                webAudioRef.current.updateCurrentOffsetPositon(offsetTime);
                calcRealTimeProgress();
            }
        },
        [calcRealTimeProgress, pauseAudio, playAudio, supportPlaybackRate],
    );

    // ?????????????????? 0~1
    const changeVolume = useCallback((volume) => {
        webAudioRef.current.changeVolume(volume);
    }, []);

    const changePlaybackRate = useCallback((playbackRate) => {
        webAudioRef.current.changePlaybackRate(playbackRate);
    }, []);

    // ?????????????????????????????????seek???????????????
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

    // ?????????????????????????????????????????????????????????????????????????????????
    const onMouseMove = (event) => {
        if (!cursorTimeConfig || loadState !== LoadStateEnum.SUCCESS) {
            return;
        }
        const { time, x, clientX, right } = calcCurrentPosition(event);
        cursorTimeRef.current?.updateCursorPosition(time, x, clientX, right);
    };

    // ?????????????????????????????????
    const onMouseleave = () => {
        if (!cursorTimeConfig || loadState !== LoadStateEnum.SUCCESS) {
            return;
        }
        cursorTimeRef.current?.hideCursor();
    };

    // ?????????????????????????????????
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
                    <span className="wave-error-text">???????????? {loadedErrorRef.current?.toString()}</span>
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
