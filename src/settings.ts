/* eslint-disable @typescript-eslint/no-deprecated -- display() is required for Obsidian 1.7.2–1.12.x */
import { App, Notice, PluginSettingTab, Setting } from 'obsidian';

import type DailyPreviewCalendarPlugin from './main';

import { describeDailyNotesSource } from './views/DailyPreviewCalendarView';

import { FONT_SIZE_OPTIONS, getFontFamilyOptions } from './fontOptions';

import { t, weekdayLabelNames, type I18nKey } from './i18n';

import { randomId } from './util';



export type CalendarViewMode = 'week' | 'month';

export type UiLanguage = 'ja' | 'en';

export type OpenLocation = 'sidebar' | 'main';

export type HighlightStyle = 'color' | 'marker';



export interface FontSettings {

	family: string;

	sizePx: number;

}



export interface WordHighlightRule {

	id: string;

	word: string;

	style: HighlightStyle;

	color: string;

	enabled: boolean;

}



export interface SectionRule {

	id: string;

	/** Full Markdown heading line, e.g. "## 今日のタスク" or "### メモ" */

	headingPattern: string;

	show: boolean;

}



export interface DailyPreviewCalendarSettings {

	defaultViewMode: CalendarViewMode;

	weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6;

	uiLanguage: UiLanguage;

	defaultOpenLocation: OpenLocation;

	showHeadingLines: boolean;

	sectionRules: SectionRule[];

	wordHighlights: WordHighlightRule[];

	uiFont: FontSettings;

	bodyFont: FontSettings;

	/** Truncate each line to cell width (default). When true, wrap full line text. */
	cellLineWrap: boolean;

	/** Hover popover (desktop) / long-press & context menu (touch). */
	hoverPreviewEnabled: boolean;
}



export const DEFAULT_SETTINGS: DailyPreviewCalendarSettings = {

	defaultViewMode: 'week',

	weekStartsOn: 1,

	uiLanguage: 'ja',

	defaultOpenLocation: 'sidebar',

	showHeadingLines: false,

	sectionRules: [],

	wordHighlights: [],

	uiFont: { family: '', sizePx: 0 },

	bodyFont: { family: '', sizePx: 0 },

	cellLineWrap: false,

	hoverPreviewEnabled: true,

};



type LegacySectionRule = SectionRule & { heading?: string };



export function migrateSettings(

	raw: Partial<DailyPreviewCalendarSettings> & {

		sectionRules?: LegacySectionRule[];

	},

): DailyPreviewCalendarSettings {
	const merged = { ...DEFAULT_SETTINGS, ...raw };



	if (!Array.isArray(merged.sectionRules)) {

		merged.sectionRules = [];

	}



	for (const rule of merged.sectionRules as LegacySectionRule[]) {

		if (!rule.id) {

			rule.id = randomId();

		}

		if (!rule.headingPattern && rule.heading) {

			rule.headingPattern = rule.heading.match(/^#{1,6}\s/)

				? rule.heading.trim()

				: `## ${rule.heading.trim()}`;

			delete rule.heading;

		}

		if (!rule.headingPattern) {

			rule.headingPattern = '';

		}

	}



	if (!merged.wordHighlights) {

		merged.wordHighlights = [];

	}

	if (!merged.uiFont) {

		merged.uiFont = { ...DEFAULT_SETTINGS.uiFont };

	}

	if (!merged.bodyFont) {

		merged.bodyFont = { ...DEFAULT_SETTINGS.bodyFont };

	}

	if (typeof merged.cellLineWrap !== 'boolean') {

		merged.cellLineWrap = DEFAULT_SETTINGS.cellLineWrap;

	}

	if (typeof merged.hoverPreviewEnabled !== 'boolean') {

		merged.hoverPreviewEnabled = DEFAULT_SETTINGS.hoverPreviewEnabled;

	}

	for (const rule of merged.wordHighlights) {

		if (!rule.id) {

			rule.id = randomId();

		}

	}



	return merged;

}



export class DailyPreviewCalendarSettingTab extends PluginSettingTab {

	plugin: DailyPreviewCalendarPlugin;



	constructor(app: App, plugin: DailyPreviewCalendarPlugin) {

		super(app, plugin);

		this.plugin = plugin;

	}



	private lang() {

		return this.plugin.settings.uiLanguage;

	}



	private L(key: I18nKey): string {

		return t(this.lang(), key);

	}



	display(): void {

		const { containerEl } = this;

		const s = this.plugin.settings;



		containerEl.empty();

		containerEl.addClass('daily-preview-calendar-settings');



		this.renderApplyButton(containerEl);



		containerEl.createEl('p', {

			cls: 'daily-preview-calendar-settings__source',

			text: describeDailyNotesSource(this.app, s.uiLanguage),

		});



		new Setting(containerEl)

			.setName(this.L('settingsLanguage'))

			.setDesc(this.L('settingsLanguageDesc'))

			.addDropdown((dropdown) =>

				dropdown

					.addOption('ja', '日本語')

					.addOption('en', 'English')

					.setValue(s.uiLanguage)

					.onChange(async (value) => {

						s.uiLanguage = value as UiLanguage;

						await this.plugin.saveSettings();

						this.display();

						await this.plugin.applySettingsAndRefresh();

					}),

			);



		new Setting(containerEl)

			.setName(this.L('settingsDefaultView'))

			.setDesc(this.L('settingsDefaultViewDesc'))

			.addDropdown((dropdown) =>

				dropdown

					.addOption('week', this.L('week'))

					.addOption('month', this.L('month'))

					.setValue(s.defaultViewMode)

					.onChange(async (value) => {

						s.defaultViewMode = value as CalendarViewMode;

						await this.plugin.saveSettings();

					}),

			);



		new Setting(containerEl)

			.setName(this.L('settingsWeekStart'))

			.setDesc(this.L('settingsWeekStartDesc'))

			.addDropdown((dropdown) => {

				const names = weekdayLabelNames(this.lang());

				for (let i = 0; i < names.length; i++) {
					dropdown.addOption(String(i), names[i]!);
				}

				dropdown

					.setValue(String(s.weekStartsOn))

					.onChange(async (value) => {

						s.weekStartsOn = Number(value) as DailyPreviewCalendarSettings['weekStartsOn'];

						await this.plugin.saveSettings();

						await this.plugin.applySettingsAndRefresh();

					});

			});



		new Setting(containerEl)

			.setName(this.L('settingsOpenLocation'))

			.setDesc(this.L('settingsOpenLocationDesc'))

			.addDropdown((dropdown) =>

				dropdown

					.addOption('sidebar', this.L('openSidebar'))

					.addOption('main', this.L('openMain'))

					.setValue(s.defaultOpenLocation)

					.onChange(async (value) => {

						s.defaultOpenLocation = value as OpenLocation;

						await this.plugin.saveSettings();

					}),

			);



		new Setting(containerEl)

			.setName(this.L('settingsShowHeadings'))

			.setDesc(this.L('settingsShowHeadingsDesc'))

			.addToggle((toggle) =>

				toggle.setValue(s.showHeadingLines).onChange(async (value) => {

					s.showHeadingLines = value;

					await this.plugin.saveSettings();

				}),

			);



		new Setting(containerEl)

			.setName(this.L('settingsCellLineWrap'))

			.setDesc(this.L('settingsCellLineWrapDesc'))

			.addToggle((toggle) =>

				toggle.setValue(s.cellLineWrap).onChange(async (value) => {

					s.cellLineWrap = value;

					await this.plugin.saveSettings();

				}),

			);



		new Setting(containerEl)

			.setName(this.L('settingsHoverPreview'))

			.setDesc(this.L('settingsHoverPreviewDesc'))

			.addToggle((toggle) =>

				toggle.setValue(s.hoverPreviewEnabled).onChange(async (value) => {

					s.hoverPreviewEnabled = value;

					await this.plugin.saveSettings();

				}),

			);



		this.renderSectionRules(containerEl);

		this.renderWordHighlights(containerEl);

		this.renderFontSettings(containerEl, 'uiFont', 'settingsUiFont', 'settingsUiFontDesc');

		this.renderFontSettings(containerEl, 'bodyFont', 'settingsBodyFont', 'settingsBodyFontDesc');



		containerEl.createEl('p', {

			cls: 'daily-preview-calendar-settings__hint',

			text: this.L('settingsDailyNotesHint'),

		});



		this.renderApplyButton(containerEl);

	}



	private renderApplyButton(containerEl: HTMLElement): void {

		new Setting(containerEl)

			.setName(this.L('settingsApply'))

			.setDesc(this.L('settingsApplyDesc'))

			.addButton((btn) =>

				btn.setButtonText(this.L('settingsApply')).setCta().onClick(async () => {

					await this.plugin.applySettingsAndRefresh();

					new Notice(this.L('settingsApplied'));

				}),

			);

	}



	private renderSectionRules(containerEl: HTMLElement): void {

		const s = this.plugin.settings;

		new Setting(containerEl)

			.setName(this.L('settingsSections'))

			.setDesc(this.L('settingsSectionsDesc'))

			.setHeading();



		const list = containerEl.createDiv({ cls: 'daily-preview-calendar-settings__list' });

		const redraw = () => this.display();



		for (const rule of s.sectionRules) {

			new Setting(list)

				.setName(this.L('settingsSectionHeading'))

				.addText((text) =>

					text

						.setPlaceholder(this.L('settingsSectionPlaceholder'))

						.setValue(rule.headingPattern)

						.onChange(async (value) => {

							rule.headingPattern = value;

							await this.plugin.saveSettings();

						}),

				)

				.addToggle((toggle) =>

					toggle

						.setTooltip(this.L('settingsSectionShow'))

						.setValue(rule.show)

						.onChange(async (value) => {

							rule.show = value;

							await this.plugin.saveSettings();

						}),

				)

				.addExtraButton((btn) =>

					btn

						.setIcon('trash')

						.setTooltip('Delete')

						.onClick(async () => {

							s.sectionRules = s.sectionRules.filter((r) => r.id !== rule.id);

							await this.plugin.saveSettings();

							redraw();

						}),

				);

		}



		new Setting(containerEl).addButton((btn) =>

			btn

				.setButtonText(this.L('settingsSectionAdd'))

				.setCta()

				.onClick(async () => {

					s.sectionRules.push({

						id: randomId(),

						headingPattern: '',

						show: true,

					});

					await this.plugin.saveSettings();

					redraw();

				}),

		);

	}



	private renderWordHighlights(containerEl: HTMLElement): void {

		const s = this.plugin.settings;

		new Setting(containerEl)

			.setName(this.L('settingsWordHighlights'))

			.setDesc(this.L('settingsWordHighlightsDesc'))

			.setHeading();



		const list = containerEl.createDiv({ cls: 'daily-preview-calendar-settings__list' });

		const redraw = () => this.display();



		for (const rule of s.wordHighlights) {

			new Setting(list)

				.addText((text) =>

					text

						.setPlaceholder(this.L('settingsWordText'))

						.setValue(rule.word)

						.onChange(async (value) => {

							rule.word = value;

							await this.plugin.saveSettings();

						}),

				)

				.addDropdown((dropdown) =>

					dropdown

						.addOption('color', this.L('styleColor'))

						.addOption('marker', this.L('styleMarker'))

						.setValue(rule.style)

						.onChange(async (value) => {

							rule.style = value as HighlightStyle;

							await this.plugin.saveSettings();

						}),

				)

				.addColorPicker((picker) =>

					picker.setValue(rule.color).onChange(async (value) => {

						rule.color = value;

						await this.plugin.saveSettings();

					}),

				)

				.addToggle((toggle) =>

					toggle.setValue(rule.enabled).onChange(async (value) => {

						rule.enabled = value;

						await this.plugin.saveSettings();

					}),

				)

				.addExtraButton((btn) =>

					btn

						.setIcon('trash')

						.setTooltip('Delete')

						.onClick(async () => {

							s.wordHighlights = s.wordHighlights.filter((r) => r.id !== rule.id);

							await this.plugin.saveSettings();

							redraw();

						}),

				);

		}



		new Setting(containerEl).addButton((btn) =>

			btn

				.setButtonText(this.L('settingsWordAdd'))

				.setCta()

				.onClick(async () => {

					s.wordHighlights.push({

						id: randomId(),

						word: '',

						style: 'marker',

						color: '#ffd700',

						enabled: true,

					});

					await this.plugin.saveSettings();

					redraw();

				}),

		);

	}



	private renderFontSettings(

		containerEl: HTMLElement,

		key: 'uiFont' | 'bodyFont',

		titleKey: I18nKey,

		descKey: I18nKey,

	): void {

		const s = this.plugin.settings;

		const font = s[key];

		const lang = this.lang();



		new Setting(containerEl)

			.setName(this.L(titleKey))

			.setDesc(this.L(descKey))

			.addDropdown((dropdown) => {
				for (const opt of getFontFamilyOptions(lang)) {
					dropdown.addOption(opt.value, opt.label);
				}
				if (
					font.family &&
					!getFontFamilyOptions(lang).some((o) => o.value === font.family)
				) {
					dropdown.addOption(font.family, font.family);
				}
				dropdown.setValue(font.family).onChange(async (value) => {
					font.family = value;
					await this.plugin.saveSettings();
				});
			})

			.addDropdown((dropdown) => {

				for (const opt of FONT_SIZE_OPTIONS) {

					dropdown.addOption(String(opt.value), opt.label);

				}

				dropdown.setValue(String(font.sizePx)).onChange(async (value) => {

					font.sizePx = Number(value);

					await this.plugin.saveSettings();

				});

			});

	}

}


