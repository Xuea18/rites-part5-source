# 礼乐之邦第五板块 · B 组交互增强源码

这是 CCTV 青铜文明“礼乐之邦”第五板块的 React + Vite 源码项目，包含长滚动叙事、乐悬等级切换、编钟音画播放、单钟点击、刮奏与移动端适配。

- 在线演示：<https://xuea18.github.io/b/>
- 源码仓库：<https://github.com/Xuea18/rites-part5-source>

## 下载和运行

需要 Node.js 22.12 或更高版本。

```bash
git clone https://github.com/Xuea18/rites-part5-source.git
cd rites-part5-source
npm install
npm run dev
```

浏览器打开终端显示的地址，默认路径为 `/b/`。

## 构建

```bash
npm run build
npm run preview
```

构建结果位于 `dist/`。项目所需图片、字体、视频、动画和音频均已包含在 `public/assets/`，不依赖仓库外部文件。

如果部署到 `https://<用户名>.github.io/<仓库名>/b/`，构建前设置：

```bash
PAGES_BASE=/<仓库名>/ npm run build
```

Windows PowerShell：

```powershell
$env:PAGES_BASE='/<仓库名>/'
npm run build
```

## 主要目录

```text
src/main.jsx                    页面入口、滚动状态和公共导航
src/generated/part5.html        第五板块原始结构
src/generated/part5.css         第五板块视觉样式
src/generated/part5-timeline.js GSAP 滚动时间轴
src/experiment/                 鼠标、编钟、乐悬与音频交互
public/assets/rites5/           场景、字体和视频
public/assets/xuan/             四套乐悬动画、首帧和音频
public/assets/audio/            背景音乐与编钟声音
```

## 交互说明

- 宫悬、轩悬、判悬、特悬点击后播放对应动画与编钟音乐，结束后恢复首帧。
- 后段编钟支持单击发声、横向刮奏、音量与混响控制。
- 手机端自动使用轻量动画和 540p 视频；桌面端使用较高清资源。
- 视频和动画均按需加载，避免阻塞首屏。

更完整的参数和实验说明见 [B-GROUP.md](B-GROUP.md)。

## 素材说明

仓库中的 CCTV 页面图片、视频、字体、文字和视觉素材仅用于页面研究与复现，不随本仓库授予商业使用或再分发许可。制作自己的版本时，请替换为拥有使用权的素材。
