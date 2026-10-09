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
- 居中 Sparkline 缓存点位和配色，悬停与缩放复用点位；主题设置移除不可达的旧任务绑定编辑器，但仍保留旧绑定配置的读取和保存兼容性。
- 点击网络区域打开服务器网络弹窗，支持时间范围及可点击彩色图例。
- 网络弹窗并行加载图表代码与数据，先展示延迟和丢包记录，再补充后台统计；重复打开或切回已加载时段复用缓存。
- 无数据、报错和加载中仍可切换时间，空数据可刷新；自定义小时允许清空编辑，提交时校验范围。
- 网络弹窗最大宽度 1120px，支持移动端自适应。
- 压缩首页监控总览布局，改进设置保存反馈。

## 1.1.0 更新与参考来源

| 项目 | 关系 | 本次沿用或借鉴的内容 |
| --- | --- | --- |
| [WAOR/Komari-Theme-SAO](https://github.com/WAOR/Komari-Theme-SAO) | 直接代码上游 | 沿用 React/TypeScript 工程、设置体系、节点数据与监控基础，在其基础上二次开发，而非从零原创。 |
| [nuomiiiii/Lite-theme](https://github.com/nuomiiiii/Lite-theme) | 本次布局和视觉参考；参考版本 1.2.7，提交 `ee210a1` | 首页服务器卡片的信息层次、冷白/蓝黑配色、上传下载和资源指标排列、费用与带宽区域；二级页面的服务器头部、资源详情/网络监测切换、资源图表分区、探测任务总览和统计区布局。Liko 结合自身数据接口和组件重新适配，保留削峰平滑、断点连线及全部任务全选/全不选切换。 |
| [towersip/komari-theme-Glassmorphism](https://github.com/towersip/komari-theme-Glassmorphism) | Sparkline 功能与交互参考 | 借鉴延迟趋势线及按时段查看历史数据的展示思路；使用 Liko 既有 Canvas 和历史数据模型实现，未复制该项目源码或素材，不整体移植其毛玻璃样式。 |
| [Lumina](https://github.com/stqfdyr/komari-theme-Lumina) / [LuminaPlus](https://github.com/shanyang242/Komari-Theme-LuminaPlus) | SAO 上游历史来源 | 保留继承链署名；不是本次新增的直接移植项目，详见下方原项目来源说明。 |

- 移除旧版紧凑首页卡片及其预览切换入口，正式包仅使用本地已确认的新版布局：最多展示 6 个延迟任务，未配置的位置空白占位，统一卡片高度；最近 1 小时分为 20 段，每段 3 分钟。
- 增加剩余价值、费用币种转换、后台流量重置时间，以及与名称顶部对齐的在线时长。
- 点击服务器卡片进入二级页面；点击延迟区域打开延迟/丢包弹窗；弹出浮层时点击外部仅关闭浮层。
- 减少重复排序、时间解析和未显示任务的指标计算；后台页面暂停指标图绘制；改进休眠恢复加载和网络弹窗缓存复用。

参考来源不表示官方合作或背书。Lite-theme 的 Apache-2.0 许可和 Glassmorphism 的 MIT 许可原文随包保留，见 [第三方声明](THIRD_PARTY_NOTICES.md)。这些许可不替代 SAO/Lumina 等继承部分仍待核实的授权。

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

Liko 保留上游项目的历史和来源说明。下方为原项目文档，SAO 系列其他服务端版本的说明不代表 Liko 已完成兼容验证。上游 README 声明 MIT，但对应完整授权和版权声明尚待核实；不据此替所有上游权利人授予 MIT 许可。已取得的第三方许可证见 [第三方声明](THIRD_PARTY_NOTICES.md)。

---

<p align="center">
  <strong>面向多种探针服务端的 SAO 系列探针主题</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-review_pending-yellow" alt="License review pending">
  <img src="https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen" alt="Node Version">
  <img src="https://img.shields.io/badge/TypeScript-Strict-blue" alt="TypeScript">
</p>

<p align="center">
  <img src="./preview.png" alt="Theme Preview" width="100%">
</p>

> ⚠️ **项目声明**  
> 本项目为个人基于开源社区成果进行的二次开发与定制分支。  
> 若您正在寻找上游原版或探索更多分支，建议前往支持原作者项目：
> - 初代设计项目：[stqfdyr/komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina)
> - 功能增强上游：[shanyang242/Komari-Theme-LuminaPlus](https://github.com/shanyang242/Komari-Theme-LuminaPlus)
> - 社区移植参考：[volcano-1025/CFSM-Theme-LuminaPlus](https://github.com/volcano-1025/CFSM-Theme-LuminaPlus) / [guboysky/LuminaPlus](https://github.com/guboysky/LuminaPlus)

---

## 📜 主题族谱与演进脉络

本项目前端界面的设计思路与代码结构演进关系如下：

```text
[初代设计] komari-theme-Lumina (作者: @stqfdyr)
    │
    ▼
[功能扩展] Komari-Theme-LuminaPlus (作者: @shanyang242 / @shark)
    │   ├─ 引入背景图/动态壁纸、透明度调节、首页文字评级、Ping/负载图表等特性
    │   └─ 社区移植探索：
    │       ├─ @volcano-1025 (移植至 CF-Server-Monitor)
    │       └─ @guboysky (移植至 Monitor-Probe)
    │
    ▼
[SAO 家族定制分支] Theme-SAO 系列 (作者: @WAOR)
    ├─ Komari-Theme-SAO   : 适配 Komari 探针
    ├─ CFSM-SAO           : 适配 CFSM 探针
    └─ Monitor-SAO        : 适配极简探针
```

---

## ⚡ 核心通用特性

### 1. 极致加载速度优化

- **早期数据并行预取**：在 HTML `<head>` 阶段通过内联脚本并行发起数据请求，彻底告别单页应用常见的串行等待。
- **立体骨架屏秒级占位**：在首屏真实数据抵达前渲染结构对齐的呼吸骨架，有效缓解页面等待空白感。
- **构建按需分包加载**：对图表库等重型依赖异步拆包加载，严格控制首屏核心脚本体积。

### 2. 界面设计与视觉体验

- **双栏总览仪表盘**：
  - **核心指标区**：汇总活跃连接、CPU、内存磁盘占用、今日流量与资产等运维指标。
  - **集群状态看板（右侧核心区）**：
    - **分段式在线健康指示格**：直观呈现全站在线率与离线数量，采用单机一格的状态方块映射节点存活（健康绿 / 离线灰）。
    - **双轨实时网络吞吐波形**：对称呈现上行与下行独立波形，采用轻量原生 SVG 贝塞尔曲线绘制；内置整值自适应标尺算法，高帧率平滑呈现瞬时网络脉冲。
    - **状态呼吸胶囊与带宽评级**：配备联动呼吸状态胶囊（健康 / 离线），根据全站瞬时总吞吐动态映射等级徽章。

- **护眼浅色与纯粹深色体系**：
  - **浅色模式**：采用分层浅灰底色搭配立体悬浮卡片，降低明亮背景下的视觉眩光刺激。
  - **深色模式**：采用中性碳黑基调重构，避免杂色泛蓝，暗光环境下更具极客沉浸感。

### 3. 运维细节与隐私防护

- **敏感资产数据受控隐藏**：默认对未登录访客隐藏节点费用与资产总值。管理员登录后可在设置中开启展示，或通过顶栏快捷按钮一键切换临时显隐，便于安全截图分享。

### 4. 响应式布局与移动端适配

- **弹性多端自适应**：深度优化移动端与桌面小窗口布局，确保不同窗口尺寸下网络吞吐波形均能舒展呈现，避免组件挤压折叠。
- **iOS 灵动岛全景融合**：针对全面屏安全区深度适配，顶栏背景色自然蔓延覆盖至状态栏与灵动岛背后，无论深浅色皆浑然一体，消除顶部色彩断层。

---

## 🧩 各版本专属特性与差异说明

由于不同探针后端的数据结构差异，各版本针对性保留并优化了以下特性：

### 1. Komari 版本基准 ([Komari-Theme-SAO](https://github.com/WAOR/Komari-Theme-SAO))

- **功能最完整的基准版本**：作为 SAO 系列功能完备的旗舰基准实现。
- **默认资产保密机制**：默认对访客隐藏敏感费用，支持后台开启展示或快捷临时切换。
- **灵动流光昵称与动态语境问候**：
  - **首屏流光入场（Sweep Layer）**：首屏初次渲染时用户昵称由多色光谱光带自左向右掠过字形，平滑完成初次亮相。
  - **常态极光呼吸（Aurora Layer）**：流光结束后无缝过渡至低饱和度多色极光背景，以 8 秒为周期保持缓慢微流动态，长时间停留舒适耐看。
- **时段关怀与语境联动**：自动感知本地时段，根据在线率智能切换契合的状态问候。
- **智能昵称读取**：访客固定展示为 `Guest`，登录后自动读取并展示实际用户名。
- **无限制延迟测速槽位**：相较上游分支，不限制首页测速线路展示数量（支持大小卡）。
- **个性化碳黑暗色重构**：以中性碳黑色为核心基调深度重构暗色主题，提供纯粹克制的夜间视觉体验。
- **细节打磨与边界优化**：全面修复并优化上游遗留的各处排版微瑕与组件边界细节。

### 2. CFSM 版本差异 ([CFSM-SAO](https://github.com/WAOR/CFSM-SAO))

- **彩色标签智能着色**：支持在后台节点备注中使用 `标签名-颜色` 格式（如 `香港BGP-blue`、`特惠机-red`）自定义标签色彩；未指定颜色时系统将基于关键词自动匹配适宜色系。
- **自定义管理员昵称**：因 CFSM 探针原生未下发用户名字段，本版本支持站长自定义昵称并持久化保存至 D1 数据库，可在首页直接点击编辑或在后台统一配置。
- **受限平台功能说明**：受限于 Cloudflare Workers 免费配额与请求计费模型，每日流量汇总统计与历史峰值记录在此版本中暂不提供。

### 3. 极简探针版本差异 ([Monitor-SAO](https://github.com/WAOR/Monitor-SAO))

- **服务端标准配置持久化**：深度适配探针官方配置持久化接口，确保各项设置跨设备自动同步生效。
- **用户昵称自由定制**：后端无原生用户名特性，支持自定义昵称，可在首页点击修改或后台统一配置。
- **轻量置顶公告栏**：提供站长公告广播位，方便向访客留言；未配置内容时自动折叠不占页面空间。

#### 极简探针版待完善功能说明

- **节点标签功能暂未支持**：因当前极简探针后端尚未提供节点标签（Tags）字段，原线路色彩药丸标签功能暂处于冻结状态，待后端接口支持后主题将更新适配。

---

## 🚀 安装与部署

请根据您使用的探针服务端类型选择对应的安装方式：

### Komari
1. 前往 [Komari-Theme-SAO Releases](https://github.com/WAOR/Komari-Theme-SAO/releases) 下载对应主题压缩包；
2. 在 Komari 后台主题管理中上传并启用。

### Monitor-Probe（极简探针）
1. 前往 [Monitor-SAO Releases](https://github.com/WAOR/Monitor-SAO/releases) 下载最新版本的打包产物 `theme.tar.gz`；
2. 在极简探针后台主题设置页面上传并启用。

### CF-Server-Monitor (CFSM)
- **方式一：主题商店一键启用（推荐）**  
  登录 CFSM 后台前往「主题商店」，找到 **SAO** 主题点击启用即可。
- **方式二：手动添加仓库地址（锁定特定版本）**  
  在「主题商店」中填入以下地址安装：
  - 追踪最新发布版：`https://github.com/WAOR/CFSM-SAO/tree/dist`
  - 锁定特定 Commit：`https://github.com/WAOR/CFSM-SAO/tree/<40位CommitSHA>`

---

> 📌 **特别说明：关于背景多媒体功能的说明**  
> SAO 系列主题已彻底移除上游遗留的「自定义背景图与动态视频」功能及内置预设视频文件。作为高密度专业运维监控看板，纯净统一的底色能提供最佳的文字可读性与更轻量的包体积。

---

## 💖 致谢

感谢以下优秀开源项目与社区贡献者的付出：
- **[WAOR/Komari-Theme-SAO](https://github.com/WAOR/Komari-Theme-SAO)**：Liko 的直接代码上游，提供工程结构、主题设置、节点数据及监控功能基础。
- **[nuomiiiii/Lite-theme](https://github.com/nuomiiiii/Lite-theme)**：参考其服务器卡片信息层次、冷白/蓝黑配色、资源与费用排布，以及二级资源详情、网络监测和探测任务总览布局，并按 Liko 的组件与数据接口适配。
- **[towersip/komari-theme-Glassmorphism](https://github.com/towersip/komari-theme-Glassmorphism)**：参考 Sparkline 延迟趋势与按时段查看历史数据的交互思路；使用 Liko 现有 Canvas 与历史数据模型实现，未复制其源码或素材。
- **[stqfdyr/komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina)**：初代优雅主题开创者。
- **[shanyang242/Komari-Theme-LuminaPlus](https://github.com/shanyang242/Komari-Theme-LuminaPlus)**：出色的功能增强分支与架构设计。
- **[volcano-1025/CFSM-Theme-LuminaPlus](https://github.com/volcano-1025/CFSM-Theme-LuminaPlus)**：CFSM 平台的早期移植探索。
- **[guboysky/LuminaPlus](https://github.com/guboysky/LuminaPlus)**：Monitor 探针平台的移植尝试。
- **[Montia37/komari-theme-purcarte](https://github.com/Montia37/komari-theme-purcarte)**：动态背景视频的设计与参考素材。
- **[komari-monitor/komari](https://github.com/komari-monitor/komari)**、**[huilang-me/CF-Server-Monitor](https://github.com/huilang-me/CF-Server-Monitor/)** 与 **[monitor-probe/monitor](https://github.com/monitor-probe/monitor)**：探针监控服务端的作者及社区维护者。

---

## 📄 开源许可证

上游文档曾声明采用 MIT，但当前授权链仍有待核实项，不能据此认定 Liko 整体已获 MIT 授权。已确认组件遵循其各自许可证，详见 [第三方声明](THIRD_PARTY_NOTICES.md) 和 [合规核查](docs/COMPLIANCE.md)。
