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

- **Obsidian** — version depends on which plugin build you receive (see below)
- Core plugin **Daily notes** enabled

### Plugin version vs Obsidian version

This plugin uses a **dual release** on GitHub: two release lines share the same features but target different Obsidian API generations. The Community plugins browser picks the correct build for your app version via `versions.json`.

| Plugin version | Obsidian |
|----------------|----------|
| **Odd** patch releases (1.0.3, 1.0.5, 1.0.7, …) | **1.7.2** through **1.12.x** |
| **Even** patch releases (1.0.2, 1.0.4, 1.0.6, …) | **1.13.0+** |

Early tags **1.0.0** and **1.0.1** require Obsidian 1.7.2+. From **1.0.2** / **1.0.3** onward, the odd/even split above applies.

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

### 動作要件

- **Obsidian** — 利用するアプリのバージョンに応じて、取得されるプラグインの版が異なります（下記）
- コアプラグイン **Daily notes** を有効にすること

Obsidian のバージョンによって取得するプラグインバージョンが変わります。コミュニティプラグインの更新では `versions.json` に基づき、お使いの Obsidian に合ったビルドが自動的に選ばれます。**奇数バージョン**（1.0.3, 1.0.5, 1.0.7 …）は **Obsidian 1.7.2〜1.12.x** 向け、**偶数バージョン**（1.0.2, 1.0.4, 1.0.6 …）は **Obsidian 1.13.0 以降**向けです。初期の **1.0.0** / **1.0.1** は 1.7.2+ のみです。**1.0.2** / **1.0.3** 以降が上記の奇数・偶数の二系統リリースになります。
