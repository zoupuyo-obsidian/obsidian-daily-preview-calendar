import {
	App,
	Notice,
	PluginSettingTab,
	Setting,
	type SettingDefinitionItem,
	type SettingDefinitionList,
	type SettingDefinitionRender,
} from 'obsidian';

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
	/** Full Markdown heading line, e.g. "## 今日のタスク" */
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
	cellLineWrap: boolean;
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

	private lang(): UiLanguage {
		return this.plugin.settings.uiLanguage;
	}

	private L(key: I18nKey): string {
		return t(this.lang(), key);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const defs: SettingDefinitionItem[] = [
			this.dailyNotesSourceRow(),
			this.languageRow(),
			{
				name: this.L('settingsDefaultView'),
				desc: this.L('settingsDefaultViewDesc'),
				control: {
					type: 'dropdown',
					key: 'defaultViewMode',
					defaultValue: 'week',
					options: {
						week: this.L('week'),
						month: this.L('month'),
					},
				},
			},
			this.weekStartRow(),
			{
				name: this.L('settingsOpenLocation'),
				desc: this.L('settingsOpenLocationDesc'),
				control: {
					type: 'dropdown',
					key: 'defaultOpenLocation',
					defaultValue: 'sidebar',
					options: {
						sidebar: this.L('openSidebar'),
						main: this.L('openMain'),
					},
				},
			},
			{
				name: this.L('settingsShowHeadings'),
				desc: this.L('settingsShowHeadingsDesc'),
				control: { type: 'toggle', key: 'showHeadingLines' },
			},
			{
				name: this.L('settingsCellLineWrap'),
				desc: this.L('settingsCellLineWrapDesc'),
				control: { type: 'toggle', key: 'cellLineWrap' },
			},
			{
				name: this.L('settingsHoverPreview'),
				desc: this.L('settingsHoverPreviewDesc'),
				control: { type: 'toggle', key: 'hoverPreviewEnabled' },
			},
			this.sectionRulesList(),
			this.wordHighlightsList(),
			this.fontRow('uiFont', 'settingsUiFont', 'settingsUiFontDesc'),
			this.fontRow('bodyFont', 'settingsBodyFont', 'settingsBodyFontDesc'),
			{
				name: this.L('settingsDailyNotesHint'),
				searchable: false,
				render: (setting) => {
					setting.setClass('daily-preview-calendar-settings__hint');
					setting.infoEl.setText(this.L('settingsDailyNotesHint'));
					setting.controlEl.empty();
				},
			},
			this.applyButtonRow(),
		];

		return defs;
	}

	setControlValue(key: string, value: unknown): void | Promise<void> {
		if (key === 'cellLineWrap' || key === 'hoverPreviewEnabled' || key === 'showHeadingLines') {
			const result = super.setControlValue(key, value);
			void Promise.resolve(result).then(() => this.plugin.applySettingsAndRefresh());
			return result;
		}
		return super.setControlValue(key, value);
	}

	private applyButtonRow(): SettingDefinitionRender {
		return {
			name: this.L('settingsApply'),
			desc: this.L('settingsApplyDesc'),
			render: (setting) => {
				setting
					.setName(this.L('settingsApply'))
					.setDesc(this.L('settingsApplyDesc'))
					.addButton((btn) =>
						btn
							.setButtonText(this.L('settingsApply'))
							.setCta()
							.onClick(async () => {
								await this.plugin.applySettingsAndRefresh();
								new Notice(this.L('settingsApplied'));
							}),
					);
			},
		};
	}

	private dailyNotesSourceRow(): SettingDefinitionRender {
		return {
			name: '',
			searchable: false,
			render: (setting) => {
				setting.setClass('daily-preview-calendar-settings__source');
				setting.infoEl.setText(describeDailyNotesSource(this.app, this.lang()));
				setting.controlEl.empty();
			},
		};
	}

	private languageRow(): SettingDefinitionRender {
		return {
			name: this.L('settingsLanguage'),
			desc: this.L('settingsLanguageDesc'),
			render: (setting) => {
				setting
					.setName(this.L('settingsLanguage'))
					.setDesc(this.L('settingsLanguageDesc'))
					.addDropdown((dropdown) =>
						dropdown
							.addOption('ja', '日本語')
							.addOption('en', 'English')
							.setValue(this.plugin.settings.uiLanguage)
							.onChange(async (value) => {
								this.plugin.settings.uiLanguage = value as UiLanguage;
								await this.plugin.saveSettings();
								this.update();
								await this.plugin.applySettingsAndRefresh();
							}),
					);
			},
		};
	}

	private weekStartRow(): SettingDefinitionRender {
		return {
			name: this.L('settingsWeekStart'),
			desc: this.L('settingsWeekStartDesc'),
			render: (setting) => {
				const names = weekdayLabelNames(this.lang());
				setting
					.setName(this.L('settingsWeekStart'))
					.setDesc(this.L('settingsWeekStartDesc'))
					.addDropdown((dropdown) => {
						for (let i = 0; i < names.length; i++) {
							dropdown.addOption(String(i), names[i]!);
						}
						dropdown
							.setValue(String(this.plugin.settings.weekStartsOn))
							.onChange(async (value) => {
								this.plugin.settings.weekStartsOn = Number(
									value,
								) as DailyPreviewCalendarSettings['weekStartsOn'];
								await this.plugin.saveSettings();
								await this.plugin.applySettingsAndRefresh();
							});
					});
			},
		};
	}

	private sectionRulesList(): SettingDefinitionList {
		const s = this.plugin.settings;
		return {
			type: 'list',
			heading: this.L('settingsSections'),
			cls: 'daily-preview-calendar-settings__list',
			emptyState: this.L('settingsSectionsDesc'),
			onDelete: (index) => {
				void (async () => {
					s.sectionRules.splice(index, 1);
					await this.plugin.saveSettings();
					this.update();
				})();
			},
			addItem: {
				name: this.L('settingsSectionAdd'),
				action: () => {
					void (async () => {
						s.sectionRules.push({
							id: randomId(),
							headingPattern: '',
							show: true,
						});
						await this.plugin.saveSettings();
						this.update();
					})();
				},
			},
			items: s.sectionRules.map((rule) => ({
				name: rule.headingPattern || this.L('settingsSectionHeading'),
				render: (setting: Setting) => {
					setting
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
						);
				},
			})),
		};
	}

	private wordHighlightsList(): SettingDefinitionList {
		const s = this.plugin.settings;
		return {
			type: 'list',
			heading: this.L('settingsWordHighlights'),
			cls: 'daily-preview-calendar-settings__list',
			emptyState: this.L('settingsWordHighlightsDesc'),
			onDelete: (index) => {
				void (async () => {
					s.wordHighlights.splice(index, 1);
					await this.plugin.saveSettings();
					this.update();
				})();
			},
			addItem: {
				name: this.L('settingsWordAdd'),
				action: () => {
					void (async () => {
						s.wordHighlights.push({
							id: randomId(),
							word: '',
							style: 'marker',
							color: '#ffd700',
							enabled: true,
						});
						await this.plugin.saveSettings();
						this.update();
					})();
				},
			},
			items: s.wordHighlights.map((rule) => ({
				name: rule.word || this.L('settingsWordText'),
				render: (setting: Setting) => {
					setting
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
						);
				},
			})),
		};
	}

	private fontRow(
		key: 'uiFont' | 'bodyFont',
		titleKey: I18nKey,
		descKey: I18nKey,
	): SettingDefinitionRender {
		return {
			name: this.L(titleKey),
			desc: this.L(descKey),
			render: (setting) => {
				const font = this.plugin.settings[key];
				const lang = this.lang();
				setting.setName(this.L(titleKey)).setDesc(this.L(descKey)).addDropdown((dropdown) => {
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
				}).addDropdown((dropdown) => {
					for (const opt of FONT_SIZE_OPTIONS) {
						dropdown.addOption(String(opt.value), opt.label);
					}
					dropdown.setValue(String(font.sizePx)).onChange(async (value) => {
						font.sizePx = Number(value);
						await this.plugin.saveSettings();
					});
				});
			},
		};
	}
}
