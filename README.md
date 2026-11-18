# 礼乐之邦第五板块 · 源码

这是“礼乐之邦”第五板块的 React + Vite 源码版本，包含长滚动叙事、编钟动画、礼悬等级切换、视频随滚动播放以及键盘交互。

在线演示：<https://xuea18.github.io/>

## 本地运行

需要 Node.js 20 或更高版本。

```bash
npm install
npm run dev
```

浏览器打开终端中显示的本地地址。

## 构建

```bash
npm run build
npm run preview
```

构建结果生成在 `dist/`。

## 目录说明

```text
src/main.jsx                    页面入口、滚动状态和交互绑定
src/styles.css                  独立页面样式和无障碍处理
src/generated/part5.html        第五板块结构
src/generated/part5.css         第五板块视觉样式
src/generated/part5-timeline.js GSAP 动画时间轴
public/assets/rites5/           图片、视频和字体素材
```

修改文案和元素结构时编辑 `src/generated/part5.html`；修改视觉效果时编辑 `src/generated/part5.css`；修改滚动节奏、动画触发和元素运动时编辑 `src/generated/part5-timeline.js`。

## 二次开发

你可以 Fork 本仓库，然后替换文案、图片、视频和动画逻辑，构建自己的交互页面。当前资源路径以网站根目录为基准；直接部署到 `<用户名>.github.io` 可以保持现有路径。如果部署到 `https://<用户名>.github.io/<仓库名>/`，需要同步调整 `/assets/rites5/` 资源路径。

## 素材说明

仓库中的央视页面图片、视频、字体、文字和视觉素材仅作为页面研究与复现素材提供，不随本仓库授予商业使用或再分发许可。制作自己的版本时，请替换为你拥有使用权的素材。
