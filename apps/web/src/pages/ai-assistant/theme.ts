import type { CSSProperties } from "react";
import type { ThemeConfig } from "antd";

/** 输入器的组件配置与布局变量共用一个尺寸来源。 */
const controlHeight = 44;

export const assistantLayoutVariables: CSSProperties & {
  "--assistant-control-height": string;
} = {
  "--assistant-control-height": `${controlHeight}px`,
};

/** 局部主题通过 React 上下文同时作用于页面与 Portal 弹层。 */
export const assistantTheme: ThemeConfig = {
  token: {
    motionDurationSlow: "0.18s",
    motionDurationMid: "0.18s",
  },
};

export const composerTheme: ThemeConfig = {
  token: { controlHeight, borderRadius: 10 },
  components: {
    Button: {
      defaultColor: "#475467",
      defaultShadow: "none",
      paddingInline: 14,
    },
    Select: {
      colorBorder: "#cfe0ff",
      colorText: "#175cd3",
      selectorBg: "#f4f8ff",
      activeBorderColor: "#84adff",
      hoverBorderColor: "#84adff",
    },
  },
};
