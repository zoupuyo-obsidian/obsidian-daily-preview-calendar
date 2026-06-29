import type { UiLanguage } from './settings';

const messages = {
	ja: {
		viewTitle: 'Daily Preview',
		ribbonTooltip: 'Daily Preview Calendar',
		cmdOpen: 'Daily Preview Calendar を開く',
		cmdOpenSidebar: 'Daily Preview Calendar をサイドバーで開く',
		cmdOpenMain: 'Daily Preview Calendar をメインで開く',
		today: '今日',
		week: '週',
		month: '月',
		openNote: 'デイリーノートを開く',
		openNoteNewTab: '新しいタブで開く',
		dailyNotesDisabled:
			'コアプラグイン「Daily notes」が無効です。設定 → コアプラグイン で有効にしてください。',
		dailyNotesCoreNotice:
			'Daily Preview Calendar: コアプラグイン「Daily notes」を有効にしてください。',
		createNoteFailed: 'Daily Preview Calendar: デイリーノートの作成に失敗しました。',
		folderMissing:
			'Daily notes フォルダが見つかりません。コアプラグイン Daily notes の「新規ファイルの場所」を確認してください。',
		renderFailed: 'カレンダーの表示に失敗しました。',
		toolbarFailed: 'ツールバーの構築に失敗しました。',
		dailyNotesSourceDisabled: 'Daily notes コアプラグイン: 無効',
		dailyNotesSource: (folder: string, format: string) =>
			`Daily notes 設定 — フォルダ: ${folder} / 形式: ${format}`,
		settingsLanguage: 'UI 言語',
		settingsLanguageDesc: 'プラグイン UI の表示言語',
		settingsDefaultView: '初期表示',
		settingsDefaultViewDesc: 'カレンダーを開いたときの表示モード',
		settingsWeekStart: '週の開始日',
		settingsWeekStartDesc: '週・月グリッドの左端の曜日',
		settingsOpenLocation: '開く場所（既定）',
		settingsOpenLocationDesc:
			'リボン・コマンドから開くときのパネル。メイン／サイドバーは各コマンドでも指定可能。',
		openSidebar: '右サイドバー',
		openMain: 'メインエリア',
		settingsShowHeadings: '見出し行を表示',
		settingsShowHeadingsDesc: '「## 見出し」行そのものをプレビューに含める',
		settingsCellLineWrap: 'セル内で行を折り返し',
		settingsCellLineWrapDesc:
			'OFF（既定）: 行頭からセル幅で切り詰め。ON: 改行まで全文を折り返して表示。',
		settingsHoverPreview: 'ホバー／長押しプレビュー',
		settingsHoverPreviewDesc:
			'デスクトップ: マウスオーバーで全文ポップアップ。タッチ: 長押しまたはコンテキストメニュー「全文プレビュー」。',
		showFullPreview: '全文プレビュー',
		settingsSections: 'セクション表示',
		settingsSectionsDesc:
			'Markdown 見出し行（例: ## 今日のタスク）ごとに表示／非表示。未登録は表示。空なら全セクション表示。',
		settingsSectionHeading: '見出し（Markdown 記法込み）',
		settingsSectionPlaceholder: '## 今日のタスク',
		settingsSectionShow: '表示',
		settingsSectionAdd: 'セクションルールを追加',
		settingsApply: '設定を反映',
		settingsApplyDesc: 'カレンダー表示に設定を再適用します',
		settingsApplied: '設定を反映しました',
		settingsWordHighlights: 'キーワード強調',
		settingsWordHighlightsDesc:
			'ノート内 Markdown 装飾が優先されます。装飾されていない部分のみ着色／マーカー。',
		settingsWordText: 'キーワード',
		settingsWordStyle: 'スタイル',
		styleColor: '文字色',
		styleMarker: 'マーカー',
		settingsWordColor: '色',
		settingsWordAdd: 'キーワードを追加',
		settingsUiFont: 'UI フォント',
		settingsUiFontDesc: 'ツールバー・見出しなど',
		settingsBodyFont: '本文フォント',
		settingsBodyFontDesc: 'セル内プレビュー',
		fontFamily: 'フォント',
		fontFamilyDefault: '（Obsidian 既定）',
		fontSize: 'サイズ',
		fontSizeDefault: '既定',
		settingsDailyNotesHint:
			'ノートの場所・ファイル名形式は Obsidian 標準の「Daily notes」設定に従います。',
		weekdays: ['日', '月', '火', '水', '木', '金', '土'],
		weekdayNames: [
			'日曜日',
			'月曜日',
			'火曜日',
			'水曜日',
			'木曜日',
			'金曜日',
			'土曜日',
		],
	},
	en: {
		viewTitle: 'Daily Preview',
		ribbonTooltip: 'Daily Preview Calendar',
		cmdOpen: 'Open Daily Preview Calendar',
		cmdOpenSidebar: 'Open Daily Preview Calendar in sidebar',
		cmdOpenMain: 'Open Daily Preview Calendar in main area',
		today: 'Today',
		week: 'Week',
		month: 'Month',
		openNote: 'Open daily note',
		openNoteNewTab: 'Open in new tab',
		dailyNotesDisabled:
			'Core plugin "Daily notes" is disabled. Enable it under Settings → Core plugins.',
		dailyNotesCoreNotice:
			'Daily Preview Calendar: Enable the core "Daily notes" plugin.',
		createNoteFailed: 'Daily Preview Calendar: Failed to create daily note.',
		folderMissing:
			'Daily notes folder not found. Check Daily notes → New file location.',
		renderFailed: 'Failed to render calendar.',
		toolbarFailed: 'Failed to build toolbar.',
		dailyNotesSourceDisabled: 'Daily notes core plugin: disabled',
		dailyNotesSource: (folder: string, format: string) =>
			`Daily notes — folder: ${folder} / format: ${format}`,
		settingsLanguage: 'UI language',
		settingsLanguageDesc: 'Language for plugin UI',
		settingsDefaultView: 'Default view',
		settingsDefaultViewDesc: 'Week or month when opening the calendar',
		settingsWeekStart: 'Week starts on',
		settingsWeekStartDesc: 'First column of week/month grid',
		settingsOpenLocation: 'Default open location',
		settingsOpenLocationDesc:
			'Panel for ribbon/default command. Use separate commands for sidebar or main.',
		openSidebar: 'Right sidebar',
		openMain: 'Main area',
		settingsShowHeadings: 'Show heading lines',
		settingsShowHeadingsDesc: 'Include "## Heading" lines in cell preview',
		settingsCellLineWrap: 'Wrap lines in cells',
		settingsCellLineWrapDesc:
			'Off (default): truncate each line to cell width. On: wrap full line text until newline.',
		settingsHoverPreview: 'Hover / long-press preview',
		settingsHoverPreviewDesc:
			'Desktop: mouse-over popup with full note excerpt. Touch: long-press or context menu "Full preview".',
		showFullPreview: 'Full preview',
		settingsSections: 'Section visibility',
		settingsSectionsDesc:
			'Per Markdown heading line (e.g. ## Tasks). Unlisted headings are shown. Empty list = show all.',
		settingsSectionHeading: 'Heading (with Markdown syntax)',
		settingsSectionPlaceholder: '## Tasks',
		settingsSectionShow: 'Show',
		settingsSectionAdd: 'Add section rule',
		settingsApply: 'Apply settings',
		settingsApplyDesc: 'Re-apply settings to the calendar view',
		settingsApplied: 'Settings applied',
		settingsWordHighlights: 'Keyword highlights',
		settingsWordHighlightsDesc:
			'Markdown in notes takes priority. Only plain segments are highlighted.',
		settingsWordText: 'Keyword',
		settingsWordStyle: 'Style',
		styleColor: 'Text color',
		styleMarker: 'Marker',
		settingsWordColor: 'Color',
		settingsWordAdd: 'Add keyword',
		settingsUiFont: 'UI font',
		settingsUiFontDesc: 'Toolbar, headers, etc.',
		settingsBodyFont: 'Body font',
		settingsBodyFontDesc: 'Cell preview text',
		fontFamily: 'Font family',
		fontFamilyDefault: '(Obsidian default)',
		fontSize: 'Size',
		fontSizeDefault: 'Default',
		settingsDailyNotesHint:
			'Note path and date format follow the core Daily notes plugin settings.',
		weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
		weekdayNames: [
			'Sunday',
			'Monday',
			'Tuesday',
			'Wednesday',
			'Thursday',
			'Friday',
			'Saturday',
		],
	},
} as const;

export type I18nKey = keyof (typeof messages)['ja'];

export function t(lang: UiLanguage, key: I18nKey): string {
	return messages[lang][key] as string;
}

export function tf(
	lang: UiLanguage,
	key: 'dailyNotesSource',
	folder: string,
	format: string,
): string {
	return messages[lang][key](folder, format);
}

export function weekdayLabelNames(lang: UiLanguage): string[] {
	return [...messages[lang].weekdayNames];
}

export function weekdayLabels(
	lang: UiLanguage,
	weekStartsOn: number,
): string[] {
	const labels = [...messages[lang].weekdays];
	return [...labels.slice(weekStartsOn), ...labels.slice(0, weekStartsOn)];
}
