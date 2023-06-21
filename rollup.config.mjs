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
const extensions = ['.ts', '.tsx'];

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

const babelOptions = {
    exclude: "node_modules/**",
    babelHelpers: "runtime",
    extensions: [".ts", ".tsx", ".js"],
    presets: [
        "@babel/preset-typescript",
        "@babel/preset-env",
        [
            "@babel/preset-react",
            {
                runtime: "automatic",
            },
        ],
    ],
    plugins: [
        [
            "@babel/plugin-transform-runtime",
            {
                corejs: {
                    version: 3,
                    proposals: true,
                },
            },
        ],
    ],
};

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

export default {
    input: "src/index.ts",
    output: [
        {
            globals,
            file: "dist/react-audio-wave.js",
            format: "umd",
            name: "ReactAudioWave",
        },
        {
            globals,
            file: "dist/react-audio-wave.iife.js",
            format: "iife",
            name: "ReactAudioWave",
        },
        {
            globals,
            file: "dist/react-audio-wave.min.js",
            format: "umd",
            name: "ReactAudioWave",
            plugins: [terser()],
        },
        {
            file: pkg.main,
            format: "cjs",
        },
        {
            file: pkg.module,
            format: "esm",
        },
    ],
    external: [/@babel\/runtime/, "react", "react-dom"],
    plugins: [
        commonjs(),
        nodeResolve({extensions}),
        babel(babelOptions),
        postcss({
            plugins: postcssPlugins,
        }),
    ],
};
