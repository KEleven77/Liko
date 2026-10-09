# 第三方来源与许可声明

Liko 是个人维护的二次开发分支，不代表上游项目官方版本。第三方代码、字体和品牌素材归各自权利人所有。本文不是整体授权书；缺失的授权不能由 Liko 代为补授。授权链尚有缺口，见 [合规核查](docs/COMPLIANCE.md)。

## 上游代码和素材

- [Komari-Theme-SAO](https://github.com/WAOR/Komari-Theme-SAO)：WAOR 维护的直接上游，完整许可待核实。
- [komari-theme-Lumina](https://github.com/stqfdyr/komari-theme-Lumina)：初代设计和实现来源，完整许可待核实。
- [Komari-Theme-LuminaPlus](https://github.com/shanyang242/Komari-Theme-LuminaPlus)：已取得 MIT 原文，见 `public/licenses/luminaplus-MIT.txt`。
- [Circle Flags](https://github.com/HatScripts/circle-flags)：上游记载的旗帜素材来源，MIT 原文见 `public/licenses/circle-flags-MIT.txt`。
- 系统品牌标识及历史预览图：继承自上游，逐项授权待核实。不表示相关品牌的认可或背书。

## 1.1.0 新增参考记录

- [nuomiiiii/Lite-theme](https://github.com/nuomiiiii/Lite-theme)：参考 1.2.7 (`ee210a1`) 的服务器卡片信息层次、冷白/蓝黑配色和二级资源/网络监测页布局；由 Liko 按自身 React 组件和 API 适配。参考项目的 Apache-2.0 原文保存在 `public/licenses/lite-theme-Apache-2.0.txt`，随 `dist/licenses/` 发布。Liko 的相关适配和行为差异在 README 的 1.1.0 更新中注明，不替代参考项目的原版或官方版本。
- [towersip/komari-theme-Glassmorphism](https://github.com/towersip/komari-theme-Glassmorphism)：参考 Sparkline 延迟历史展示和时段查看交互，未复制其源码或素材；用既有 Canvas 和历史数据模型实现。其 MIT 原文保存在 `public/licenses/glassmorphism-MIT.txt`，包括原版权声明，随包保留供来源核查。
- SAO、Lumina、LuminaPlus 是已有继承链，不因本次参考关系而替换署名或整体重新授权。现有授权待核实事项仍保留在 `COMPLIANCE.md`。

## 运行时依赖许可

锁文件中的运行时包包含 React、React DOM、React Router、TanStack Query、clsx、cookie、scheduler、set-cookie-parser、uPlot、uplot-react、Zod、Lucide React 和 Inter 字体包。

除 Lucide React 声明 ISC、Inter 字体包声明 OFL-1.1 外，其余运行时包声明 MIT。Lucide 自身可能包含额外来源声明，应以完整包内文本为准，不以该简表替代许可条款。

每次构建运行 `scripts/make-notices.mjs`，收集实际安装的直接及传递依赖包内 LICENSE/NOTICE 和实际版本到 `public/THIRD_PARTY_NOTICES.txt`，由 Vite 复制到 `dist/` 并随主题 ZIP 发布。应完整保留其版权声明、许可条件及免责声明。
