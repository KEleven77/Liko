# Liko

基于 [WAOR/Komari-Theme-SAO](https://github.com/WAOR/Komari-Theme-SAO) 二次开发的 Lite 探针主题，维护者：Liko。

## 项目声明

本项目仅作为个人二次开发、学习和自用测试使用。本分支的二次开发完全使用 AI Vibe Coding，由维护者提出需求并进行选择、测试和发布；这不代表上游代码或第三方素材均由 AI 生成，也不代表本项目拥有其全部著作权。

本项目并非 Lite、Komari、SAO 或相关品牌的官方项目，与其不存在官方合作或背书关系。原有代码、字体、图标及品牌标识的权利仍归各自权利人所有，`Liko` 作者字段表示本分支维护者，不代表对上游作品的原创署名。

个人自用定位和 AI 开发声明不替代开源许可证或权利人授权，也不构成免责或无侵权保证。授权链仍有待核实项，完整记录见 [合规核查](docs/COMPLIANCE.md)。在补齐授权证据前，不应将本项目视为已完成合规审查或整体获得 MIT 授权的项目，也不建议进一步公开分发安装包或用于商业用途；这不是对第三方许可证额外施加使用限制。

如权利人发现署名、许可或素材使用问题，请通过本仓库 Issue 提供涉及文件及权属信息，维护者会核实并进行补充署名、替换或移除等处理。该处理机制不代替事先取得必要授权。

## 安装

1. 从 [Liko Releases](https://github.com/KEleven77/Liko/releases) 下载主题 ZIP。
2. 备份现有主题及配置，在 Lite 后台主题管理中上传并启用。
3. 在 Liko 主题设置中选择默认三条探测线路；需要独立显示的服务器可勾选 1 到 8 条任务。

后台探测任务负责采集数据，主题设置负责首页展示。新增后台任务不会自动加入首页，需在对应服务器的主题设置中勾选并保存。

## 定制内容

- 默认三条线路，支持逐服务器独立配置或隐藏。
- 延迟与丢包率并排展示，分别对应历史指标条。
- 主题设置的「延迟」分组可选择「指标条」或「Sparkline」，默认保留指标条。Sparkline 仅将延迟历史指标条替换为趋势线，任务名、数值、丢包率和行高保持不变；支持时段提示、键盘查看和点击网络弹窗，缺失数据保留断点。
- Sparkline 展示与时段查看交互参考 [towersip/komari-theme-Glassmorphism](https://github.com/towersip/komari-theme-Glassmorphism)，在本项目现有 Canvas 和历史数据模型上独立实现，未复制该项目源代码或素材。
- Sparkline 缓存点位和配色，在数据、尺寸与主题未变化时复用曲线路径及渐变，减少查看历史时的重复计算；主题设置移除不可达的旧任务绑定编辑器，但仍保留旧绑定配置的读取和保存兼容性。
- 点击网络区域打开服务器网络弹窗，支持时间范围及可点击彩色图例。
- 网络弹窗并行加载图表代码与数据，先展示延迟和丢包记录，再补充后台统计；重复打开或切回已加载时段复用缓存。
- 无数据、报错和加载中仍可切换时间，空数据可刷新；自定义小时允许清空编辑，提交时校验范围。
- 网络弹窗最大宽度 1120px，支持移动端自适应。
- 压缩首页监控总览布局，改进设置保存反馈。

## 本地开发

使用 Node.js 22 或兼容当前 Vite 版本的更新版本。

```sh
npm ci
npm run dev
npm test
npm run package
```

本地模拟预览使用 `/?mock=1&admin=1&customPing=1`，仅开发模式生效，生产包不包含模拟接口。

## 来源说明

Liko 基于 Komari-Theme-SAO 二次开发，继承 Lumina / LuminaPlus 系列的历史来源；布局和交互参考及社区贡献见下方致谢。SAO 系列其他服务端版本不代表 Liko 已完成兼容验证。

上游 README 声明 MIT，但对应完整授权和版权声明尚待核实；不据此替所有上游权利人授予 MIT 许可，也不能据此认定 Liko 整体已获 MIT 授权。已确认组件遵循各自许可证，详见 [第三方声明](THIRD_PARTY_NOTICES.md) 和 [合规核查](docs/COMPLIANCE.md)。

## 致谢

感谢以下优秀开源项目与社区贡献者的付出：
- **[nuomiiiii/Lite](https://github.com/nuomiiiii/Lite)**：当前使用的 Lite 后端项目，为 Liko 提供服务器监控、探针数据接口及主题运行支持；感谢其作者和社区维护者。本主题为独立二次开发分支，不代表 Lite 官方版本或背书。
- **[WAOR/Komari-Theme-SAO](https://github.com/WAOR/Komari-Theme-SAO)**：Liko 的直接代码上游，提供工程结构、主题设置、节点数据及监控功能基础。
- **[nuomiiiii/Lite-theme](https://github.com/nuomiiiii/Lite-theme)**：参考其服务器卡片信息层次、冷白/蓝黑配色、资源与费用排布，以及二级资源详情、网络监测和探测任务总览布局，并按 Liko 的组件与数据接口适配。
- **[towersip/komari-theme-Glassmorphism](https://github.com/towersip/komari-theme-Glassmorphism)**：参考 Sparkline 延迟趋势与按时段查看历史数据的交互思路；使用 Liko 现有 Canvas 与历史数据模型实现，未复制其源码或素材。
- **[sanrokamlan-prog/komari-theme-Glassmorphism](https://github.com/sanrokamlan-prog/komari-theme-Glassmorphism)**：仅参考其 v3.4.1 三网曲线的细线及渐变填充样式，感谢该分支维护者与 Glassmorphism 原作者 Tony Liu 的开源贡献；不移植其他布局或素材。
- **[stqfdyr/komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina)**：初代优雅主题开创者。
- **[shanyang242/Komari-Theme-LuminaPlus](https://github.com/shanyang242/Komari-Theme-LuminaPlus)**：出色的功能增强分支与架构设计。
- **[volcano-1025/CFSM-Theme-LuminaPlus](https://github.com/volcano-1025/CFSM-Theme-LuminaPlus)**：CFSM 平台的早期移植探索。
- **[guboysky/LuminaPlus](https://github.com/guboysky/LuminaPlus)**：Monitor 探针平台的移植尝试。
- **[Montia37/komari-theme-purcarte](https://github.com/Montia37/komari-theme-purcarte)**：动态背景视频的设计与参考素材。
- **[komari-monitor/komari](https://github.com/komari-monitor/komari)**、**[huilang-me/CF-Server-Monitor](https://github.com/huilang-me/CF-Server-Monitor/)** 与 **[monitor-probe/monitor](https://github.com/monitor-probe/monitor)**：探针监控服务端的作者及社区维护者。
