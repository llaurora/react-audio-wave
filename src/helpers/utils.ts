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
 * @param rate
 * @param fixed
 * @returns string
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
