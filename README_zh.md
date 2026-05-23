# Chinese Punctuation Converter

[中文](README_zh.md) | [English](README.md)

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22chinese-punctuation-converter%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

自动将中文标点转化为对应的英文标点的 Obsidian 插件。

## 功能特性

- **实时转换** — 键入中文标点时自动转为英文标点，仅转换新输入的内容，不影响已有文本
- **侧边栏按钮** — 点击侧边栏**转换标点**一键转换当前文件中的所有标点
- **右键菜单** — 选中文本后右键 → **转换选中标点**，仅转换选中部分
- **命令面板** — 所有命令统一归入 **中文标点转换** 前缀下：
  - **启用/禁用自动转换** — 开关实时转换功能
  - **转换当前文档标点** — 批量转换整个文档
- **自定义规则** — 在设置中启用、禁用、添加或删除任意转换规则
- **i18n 支持** — 界面语言可在设置中切换为自动（跟随 Obsidian 语言）、中文或英文

## 支持的标点转换

| 从 | 到 |
| --- | --- |
| `，` | `,` |
| `。` | `.` |
| `：` | `:` |
| `；` | `;` |
| `！` | `!` |
| `？` | `?` |
| `【` `】` | `[` `]` |
| `（` `）` | `(` `)` |
| `《` `》` | `<` `>` |
| `"` `"` | `"` |
| `'` `'` | `'` |
| `…` | `...` |
| `、` | `,` |
| `「` `」` | `{` `}` |
| `·` | `.` |
| `～` | `~` |

## 使用方法

- 安装插件后，直接输入中文标点即可自动转换。
- 点击**侧边栏图标**一键转换当前文件中的所有标点。
- **右键**选中文本 → **转换选中标点**，仅转换选中的部分。
- 打开**命令面板**，所有命令均以 **中文标点转换** 为前缀：
  - **启用/禁用自动转换** — 开关实时转换功能
  - **转换当前文档标点** — 批量转换整个文档
- 插件设置中可启用、禁用、添加或删除单个标点转换规则。
- 插件设置中可切换**界面语言**为自动、中文或英文。

## 安装

### 社区插件市场

1. 打开 **设置** → **第三方插件**
2. 关闭 **安全模式**
3. 点击 **浏览** 搜索"Chinese Punctuation Converter"
4. 安装并启用

### BRAT

1. 安装并启用 [BRAT](https://obsidian.md/plugins?id=obsidian42-brat) 插件
2. 打开命令面板，执行 **BRAT: Plugins: Add a beta plugin for testing**
3. 输入仓库地址 `Enthusjast/obsidian-punctuation-converter`
4. 在**第三方插件**中启用该插件

## 开发

```bash
git clone git@github.com:Enthusjast/obsidian-punctuation-converter.git
cd obsidian-punctuation-converter
npm install
npm run dev      # watch 模式开发（带 sourcemap）
npm run build    # 生产构建（类型检查 + 打包 + 压缩）
npm run lint     # 运行 ESLint
```

### 项目结构

```
src/
├── main.ts       # 插件入口、编辑器监听、命令、右键菜单
├── settings.ts   # 设置页 UI、规则类型、默认值、校验
└── locale.ts     # i18n 翻译（中/英）与语言检测
```

- **编辑器监听** 使用 150ms 轮询，通过双向 diff 精确定位每次变更区域，用 `editor.replaceRange()` 仅替换变动部分。
- **设置校验** 采用防御式策略——加载时校验每个字段类型，无效值回退到默认值。
- **构建** — TypeScript 由 `tsc` 做类型检查，esbuild 打包为 CommonJS（ES2018 目标），所有 Obsidian/CodeMirror 模块均外部化。```
