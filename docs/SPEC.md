# AI Voiceover SaaS — Mini Spec

## 目标
一句话：聚合多家 AI TTS 服务商的语音，为内容创作者提供一站式配音解决方案。

## 核心功能
- **文本转语音**：输入文字，选择语音，生成高质量音频
- **多语音选择**：提供多种语音角色（不同性别、口音、语言）
- **实时预览**：试听效果后再生成完整音频
- **下载**：生成的音频可直接下载 MP3/WAV

## MVP 策略
由于需要多家 TTS API，MVP 采用以下策略：
1. **首期集成 OpenAI TTS**（通过 llm-proxy，支持 6 种声音）
2. **UI 展示"800+ 语音"**，但标注部分为"即将上线"
3. 后续根据用户反馈逐步接入更多 provider

## 语音列表（MVP）
| Provider | 语音数 | 状态 |
|----------|--------|------|
| OpenAI TTS | 6 | ✅ 可用 |
| Edge TTS | 300+ | ✅ 可用（免费） |
| Google Cloud | 200+ | 🔜 即将上线 |
| AWS Polly | 60+ | 🔜 即将上线 |
| Azure | 200+ | 🔜 即将上线 |

## 技术方案
- **前端**：React + Vite (TypeScript)，Tailwind CSS
- **后端**：Python FastAPI
- **TTS 实现**：
  - OpenAI TTS via llm-proxy.densematrix.ai
  - Edge TTS (edge-tts Python 库，免费无限调用)
- **部署**：Docker → langsheng

## 数据流
```
用户输入文本 → 选择语音 → 调用 TTS API → 生成音频 → 返回音频 URL → 播放/下载
```

## 完成标准
- [ ] 核心 TTS 功能可用（至少 OpenAI + Edge TTS）
- [ ] 语音选择器展示所有可用语音
- [ ] 音频预览播放功能
- [ ] 下载生成的音频
- [ ] 支付集成（按次计费）
- [ ] 部署到 voiceover.demo.densematrix.ai
- [ ] Health check 通过

## 定价方案
- **免费试用**：每设备 1 次
- **基础包**：$4.99 / 10 次生成
- **标准包**：$9.99 / 30 次生成
- **专业包**：$19.99 / 100 次生成

## 端口分配
- Frontend: 30061
- Backend: 30062
