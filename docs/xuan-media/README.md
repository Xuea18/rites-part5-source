# 乐悬点击播放验证

- 四套资源按 gong / xuan / pan / te 分别映射宫悬、轩悬、判悬、特悬。
- 直接读取工作区 public/assets/xuan 中的素材；Vite 开发服务提供资源，构建时原样输出，不修改素材。
- 默认 PNG；每次播放使用新 Blob URL 启动单次 WebP，避免复用已停在末帧的图片缓存。
- 文件实际为 81 帧、5062ms、循环一次。计时结束恢复 PNG、暂停音频并归零。
- 同槽位重复点击锁定；悬牌切换、页面隐藏或离开场景时立即取消播放和待加载请求。
- 已验证桌面 Chrome 的四套真实鼠标点击、音频播放状态、重复点击锁、自动复位、悬牌切换复位，未出现运行时错误。详见 results.json。
- results.json 的 delta 是图片 load 与音频 playing 事件时间差，不等于设备扬声器输出与实际绘制的端到端延迟。
- iOS Safari 真机、慢网首次点击和实际听感尚未人工验收。

本地运行：npm run dev -- --host 127.0.0.1 --port 5175

自动检查：node scripts/verify-xuan-media.cjs

构建：npm run build

仅本地修改，未发布 GitHub Pages。
