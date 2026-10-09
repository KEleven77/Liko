# Liko 授权与素材核查

核查日期：2026-10-04。范围：当前源码、生产依赖、随包素材以及已发布安装包的打包方式。这是技术层面的授权资料核查，不是律师法律意见、司法认定或无侵权保证；未对全部代码逐行溯源，也未完成所有司法辖区的审查。

## 结论

**目前不能认定项目已全面合理合规。** 发现上游授权链、品牌素材来源和历史安装包许可证随附方面的缺口。个人使用、非商业定位、注明来源和 AI Vibe Coding 均不能自动取得第三方权利。

## 核查记录

| 项目 | 证据与现状 | 处理及待办 |
| --- | --- | --- |
| WAOR/Komari-Theme-SAO | 本地基线为 `115445d`；README 声明 MIT，但基线未包含独立 LICENSE，已取得历史中未找到许可证文件。在线仓库根目录也未找到该文件。 | 保留来源和 Git 历史；需向维护者确认具体许可、版权声明及其覆盖范围。未发现文件不等于已判定侵权，也不能代替授权证据。 |
| stqfdyr/komari-theme-Lumina | 上游族谱指向该项目；在线根目录未找到独立 LICENSE。 | 需核查继承代码并取得原权利人的许可证或书面授权，不能只依赖下游作者的声明。 |
| shanyang242/Komari-Theme-LuminaPlus | 在线 LICENSE 为 MIT，版权行为 `Copyright (c) 2026 Shanyang242`。 | 保留完整原文；该许可证不自动证明更早代码及所有素材均已获授权。 |
| Circle Flags | 上游文档称使用该图标集，HatScripts/circle-flags 有 MIT 许可证。 | 保留其版权及许可原文；尚未逐一校验本地所有旗帜与上游文件的对应关系。 |
| 生产依赖 | 锁文件列出 15 个运行时包，声明为 MIT、ISC 或 OFL-1.1。许可证元数据不能单独代替完整授权文本。 | 构建时从实际安装的直接及传递依赖收集完整 LICENSE/NOTICE；清单记录实际版本，CI 的 `npm ci` 使用锁定版本。不是漏洞、专利或全供应链审计。 |
| Inter 字体 | `@fontsource-variable/inter` 声明 OFL-1.1，随包包含字体。 | 保留字体包完整 LICENSE；不对字体本身重新授权为 MIT。 |
| 系统、厂商品牌图标 | `public/images/logo/` 有 Windows、macOS、Ubuntu 等品牌标识，缺少逐项来源及适用条款。 | 用于系统识别并不自动取得图形或商标许可；需逐项补齐来源和使用政策，或替换成不涉及品牌的通用图标。 |
| 预览与历史图片 | `preview.png`、`docs/images/` 继承自上游，未找到独立素材授权记录。 | 需确认图片及画面内容的权利；新截图应使用自有测试数据并核查画面素材，不能用来源说明代替许可。 |
| AI 生成修改 | 本分支按维护者声明完全采用 AI Vibe Coding 进行二次开发。 | 不主张 AI 修改可以清除原代码或第三方素材的权利；仍需人工测试和授权审查。 |

## 已采取措施

### 2026-10-10 / 1.1.0 补充

- 区分 SAO 直接代码上游、Lumina/LuminaPlus 历史继承来源，以及 Lite-theme 与 Glassmorphism 的本次设计/交互参考，不将第三方设计和基础代码全部归为 Liko 原创。
- Lite-theme 参考版本为 1.2.7 (`ee210a1`)，其仓库 LICENSE 为 Apache-2.0，原文保存在 `public/licenses/lite-theme-Apache-2.0.txt`。借鉴范围包括首页卡片信息层次与配色、二级资源/网络监测页排列，按 Liko 的组件与接口适配；差异见 README 和 1.1.0 发布说明。
- Glassmorphism 仓库 LICENSE 为 MIT，原文保存在 `public/licenses/glassmorphism-MIT.txt`。借鉴 Sparkline 历史展示与时段查看思路，使用既有 Canvas 实现，未复制其源码或素材。
- 上述许可原文、来源与修改说明随本次 ZIP 保留；这不表示已完成整个项目的逐行授权或素材审查。原有 SAO/Lumina 及品牌素材核查缺口仍未被这些参考项目的许可证覆盖。

### 原有措施

- 在 README 明确个人二次开发、自用测试及 AI 开发方式，区分维护者与上游权利人。
- 保留上游来源说明及 Git 历史，没有将所有上游版权替换为 Liko。
- 移除会误导为整体 MIT 的徽章和失效 LICENSE 链接，不擅自补写缺失上游的版权年份或授权。
- 随源码保留已确认的 LuminaPlus 与 Circle Flags 许可证；构建时收集运行时依赖和字体许可证至 `dist/THIRD_PARTY_NOTICES.txt`，主题 ZIP 还附带本核查记录及来源声明。

这些措施仅改善声明和随附许可，不解决未取得授权的部分。更新构建流程不会追溯修改已有 Release 附件、Git 历史或他人已下载的副本。

## 发布前仍需完成

1. 联系 SAO 和初代 Lumina 维护者，确认继承代码的许可范围，并将授权证据随仓库保存。
2. 对品牌图标和历史图片逐项核查，不确定的素材取得授权或替换。
3. 核实所有本地旗帜与许可证覆盖的上游资源对应。
4. 授权证据补齐后重新审查并生成安装包；如需要整改已有公开内容，由维护者决定是否暂缓公开分发、撤回附件或调整仓库可见性。当前未自动撤回已有发布。
5. 商业发布或涉及争议时，请有资质律师结合实际用途及适用地区进一步审查。

## 参考来源

- [SAO 仓库](https://github.com/WAOR/Komari-Theme-SAO)
- [Lumina 仓库](https://github.com/stqfdyr/komari-theme-Lumina)
- [LuminaPlus LICENSE](https://github.com/shanyang242/Komari-Theme-LuminaPlus/blob/main/LICENSE)
- [Circle Flags LICENSE](https://github.com/HatScripts/circle-flags/blob/gh-pages/LICENSE.md)
- [MIT 许可条件](https://choosealicense.com/licenses/mit/)
- [无许可证项目说明](https://choosealicense.com/no-permission/)
- [SIL OFL 官方文本](https://openfontlicense.org/open-font-license-official-text/)
- [Microsoft 品牌及商标指南](https://www.microsoft.com/en-us/legal/intellectualproperty/trademarks)
