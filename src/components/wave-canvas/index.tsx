import { memo, useRef, useEffect } from "react";
import classNames from "classnames";
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
    className?: string;
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
    className,
    pixelRatio: scale,
    offset = 0,
}: WaveCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const len = width / scale;
        const ctx = canvasRef.current.getContext("2d");
        const h = height / scale;
        const h2 = h / 2;
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
            ctx.fillRect(pixel, h2 - max, barWidth, max + min);
        }
        ctx.restore();
    }, [barGap, barWidth, bits, color, height, offset, peaks, scale, width]);

    return (
        <canvas width={width} height={height} ref={canvasRef} className={classNames(className)}>
            Your browser does not support HTML5 canvas.
        </canvas>
    );
};

export default memo(WaveCanvas);
