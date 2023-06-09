# <img src="https://cultofthepartyparrot.com/parrots/hd/everythingsfineparrot.gif" width="30" height="30"/> react-audio-wave
![wave.png](./wave.png)

## <img src="https://cultofthepartyparrot.com/guests/hd/trollparrot.gif" width="30" height="30"/> Props

| Name                    | Describle                  | Type                                                                                                         | Required | Default | Remark                                                       |
| ----------------------- | -------------------------- |--------------------------------------------------------------------------------------------------------------| -------- | ------- | ------------------------------------------------------------ |
| audioSrc                | 音频资源地址               | string                                                                                                       | rule     |         |                                                              |
| waveHeight              | 音频图高度                 | number                                                                                                       | rue      |         |                                                              |
| colors                  | 音频图相关颜色             | {progressColor: string; waveColor: string; waveBackground?: string;cursorColor?: string;}                    | true     |         | progressColor：音频图进度条/位置指针颜色；waveColor：音频图颜色；waveBackground：音频图背景颜色 |
| obsever                 | 事件监听                   | EventEmitter                                                                                                 | true     |         | 可注册的事件监听包含：播放(play)、暂停(pause)、声音(volume)、倍速(playbackRate)、跳转(seekTo) |
| placeholder             | 音频加载解码成功前的占位符 | ReactElement                                                                                                 | true     |         |                                                              |
| progressStyle           | 进度条样式                 | CSSProperties                                                                                                | false    |         |                                                              |
| supportPlaybackRate     | 是否支持倍速播放           | boolean                                                                                                      | false    | false   | 支持倍速播放的话得通过<audio/>标签控制                       |
| mono                    | 是否合并声道               | boolean                                                                                                      | false    | true    |                                                              |
| progressCursor          | 是否显示进度指针           | number                                                                                                       | false    | true    |                                                              |
| cursorTimeConfig        | 鼠标移入后时间点展示配置   | {zIndex?: number; formatTimeCallback?: (cursorTime: number) => string; customShowTimeStyle?: CSSProperties;} | false    |         |                                                              |
| className               | 音频图组件类名             | string                                                                                                       | false    |         |                                                              |
| errorContainerClassName | 加载或者解码失败容器类名   | string                                                                                                       | false    |         |                                                              |
| onChangeLoadState       | 加载解码状态变化回调       | (state: LoadStateEnum, duration?: number) => void                                                            | false    |         |                                                              |
| onCurrentTimeChange     | 当前时间点变化回调         | (current: number) => void;                                                                                   | false    |         |                                                              |
| onWaveSizeChange        | 音频图容器尺寸变化回调     | (size: Size) => void                                                                                         | false    |         |                                                              |
| onPlayEnded             | 播放结束回调               | () => void                                                                                                   | false    |         |                                                              |

