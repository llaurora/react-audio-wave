import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import postcss from "rollup-plugin-postcss";
import flexbugsFixes from "postcss-flexbugs-fixes";
import postcssPresetEnv from "postcss-preset-env";
import cssnano from "cssnano";
import { babel } from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import { readFile } from "fs/promises";

const pkg = JSON.parse(await readFile(new URL("./package.json", import.meta.url)));
const pkgDependencies = Object.keys(pkg.dependencies || {});
const pkgPeerDependencies = Object.keys(pkg.peerDependencies || {});
const external = [...pkgDependencies, ...pkgPeerDependencies, /@babel\/runtime/, "react", "react-dom"];
const extensions = ['.ts', '.tsx'];
const input = 'src/index.ts';

const postcssPlugins = [
    flexbugsFixes,
    postcssPresetEnv({
        autoprefixer: {
            flexbox: "no-2009",
        },
        stage: 3,
    }),
    cssnano(),
];

const getBabelOptions = ({ useESModules }) => {
    // @rollup/plugin-babel 不会自动扫描读取babel的配置文件
    return ({
        exclude: '**/node_modules/**',
        babelHelpers: "runtime",
        extensions: [".ts", ".tsx", ".js"],
        presets: [
            "@babel/preset-typescript",
            [
                "@babel/preset-env",
                {
                    "modules": useESModules ? false : 'auto',
                    "useBuiltIns": false
                }
            ],
            "@babel/preset-react",
        ],
        plugins: [
            [
                "@babel/plugin-transform-runtime",
                {
                    useESModules,
                    corejs: {
                        version: 3,
                        proposals: true,
                    },
                },
            ],
        ],
    })
};

const getPlugins = ({useESModules}) => {
    return [
        postcss({
            plugins: postcssPlugins,
        }),
        commonjs(),
        nodeResolve({extensions}),
        babel(getBabelOptions({useESModules})),
    ]
}

const globals = (id) => {
    if(id.startsWith("@babel/runtime-corejs")) {
        const name = id.split("/").at(-1);
        return `_${name}`
    }
    if(id === "react") {
        return "React"
    }
    return id;
}

export default [
    {
        input,
        external,
        output: {
            file: pkg.main,
            format: "es",
            exports: 'named',
        },
        plugins: getPlugins({useESModules: true}),
    },
    {
        input,
        external,
        output: {
            file: pkg.module,
            format: "cjs",
            exports: 'named',
        },
        plugins: getPlugins({useESModules: false}),
    },
    {
        input,
        external,
        output: {
            globals,
            file: "dist/react-audio-wave.js",
            format: "umd",
            name: "ReactAudioWave",
        },
        plugins: getPlugins({useESModules: false}),
    },
    {
        input,
        external,
        output: {
            globals,
            file: "dist/react-audio-wave.iife.js",
            format: "iife",
            name: "ReactAudioWave",
        },
        plugins: getPlugins({useESModules: false}),
    },
    {
        input,
        external,
        output: {
            globals,
            file: "dist/react-audio-wave.min.js",
            format: "umd",
            name: "ReactAudioWave",
        },
        plugins: [...getPlugins({useESModules: false}), terser()],
    },
]
