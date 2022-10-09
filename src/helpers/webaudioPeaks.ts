export type Peaks = Int8Array | Int16Array | Int32Array;

export type Bits = 8 | 16 | 32;

export type PeakData = {
    length: number;
    data: Peaks[];
    bits: Bits;
};

/**
 * @param {TypedArray} array - Subarray of audio to calculate peaks from.
 */
function findMinMax(array) {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    const len = array.length;
    let curr;

    for (let i = 0; i < len; i += 1) {
        curr = array[i];
        if (min > curr) {
            min = curr;
        }
        if (max < curr) {
            max = curr;
        }
    }

    return {
        min,
        max,
    };
}

/**
 * @param {Number} n - peak to convert from float to Int8, Int16 etc.
 * @param {Number} bits - convert to #bits two's complement signed integer
 */
function convert(n: number, bits: number) {
    const max = 2 ** (bits - 1);
    const v = n < 0 ? n * max : n * (max - 1);
    return Math.max(-max, Math.min(max - 1, v));
}

function makeTypedArray(bits, length) {
    // eslint-disable-next-line no-new-func
    return new (new Function(`return Int${bits}Array`)())(length);
}

/**
 * @param {TypedArray} channel - Audio track frames to calculate peaks from.
 * @param {Number} samplesPerPixel - Audio frames per peak
 * * @param {Number} bits - number of bits for a peak.
 */
function extractPeaks(channel, samplesPerPixel, bits) {
    const chanLength = channel.length;
    const numPeaks = Math.ceil(chanLength / samplesPerPixel);

    // create interleaved array of min,max
    const peaks = makeTypedArray(bits, numPeaks * 2);

    for (let i = 0; i < numPeaks; i += 1) {
        const start = i * samplesPerPixel;
        const end = (i + 1) * samplesPerPixel > chanLength ? chanLength : (i + 1) * samplesPerPixel;

        const segment = channel.subarray(start, end);
        const extrema = findMinMax(segment);
        const min = convert(extrema.min, bits);
        const max = convert(extrema.max, bits);

        peaks[i * 2] = min;
        peaks[i * 2 + 1] = max;
    }

    return peaks;
}

function makeMono(channelPeaks, bits) {
    const numChan = channelPeaks.length;
    const weight = 1 / numChan;
    const numPeaks = channelPeaks[0].length / 2;
    const peaks = makeTypedArray(bits, numPeaks * 2);

    for (let i = 0; i < numPeaks; i += 1) {
        let min = 0;
        let max = 0;

        for (let c = 0; c < numChan; c += 1) {
            min += weight * channelPeaks[c][i * 2];
            max += weight * channelPeaks[c][i * 2 + 1];
        }

        peaks[i * 2] = min;
        peaks[i * 2 + 1] = max;
    }

    // return in array so channel number counts still work.
    return [peaks];
}

/**
 * @param {AudioBuffer,TypedArray} source - Source of audio samples for peak calculations.
 * @param {Number} samplesPerPixel - Number of audio samples per peak.
 * @param {Boolean} isMono - Whether to render the channels to a single array.
 * @param {Number} cueIn - index in channel to start peak calculations from.
 * @param {Number} cueOut - index in channel to end peak calculations from (non-inclusive).
 * @param {Number} bits - number of bits for a peak.
 */
export function webaudioPeaks(
    source: AudioBuffer | Float32Array,
    samplesPerPixel?: number,
    isMono?: boolean,
    cueIn?: boolean,
    cueOut?: boolean,
    bits?: Bits,
): PeakData {
    const formatSamplesPerPixel = typeof samplesPerPixel === "number" ? samplesPerPixel : 1000;
    const formatBits = typeof bits === "number" ? bits : 16;
    const formatCueIn = typeof cueIn === "number" ? cueIn : 0;
    const formatCueOut = typeof cueOut === "number" ? cueOut : source.length;
    const formatIsMono = isMono ?? true;

    if (![8, 16, 32].includes(formatBits)) {
        throw new Error("Invalid number of bits specified for peaks.");
    }

    const numChan = (source as AudioBuffer).numberOfChannels;
    let peaks = [];

    if (typeof (source as Float32Array).subarray === "undefined") {
        for (let c = 0; c < numChan; c += 1) {
            const channel = (source as AudioBuffer).getChannelData(c);
            const slice = channel.subarray(formatCueIn, formatCueOut);
            peaks.push(extractPeaks(slice, formatSamplesPerPixel, formatBits));
        }
    } else {
        peaks.push(
            extractPeaks(
                (source as Float32Array).subarray(formatCueIn, formatCueOut),
                formatSamplesPerPixel,
                formatBits,
            ),
        );
    }

    if (formatIsMono && peaks.length > 1) {
        peaks = makeMono(peaks, formatBits);
    }

    const numPeaks = peaks[0].length / 2;

    return {
        length: numPeaks,
        data: peaks,
        bits: formatBits,
    };
}
