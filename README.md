# Chinese Punctuation Converter

[中文](README_zh.md) | [English](README.md)

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22chinese-punctuation-converter%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)

An [Obsidian](https://obsidian.md) plugin that automatically converts Chinese punctuation to English punctuation as you type.

## Features

- **Real-time conversion** — converts Chinese punctuation marks to English equivalents as you type, only transforming newly entered text
- **Ribbon button** — one-click conversion of the entire active file from the sidebar
- **Context menu** — select text, right-click → **Convert selected punctuation** to convert only the selection
- **Command palette** — all commands grouped under the **Chinese Punctuation Converter** prefix:
  - **Enable/disable auto-conversion** — toggle real-time conversion on/off
  - **Convert current file punctuation** — bulk convert the entire document
- **Customizable rules** — enable, disable, add, or delete individual conversion rules in the plugin settings
- **i18n support** — UI language can be set to Auto (follow Obsidian's language), English, or Chinese in plugin settings

## Supported Punctuation Conversions

| From | To |
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

## Usage

- After installing the plugin, type Chinese punctuation to have it automatically converted.
- Click the **ribbon icon** (sidebar) to convert the entire active file.
- **Right-click** selected text → **Convert selected punctuation** to convert only the selection.
- Open the **command palette**, all commands are prefixed with **Chinese Punctuation Converter**:
  - **Enable/disable auto-conversion** — toggle real-time conversion
  - **Convert current file punctuation** — bulk convert the entire document
- Individual conversion rules can be enabled, disabled, added, or removed in the plugin settings.
- Set the **interface language** in plugin settings to Auto, English, or Chinese.

## Installation

### Community Plugins

1. Open **Settings** → **Community Plugins**
2. Disable **Safe mode**
3. Click **Browse** and search for "Chinese Punctuation Converter"
4. Install and enable the plugin

### BRAT

1. Install and enable the [BRAT](https://obsidian.md/plugins?id=obsidian42-brat) plugin
2. Open the command palette and run **BRAT: Plugins: Add a beta plugin for testing**
3. Enter `Enthusjast/obsidian-punctuation-converter` as the repository
4. Enable the plugin in **Community Plugins**

## Development

```bash
git clone git@github.com:Enthusjast/obsidian-punctuation-converter.git
cd obsidian-punctuation-converter
npm install
npm run dev      # watch mode with sourcemaps
npm run build    # production build (type-check + bundle + minify)
npm run lint     # run ESLint
```

### Project structure

```
src/
├── main.ts       # Plugin entry, editor monitoring, commands, context menu
├── settings.ts   # Settings tab UI, rule types, defaults, validation
└── locale.ts     # i18n translations (zh/en) and language detection
```

- **Editor monitoring** uses polling (`setInterval` at 150ms). A bidirectional diff locates only the changed region on each tick; `editor.replaceRange()` replaces just that portion.
- **Settings validation** is defensive — every field type is checked on load and invalid values fall back to defaults.
- **Build** — TypeScript is type-checked by `tsc`, bundled by esbuild to CommonJS (ES2018). All Obsidian/CodeMirror modules are externalized.```
