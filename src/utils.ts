/**
 * 将时间转换为像素
 * @param seconds
 * @param samplesPerPixel
 * @param sampleRate
 * @returns number
 */
export function secondsToPixels(seconds: number, samplesPerPixel: number, sampleRate: number): number {
    return Math.ceil((seconds * sampleRate) / samplesPerPixel);
}

/**
 * 将像素转换为事件
 * @param pixels
 * @param samplesPerPixel
 * @param sampleRate
 * @returns number
 */
export function pixelsToSeconds(pixels: number, samplesPerPixel: number, sampleRate: number) {
    return (pixels * samplesPerPixel) / sampleRate;
}

/**
 * 对小数转百分比处理，默认保留2位小数
 * @returns string
 * @param rate
 * @param fixed
 */
export function formatPercent(rate: number, fixed = 2): string {
    if ([Number.isNaN(rate), rate === undefined, rate === null].includes(true)) {
        return "";
    }
    if ([0, "0"].includes(rate)) {
        return "0";
    }
    return `${Number.parseFloat(String((Number(rate) * 100).toFixed(fixed)))}%`;
}

/**
 * 将秒数转换时分秒
 * @param seconds
 * @param decimals
 * @returns string
 */
export function clockFormat(seconds: number, decimals: number): string {
    const hours = Number.parseInt(`${seconds / 3600}`, 10) % 24;
    const minutes = Number.parseInt(`${seconds / 60}`, 10) % 60;
    const secs = Number((seconds % 60).toFixed(decimals));

    const sHours = hours < 10 ? `0${hours}` : hours;
    const sMinutes = minutes < 10 ? `0${minutes}` : minutes;
    const sSeconds = secs < 10 ? `0${secs}` : secs;

    return `${sHours}:${sMinutes}:${sSeconds}`;
}

/**
 * 时分秒格式化
 * @param seconds
 * @param format
 * @returns string
 */
export function timeformat(seconds: number, format: string): string {
    switch (format) {
        case "seconds":
            return seconds.toFixed(0);
        case "thousandths":
            return seconds.toFixed(3);
        case "hh:mm:ss":
            return clockFormat(seconds, 0);
        case "hh:mm:ss.u":
            return clockFormat(seconds, 1);
        case "hh:mm:ss.uu":
            return clockFormat(seconds, 2);
        case "hh:mm:ss.uuu":
            return clockFormat(seconds, 3);
        default:
            return null;
    }
}
