import { pixelsToSeconds, secondsToPixels } from "@/utils";
import { PeakData, webaudioPeaks } from "./webaudioPeaks";

export default class WebAudio {
    private audioContext: AudioContext;

    private buffer: AudioBuffer;

    private source: AudioBufferSourceNode;

    private gain: GainNode;

    private peakData: PeakData;

    private duration: number;

    private lastOffsetPixels: number;

    private pausedAtOffsetTime: number;

    private currentOffsetTime: number;

    private startTime: number;

    private samplesPerPixel: number;

    private volume: number;

    private playing: boolean;

    private supportPlaybackRate: boolean;

    private hasEndedListener: boolean;

    private audioMedia: HTMLAudioElement;

    private pixelRatio: number;

    constructor(supportPlaybackRate: boolean) {
        // 是否支持倍速播放，之所有要添加这个参数，是因为通过web audio拿到audiobuffer才能进行音频可视化，但是在设置倍速播放时，其音高会异常，可参考https://github.com/WebAudio/web-audio-api/issues/2487和https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode
        // <audio>标签是可以支持倍速，但通过audio标签拿不到audiobuffer，做不了音频可视化
        // 所以通过这个参数控制，如果不需要倍数播放功能，则全程直接操作audiobuffer，若需要则仅用audiobuffer进行音频可视化，播放暂停等操作操作原生<audio>标签
        this.supportPlaybackRate = supportPlaybackRate;
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        this.source = null;
        // 使用audioBuffer播放的话，用此作为中间节点以调节音量
        this.gain = null;
        this.peakData = { length: 0, data: [], bits: 8 };
        // 峰值采样率，在这儿用于表示每多px能代表多少buffer
        this.samplesPerPixel = 1000;
        // 音频时长，相较audio标签，通过audioBuffer的计算得来的更为准确
        this.duration = 0;
        // 音频音量
        this.volume = 1;
        // 暂停/停止播放时音频播放到哪个时间点了
        this.pausedAtOffsetTime = 0;
        // 音频当前播放到哪个时间点了
        this.currentOffsetTime = 0;
        // 用于记录当点击播放时的那个时间点
        this.startTime = 0;
        // 用于记录上次计算出的px偏移量，用于和当前计算出的px偏移量对比以决定是否要更新进度
        this.lastOffsetPixels = 0;
        // 是否处于播放状态
        this.playing = false;
        // 如果要支持倍速的话，得用audio标签控制播放暂停等
        this.audioMedia = null;
        // 是否注册有监听播放结束的事件
        this.hasEndedListener = false;
        // 设备像素比
        this.pixelRatio = Math.max(1, Math.floor(window.devicePixelRatio)); // 有些设备是0
    }

    public initWebAudio(
        audioData: ArrayBuffer,
        successCallback: (duration?: number) => void,
        errorCallback?: (error: Error) => void,
    ): void {
        try {
            this.audioContext.decodeAudioData(audioData, (decodeData: AudioBuffer) => {
                this.buffer = decodeData;
                this.duration = decodeData.duration;
                successCallback(this.duration);
            });
        } catch (error) {
            errorCallback?.(error);
        }
    }

    public initAudioElement(audioSrc: string, container: HTMLDivElement): void {
        if (!this.supportPlaybackRate) {
            return;
        }
        if (this.audioMedia) {
            this.audioMedia.remove();
            this.audioMedia = null;
        }
        this.audioMedia = document.createElement("audio");
        this.audioMedia.preload = "auto";
        this.audioMedia.controls = false;
        this.audioMedia.src = audioSrc;
        container.append(this.audioMedia);
    }

    public getWebaudioPeaks(width: number, mono: boolean): PeakData {
        if (!width || !this.buffer) {
            return;
        }
        this.samplesPerPixel = Math.floor(this.buffer.length / width);
        // 根据设定的canvas的宽度，计算峰值采样率，每px能代表多少buffer，原则上讲最后得到的peakData的length和设定的canvas的宽度是一样的
        this.peakData = webaudioPeaks(this.buffer, this.samplesPerPixel, mono);
        return this.peakData;
    }

    public getCurrentOffsetTime(): number {
        if (this.supportPlaybackRate) {
            this.currentOffsetTime = this.audioMedia.currentTime;
            return this.currentOffsetTime;
        }

        this.currentOffsetTime = this.playing
            ? this.audioContext.currentTime - this.startTime + this.pausedAtOffsetTime
            : this.pausedAtOffsetTime;
        return this.currentOffsetTime;
    }

    public getCurrentOffsetPixels(): number {
        const calcOffsetPixels = secondsToPixels(this.currentOffsetTime, this.samplesPerPixel, this.buffer.sampleRate);
        if (calcOffsetPixels !== this.lastOffsetPixels) {
            this.lastOffsetPixels = calcOffsetPixels;
            return calcOffsetPixels;
        }
    }

    public getPixelsToSeconds(x: number): number {
        return pixelsToSeconds(x, this.samplesPerPixel, this.buffer.sampleRate);
    }

    public updateCurrentOffsetPositon(time: number): void {
        if (this.supportPlaybackRate) {
            this.audioMedia.currentTime = time;
            return;
        }
        this.currentOffsetTime = time;
        this.pausedAtOffsetTime = time;
    }

    public pause(): void {
        this.playing = false;
        if (this.supportPlaybackRate) {
            this.audioMedia.pause();
            return;
        }

        //  this.audioContext.currentTime - this.startTime 可以计算出此次播放了多长时间，再+=开始播放前停止的位置的话就可以知道停止时播放到整段音频的什么位置了，即下次播放时知道从哪儿开始播了
        this.pausedAtOffsetTime += this.audioContext.currentTime - this.startTime;
        this.source?.stop();
        this.source.disconnect();
    }

    public ended(): void {
        this.playing = false;
        this.currentOffsetTime = 0;
        this.lastOffsetPixels = 0;
        this.hasEndedListener = false; // 之所以要有这个标注，是避免中间暂定再播放因为多次addEventListener，再播放结束时会触发多次
        if (this.supportPlaybackRate) {
            this.audioMedia.currentTime = 0;
            this.audioMedia.pause();
            return;
        }

        this.source?.stop(0);
        this.source?.disconnect();
        this.gain?.disconnect();
        this.pausedAtOffsetTime = 0;
        this.startTime = 0;
        this.source = null;
        this.gain = null;
    }

    public updateAudioSource(): Promise<boolean> {
        return new Promise<boolean>((resolve) => {
            const sendEnded = () => {
                // 注意使用audiobuffer控制播放时，点击暂停时，该事件也会触发，而使用audio标签控制播放时，只有播放完成时该事件才会触发
                resolve(true);
                if (this.supportPlaybackRate) {
                    this.audioMedia?.removeEventListener?.("ended", sendEnded);
                    return;
                }
                this.source?.removeEventListener?.("ended", sendEnded);
            };

            // 如果要支持倍速，那播放暂停相关操作通过audio标签来完成
            if (this.supportPlaybackRate) {
                if (!this.hasEndedListener) {
                    this.audioMedia.addEventListener("ended", sendEnded);
                    this.hasEndedListener = true;
                }
                return;
            }

            this.gain = this.audioContext.createGain();
            this.source = this.audioContext.createBufferSource();
            this.source.buffer = this.buffer;
            this.gain.gain.value = this.volume;
            // this.source.playbackRate.value = 1.5; // 调整播放速度，但目前播放速度变化的同时音调会被改变，目前web audio api还不支持preservePitch，更多可参考https://github.com/WebAudio/web-audio-api/issues/2487
            this.source.connect(this.gain);
            this.gain.connect(this.audioContext.destination);
            this.source.loop = false;
            // 该事件会在点击暂定时也会触发（注意区别于audio标签的ended），不能纯粹的作为播放完成的监听事件，得结合当前播放状态
            this.source.addEventListener("ended", sendEnded);
        });
    }

    public play(): void {
        this.playing = true;
        if (this.supportPlaybackRate) {
            this.audioMedia.play();
            return;
        }
        // this.audioContext.currentTime 返回的值是一个绝对的时间值，首次播放时（音频加载下来还未播放过）可当做x坐标原点，即为0，
        // 然后不管后面有啥操作（比如暂停），这个时间是走着的（不以他人意志为转移）
        this.startTime = this.audioContext.currentTime;
        // 什么时候开始播（点击之后立即开始播）、从哪儿开始播、播多少时间
        this.source?.start(this.startTime, this.pausedAtOffsetTime, this.duration); // this.startOffset % this.duration
    }

    public changeVolume(volume: number): void {
        this.volume = volume;
        if (this.supportPlaybackRate) {
            this.audioMedia.volume = volume;
            return;
        }
        if (this.gain) {
            this.gain.gain.value = volume;
        }
    }

    public changePlaybackRate(playbackRate: number) {
        if (!this.supportPlaybackRate) {
            return;
        }
        this.audioMedia.playbackRate = playbackRate;
    }
}
