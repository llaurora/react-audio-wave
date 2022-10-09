import { memo, useRef, useEffect } from "react";
import { Peaks, Bits } from "@/helpers/webaudioPeaks";

interface WaveCanvasProps {
    width: number;
    height: number;
    color: string;
    bits: Bits;
    peaks: Peaks;
    barGap: number;
    barWidth: number;
    pixelRatio: number;
    offset?: number;
}

const WaveCanvas = ({
    width,
    height,
    peaks,
    color,
    bits,
    barGap,
    barWidth,
    pixelRatio: scale,
    offset = 0,
}: WaveCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const len = width / scale;
        const ctx = canvasRef.current.getContext("2d");
        const h2 = height / scale / 2;
        const maxValue = 2 ** (bits - 1);
        const barStart = barWidth + barGap;
        ctx.clearRect(0, 0, width, height);

        ctx.save();
        ctx.fillStyle = color;
        ctx.scale(scale, scale);

        for (let pixel = 0; pixel < len; pixel += barStart) {
            const minPeak = peaks[(pixel + offset) * 2] / maxValue;
            const maxPeak = peaks[(pixel + offset) * 2 + 1] / maxValue;
            const min = Math.abs(minPeak * h2);
            const max = Math.abs(maxPeak * h2);
            // draw max
            ctx.fillRect(pixel, 0, barWidth, h2 - max);
            // draw min
            ctx.fillRect(pixel, h2 + min, barWidth, h2 - min);
            // draw gap
            if (barGap !== 0) {
                ctx.fillRect(pixel + barWidth, 0, barGap, h2 * 2);
            }
        }
        ctx.restore();
    }, [barGap, barWidth, bits, color, height, offset, peaks, scale, width]);

    return (
        <canvas width={width} height={height} ref={canvasRef}>
            Your browser does not support HTML5 canvas.
        </canvas>
    );
};

export default memo(WaveCanvas);
