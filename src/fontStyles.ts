import type { DailyPreviewCalendarSettings, FontSettings } from './settings';

export function applyFontVariables(
	root: HTMLElement,
	settings: DailyPreviewCalendarSettings,
): void {
	applyOneFont(root, '--dpc-ui-font-family', '--dpc-ui-font-size', settings.uiFont);
	applyOneFont(root, '--dpc-body-font-family', '--dpc-body-font-size', settings.bodyFont);

	// ツールバー・プレビューへ直接適用（CSS 変数だけでは Obsidian テーマに負ける場合の保険）
	const toolbar = root.querySelector('.daily-preview-calendar__toolbar');
	if (toolbar instanceof HTMLElement) {
		applyDirectFont(toolbar, settings.uiFont);
	}
	for (const preview of Array.from(root.querySelectorAll('.daily-preview-calendar__preview'))) {
		applyDirectFont(preview as HTMLElement, settings.bodyFont);
	}
	for (const header of Array.from(root.querySelectorAll('.daily-preview-calendar__cell-header'))) {
		applyDirectFont(header as HTMLElement, settings.uiFont);
	}
}

function applyOneFont(
	root: HTMLElement,
	familyVar: string,
	sizeVar: string,
	font: FontSettings,
): void {
	if (font.family) {
		root.style.setProperty(familyVar, font.family);
	} else {
		root.style.removeProperty(familyVar);
	}
	if (font.sizePx > 0) {
		root.style.setProperty(sizeVar, `${font.sizePx}px`);
	} else {
		root.style.removeProperty(sizeVar);
	}
}

function applyDirectFont(el: HTMLElement, font: FontSettings): void {
	if (font.family) {
		el.style.fontFamily = font.family;
	} else {
		el.style.removeProperty('font-family');
	}
	if (font.sizePx > 0) {
		el.style.fontSize = `${font.sizePx}px`;
	} else {
		el.style.removeProperty('font-size');
	}
}
