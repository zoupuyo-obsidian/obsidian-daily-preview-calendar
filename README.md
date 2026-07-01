# Daily Preview Calendar

Obsidian community plugin. Browse **Daily Notes** in **week / month** calendar views with Markdown previews inside each day cell.

Daily note folder and date format follow the core **Daily notes** plugin settings.

## Features

- **Week / month** views with a responsive grid
- **Cell preview**: multiple lines from each note, fitted to cell height
- **Inline Markdown**: bold, italic, code, links, wikilinks, highlights, strikethrough
- **Block Markdown**: lists (including tasks), blockquotes, code fences, horizontal rules, `![[embeds]]`
- **Section filters**: show/hide by heading line (e.g. `## Tasks`). Empty rules = show all sections
- **Keyword highlights**: text color or marker (plain text only; Markdown styling takes priority)
- **UI language**: Japanese / English
- **Separate UI and body fonts** (family + size)
- **Line wrap** toggle: truncate to cell width (default) or wrap full line text
- **Hover / long-press preview**: full note excerpt in a popup (desktop: hover; touch: long-press with open-note actions in the popup)
- **Open location**: sidebar or main area (commands available for each)
- **Click behavior**: sidebar view → open in main; main view → open in new tab
- **Mobile** supported (`isDesktopOnly: false`)

## Requirements

- Obsidian 1.13.0+
- Core plugin **Daily notes** enabled

## Installation (manual)

1. Copy `main.js`, `manifest.json`, and `styles.css` into  
   `VaultFolder/.obsidian/plugins/daily-preview-calendar/`
2. Enable **Daily Preview Calendar** under Settings → Community plugins

## Development

```powershell
git clone https://github.com/zoupuyo-obsidian/obsidian-daily-preview-calendar.git
cd obsidian-daily-preview-calendar
npm install
npm run dev
```

Link into a vault (Windows junction example):

```powershell
cmd /c mklink /J "PATH\TO\VAULT\.obsidian\plugins\daily-preview-calendar" "PATH\TO\obsidian-daily-preview-calendar"
```

Build for release:

```powershell
npm run build
```

Upload `main.js`, `manifest.json`, and `styles.css` to a GitHub release whose tag matches `manifest.json` `version`.

## Commands

| Command | Action |
|---|---|
| Open Daily Preview Calendar | Uses default open location from settings |
| Open … in sidebar | Right sidebar |
| Open … in main area | Main tab |

## Settings highlights

- **Apply settings**: re-render the calendar after font or layout changes
- **Section rules**: Markdown heading line including `#` markers (e.g. `## Tasks`)
- **Hover / long-press preview**: disable if you prefer cells only

## License

0-BSD (see [LICENSE](LICENSE)).

## Author

[zoupuyo-obsidian](https://github.com/zoupuyo-obsidian)

---

## 日本語

Daily Notes を週・月カレンダーで俯瞰し、セル内に Markdown プレビューを表示する Obsidian プラグインです。  
Daily notes の保存場所・日付形式はコアプラグインの設定に従います。

主な機能: 週/月表示、インライン/ブロック Markdown、セクション表示フィルタ、キーワード強調、折り返し表示、ホバー/長押し全文プレビュー、UI 言語（日/英）、フォント設定、モバイル対応。
