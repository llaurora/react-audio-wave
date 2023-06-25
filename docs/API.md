The Props of ReactAudioWave Component
```tsx
interface ReactAudioWaveProps {
    waveHeight: number;
    colors: Wavecolors;
    audioSrc: string;
    placeholder: PropsWithChildren<any>;
    emptyElement?: ReactElement;
    barGap?: number;
    barWidth?: number;
    progressStyle?: CSSProperties;
    supportPlaybackRate?: boolean;
    mono?: boolean;
    progressCursorVisible?: boolean;
    cursorVisible?: boolean;
    cursorTimeConfig?: CursorTimeConfig;
    className?: string;
    timeFormat?: (seconds: number) => string;
    onChangeLoadState?: (state: LoadStateEnum, duration?: number) => void;
    onCurrentTimeChange?: (current: number) => void;
    onWaveSizeChange?: (size: Size) => void;
    onPlayEnded?: () => void;
    renderErrorElement?: (error?: string) => ReactElement;
}
```
#### `waveHeight`

Type: `number`

Required: `true`

The height of wave component.

### `colors`
Type: `Wavecolors`
```ts
interface Wavecolors {
    progressColor: string;
    waveColor: string;
    cursorColor?: string;
    waveBackground?: string;
}
```

Required: `true`

The colors of the wave component such as color of the progress bar, color of the background and so on.

### `audioSrc`
Type: `string`

Required: `true`

The audio src of wave component.

### `placeholder`
Type: `string`

Required: `true`

Placeholder before audio decoded.

### `emptyElement`
Type: `ReactElement`

Required: `false`

Default: `<span>no audio content</span>`

Placeholder when audio content is empty.

### `barGap`
Type: `number`

Required: `false`

Default: `0`

The optional spacing between bars of the wave.

### `barWidth`
Type: `number`

Required: `false`

Default: `1`

The height of wave bar.

### `progressStyle`
Type: `CSSProperties`

Required: `false`

Customize the progress bar style.

### `supportPlaybackRate`
Type: `boolean`

Required: `false`

Default: `false`

Whether audio playback is supported.

Always get audiobuffer through Web Audio and then visualize the waveform graph, if you use less than double speed, play and other operation controls are also completed using Web Audio, if you want to support double speed playback, use audio tags to complete playback and other operation control.

### `mono`
Type: `boolean`

Required: `false`

Default: `true`

Whether the audio is mono.

### `progressCursorVisible`
Type: `boolean`

Required: `false`

Default: `true`

Whether the progress cursor is Visible.

### `cursorVisible`
Type: `boolean`

Required: `false`

Default: `true`

Whether there is a moment pointer when the mouse hovers.

### `cursorTimeConfig`
Type: `CursorTimeConfig`
```ts
interface Wavecolors {
    zIndex?: number;
    formatTimeCallback?: (cursorTime: number) => string;
    customShowTimeStyle?: CSSProperties;
}
```

Required: `false`

Config of cursor node when the mouse hovers.

### `className`
Type: `string`

Required: `false`

The classname of wave component.

### `timeFormat`
Type: `(seconds: number) => string`

Required: `false`

Customize the time format display.

### `onChangeLoadState`
Type: `(state: LoadStateEnum, duration?: number) => void`
```ts
enum LoadStateEnum {
    "EMPTY" = -1, // content is empty
    "INIT" = 0, // initial state
    "LOADING" = 1, // loading
    "SUCCESS" = 2, // load successfully
    "ERROR" = 3, //  Failed to load or decode
}
```
Required: `false`

The callback function when the audio loading or decoding state changes.

### `onCurrentTimeChange`
Type: `(current: number) => void`

Required: `false`

The callback function for the progress of audio playback time.

### `onWaveSizeChange`
Type: `(size: Size) => void`

Required: `false`

The callback function when the size of wave component changes.

### `onPlayEnded`
Type: `() => void`

Required: `false`

The callback function at the end of audio playback.

### `renderErrorElement`
Type: `(error?: string) => ReactElement`

Required: `false`

Customize rendering when loading or decoding fails.




