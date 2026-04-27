import path from "path";
import { defineConfig, type UserConfigExport } from "@tarojs/cli";

export default defineConfig<"webpack5">(() => {
  const config: UserConfigExport<"webpack5"> = {
    projectName: "fushengji-miniprogram",
    date: "2026-04-27",
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      828: 1.81 / 2,
    },
    sourceRoot: "src",
    outputRoot: "dist",
    framework: "react",
    compiler: "webpack5",
    plugins: ["@tarojs/plugin-framework-react"],
    alias: {
      "@game": path.resolve(__dirname, "../../src"),
    },
    copy: {
      patterns: [],
      options: {},
    },
    mini: {
      compile: {
        include: [path.resolve(__dirname, "../../src")],
      },
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false,
        },
      },
    },
  };

  return config;
});
