import type { UiLanguage } from './settings';

export interface FontOption {
	value: string;
	label: string;
}

export function getFontFamilyOptions(lang: UiLanguage): FontOption[] {
	const def = lang === 'ja' ? '（Obsidian 既定）' : '(Obsidian default)';
	const iface = lang === 'ja' ? 'UI フォント（Obsidian）' : 'Interface (Obsidian UI)';
	const text = lang === 'ja' ? 'テキストフォント（Obsidian）' : 'Text (Obsidian editor)';
	const mono = lang === 'ja' ? '等幅' : 'Monospace';

	return [
		{ value: '', label: def },
		{ value: 'var(--font-interface)', label: iface },
		{ value: 'var(--font-text)', label: text },
		{ value: 'var(--font-monospace)', label: mono },
		{ value: 'system-ui, sans-serif', label: 'System UI' },
		{ value: '"Segoe UI", sans-serif', label: 'Segoe UI' },
		{ value: '"Yu Gothic UI", "Meiryo", sans-serif', label: 'Yu Gothic / Meiryo' },
		{ value: '"Hiragino Sans", "Hiragino Kaku Gothic ProN", sans-serif', label: 'Hiragino' },
		{ value: '"Noto Sans JP", sans-serif', label: 'Noto Sans JP' },
		{ value: 'Georgia, serif', label: 'Georgia' },
	];
}

export const FONT_SIZE_OPTIONS: { value: number; label: string }[] = [
	{ value: 0, label: '—' },
	{ value: 9, label: '9' },
	{ value: 10, label: '10' },
	{ value: 11, label: '11' },
	{ value: 12, label: '12' },
	{ value: 13, label: '13' },
	{ value: 14, label: '14' },
	{ value: 15, label: '15' },
	{ value: 16, label: '16' },
	{ value: 18, label: '18' },
	{ value: 20, label: '20' },
	{ value: 24, label: '24' },
];
