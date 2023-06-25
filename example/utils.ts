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
 * @param seconds - number of seconds
 * @param format -time format
 * @returns string
 */
export function timeFormat(seconds: number, format: string): string {
    switch (format) {
        case "seconds": {
            return seconds.toFixed(0);
        }
        case "thousandths": {
            return seconds.toFixed(3);
        }
        case "hh:mm:ss": {
            return clockFormat(seconds, 0);
        }
        case "hh:mm:ss.u": {
            return clockFormat(seconds, 1);
        }
        case "hh:mm:ss.uu": {
            return clockFormat(seconds, 2);
        }
        case "hh:mm:ss.uuu": {
            return clockFormat(seconds, 3);
        }
        default: {
            return null;
        }
    }
}
