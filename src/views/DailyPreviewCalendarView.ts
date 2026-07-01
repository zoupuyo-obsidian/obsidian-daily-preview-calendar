import { App, ItemView, Menu, moment, Platform, TFile, WorkspaceLeaf } from 'obsidian';
import type DailyPreviewCalendarPlugin from '../main';
import {
	getAllDailyNotesMap,
	getNoteForDate,
	isDailyNotesAvailable,
	openOrCreateDailyNote,
	readDailyNotesConfig,
	readPreviewItems,
} from '../dailyNotes';
import { applyFontVariables } from '../fontStyles';
import { HoverPreviewController } from '../hoverPreview';
import { t, tf, weekdayLabels } from '../i18n';
import { fitItemsToHeight, type PreviewItem } from '../previewContent';
import {
	fitItemsToHeightWrapped,
	renderPreviewItems,
} from '../previewRender';
import { safeSetText } from '../domUtils';
import type { CalendarViewMode, UiLanguage } from '../settings';
import { isMainAreaLeaf } from '../workspaceUtil';

export const VIEW_TYPE_DAILY_PREVIEW = 'daily-preview-calendar';

interface DayCellParts {
	root: HTMLElement;
	preview: HTMLElement;
	date: moment.Moment;
	filePath: string | null;
	allItems: PreviewItem[];
}

export class DailyPreviewCalendarView extends ItemView {
	navigation = false;

	plugin: DailyPreviewCalendarPlugin;
	anchorDate: moment.Moment;
	viewMode: CalendarViewMode;
	private gridEl: HTMLElement | null = null;
	private periodLabelEl: HTMLElement | null = null;
	private cells: DayCellParts[] = [];
	private resizeObserver: ResizeObserver | null = null;
	private previewCache = new Map<string, PreviewItem[]>();
	private dailyNotesMap: Record<string, TFile> = {};
	private renderGeneration = 0;
	private hoverPreview = new HoverPreviewController();

	constructor(leaf: WorkspaceLeaf, plugin: DailyPreviewCalendarPlugin) {
		super(leaf);
		this.plugin = plugin;
		this.anchorDate = moment().startOf('day');
		this.viewMode = plugin.settings?.defaultViewMode ?? 'week';
	}

	private lang(): UiLanguage {
		return this.plugin.settings.uiLanguage;
	}

	private L(key: Parameters<typeof t>[1]): string {
		return t(this.lang(), key);
	}

	getViewType(): string {
		return VIEW_TYPE_DAILY_PREVIEW;
	}

	getDisplayText(): string {
		return this.L('viewTitle');
	}

	getIcon(): string {
		return 'calendar';
	}

	async onOpen(): Promise<void> {
		const root = this.contentEl;
		if (!root) {
			console.error('Daily Preview Calendar: contentEl is not available');
			return;
		}

		root.empty();
		root.addClass('daily-preview-calendar-root');
		applyFontVariables(root, this.plugin.settings);
		this.syncDisplayClasses();

		try {
			this.buildChrome(root);
		} catch (err) {
			console.error('Daily Preview Calendar: buildChrome failed', err);
			root.createDiv({
				cls: 'daily-preview-calendar__warning',
				text: this.L('toolbarFailed'),
			});
			return;
		}

		this.resizeObserver = new ResizeObserver(() => {
			this.updateResponsiveLayout();
			this.refitAllPreviews();
		});
		this.resizeObserver.observe(root);

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.hoverPreview.hide();
			}),
		);
		this.registerEvent(
			this.app.workspace.on('layout-change', () => {
				this.hoverPreview.hide();
			}),
		);

		window.requestAnimationFrame(() => {
			void this.renderCalendar().catch((err) => {
				console.error('Daily Preview Calendar: render failed', err);
				root.createDiv({
					cls: 'daily-preview-calendar__warning',
					text: this.L('renderFailed'),
				});
			});
		});
	}

	async onClose(): Promise<void> {
		this.resizeObserver?.disconnect();
		this.hoverPreview.dispose();
		this.cells = [];
		this.gridEl = null;
		this.periodLabelEl = null;
	}

	async updateFilePreview(file: TFile): Promise<void> {
		const items = await readPreviewItems(this.app, file, this.plugin.settings);
		this.previewCache.set(file.path, items);
		let touched = false;
		for (const cell of this.cells) {
			if (cell.filePath === file.path) {
				cell.allItems = items;
				touched = true;
			}
		}
		if (touched) {
			this.refitAllPreviews();
		}
	}

	invalidateCache(): void {
		this.previewCache.clear();
	}

	async refresh(): Promise<void> {
		this.previewCache.clear();
		applyFontVariables(this.contentEl, this.plugin.settings);
		this.syncDisplayClasses();
		await this.renderCalendar();
	}

	private syncDisplayClasses(): void {
		const root = this.contentEl;
		if (!root) {
			return;
		}
		root.toggleClass('is-line-wrap', this.plugin.settings.cellLineWrap);
	}

	private buildChrome(container: HTMLElement): void {
		const toolbar = container.createDiv({ cls: 'daily-preview-calendar__toolbar' });

		const nav = toolbar.createDiv({ cls: 'daily-preview-calendar__nav' });
		nav.createEl('button', { text: '←', cls: 'clickable-icon' }).addEventListener(
			'click',
			() => this.navigate(-1),
		);
		nav.createEl('button', { text: this.L('today'), cls: 'mod-cta' }).addEventListener(
			'click',
			() => {
				this.anchorDate = moment().startOf('day');
				void this.renderCalendar();
			},
		);
		nav.createEl('button', { text: '→', cls: 'clickable-icon' }).addEventListener(
			'click',
			() => this.navigate(1),
		);

		this.periodLabelEl = toolbar.createDiv({ cls: 'daily-preview-calendar__title' });

		const modeToggle = toolbar.createDiv({
			cls: 'daily-preview-calendar__mode-toggle',
		});
		const weekBtn = modeToggle.createEl('button', { text: this.L('week') });
		const monthBtn = modeToggle.createEl('button', { text: this.L('month') });

		const syncModeButtons = () => {
			weekBtn.toggleClass('is-active', this.viewMode === 'week');
			monthBtn.toggleClass('is-active', this.viewMode === 'month');
		};
		syncModeButtons();

		weekBtn.addEventListener('click', () => {
			this.viewMode = 'week';
			this.plugin.settings.defaultViewMode = 'week';
			void this.plugin.saveSettings();
			syncModeButtons();
			void this.renderCalendar();
		});
		monthBtn.addEventListener('click', () => {
			this.viewMode = 'month';
			this.plugin.settings.defaultViewMode = 'month';
			void this.plugin.saveSettings();
			syncModeButtons();
			void this.renderCalendar();
		});

		this.gridEl = container.createDiv({ cls: 'daily-preview-calendar__grid' });

		if (!isDailyNotesAvailable()) {
			container.createDiv({
				cls: 'daily-preview-calendar__warning',
				text: this.L('dailyNotesDisabled'),
			});
		}
	}

	private navigate(direction: -1 | 1): void {
		if (this.viewMode === 'week') {
			this.anchorDate = this.anchorDate.clone().add(direction * 7, 'day');
		} else {
			this.anchorDate = this.anchorDate.clone().add(direction, 'month');
		}
		void this.renderCalendar();
	}

	private getWeekStart(date: moment.Moment): moment.Moment {
		const startOn = this.plugin.settings.weekStartsOn;
		const d = date.clone().startOf('day');
		const current = d.day();
		const diff = (current - startOn + 7) % 7;
		return d.subtract(diff, 'day');
	}

	private getDatesInView(): moment.Moment[] {
		if (this.viewMode === 'week') {
			const start = this.getWeekStart(this.anchorDate);
			return Array.from({ length: 7 }, (_, i) => start.clone().add(i, 'day'));
		}

		const monthStart = this.anchorDate.clone().startOf('month');
		const gridStart = this.getWeekStart(monthStart);
		const dates: moment.Moment[] = [];
		let cursor = gridStart.clone();
		for (let i = 0; i < 42; i++) {
			dates.push(cursor.clone());
			cursor = cursor.add(1, 'day');
		}
		return dates;
	}

	private updateTitle(): void {
		if (!this.periodLabelEl) return;
		const locale = this.lang() === 'ja' ? 'ja' : 'en';
		if (this.viewMode === 'week') {
			const start = this.getWeekStart(this.anchorDate);
			const end = start.clone().add(6, 'day');
			if (locale === 'ja') {
				if (start.year() === end.year() && start.month() === end.month()) {
					safeSetText(
						this.periodLabelEl,
						`${start.format('YYYY年M月D日')} – ${end.format('D日')}`,
					);
				} else if (start.year() === end.year()) {
					safeSetText(
						this.periodLabelEl,
						`${start.format('YYYY年M月D日')} – ${end.format('M月D日')}`,
					);
				} else {
					safeSetText(
						this.periodLabelEl,
						`${start.format('YYYY年M月D日')} – ${end.format('YYYY年M月D日')}`,
					);
				}
			} else {
				safeSetText(
					this.periodLabelEl,
					`${start.format('MMM D, YYYY')} – ${end.format('MMM D, YYYY')}`,
				);
			}
		} else {
			safeSetText(
				this.periodLabelEl,
				locale === 'ja'
					? this.anchorDate.format('YYYY年M月')
					: this.anchorDate.format('MMMM YYYY'),
			);
		}
	}

	async renderCalendar(): Promise<void> {
		if (!this.gridEl) return;

		const generation = ++this.renderGeneration;
		this.cells = [];
		this.gridEl.empty();
		this.updateTitle();

		this.gridEl.toggleClass('is-week', this.viewMode === 'week');
		this.gridEl.toggleClass('is-month', this.viewMode === 'month');

		const headerRow = this.gridEl.createDiv({
			cls: 'daily-preview-calendar__header-row',
		});
		for (const label of weekdayLabels(this.lang(), this.plugin.settings.weekStartsOn)) {
			headerRow.createDiv({
				cls: 'daily-preview-calendar__header-cell',
				text: label,
			});
		}

		const body = this.gridEl.createDiv({ cls: 'daily-preview-calendar__body' });
		const dates = this.getDatesInView();
		try {
			this.dailyNotesMap = getAllDailyNotesMap();
		} catch (err) {
			console.error('Daily Preview Calendar: failed to load daily notes', err);
			this.dailyNotesMap = {};
			this.gridEl.createDiv({
				cls: 'daily-preview-calendar__warning',
				text: this.L('folderMissing'),
			});
		}

		const monthIndex =
			this.viewMode === 'month' ? this.anchorDate.month() : -1;

		for (const date of dates) {
			const isOutsideMonth =
				this.viewMode === 'month' && date.month() !== monthIndex;
			this.cells.push(this.buildDayCell(body, date, isOutsideMonth));
		}

		await this.loadAllPreviews(generation);
		this.updateResponsiveLayout();
		this.refitAllPreviews();
	}

	private buildDayCell(
		parent: HTMLElement,
		date: moment.Moment,
		isOutsideMonth: boolean,
	): DayCellParts {
		const file = getNoteForDate(date, this.dailyNotesMap);
		const isToday = date.isSame(moment(), 'day');

		const root = parent.createDiv({ cls: 'daily-preview-calendar__cell' });
		root.toggleClass('is-today', isToday);
		root.toggleClass('is-outside', isOutsideMonth);
		root.toggleClass('has-note', !!file);

		const header = root.createDiv({ cls: 'daily-preview-calendar__cell-header' });
		header.createSpan({
			cls: 'daily-preview-calendar__cell-date',
			text: String(date.date()),
		});
		if (this.viewMode === 'week') {
			header.createSpan({
				cls: 'daily-preview-calendar__cell-weekday',
				text: date.format('ddd'),
			});
		}

		const preview = root.createDiv({ cls: 'daily-preview-calendar__preview' });

		const cellParts: DayCellParts = {
			root,
			preview,
			date,
			filePath: file?.path ?? null,
			allItems: [],
		};

		const openNote = () => {
			this.hoverPreview.hide();
			const inMain = isMainAreaLeaf(this.leaf, this.app.workspace);
			void openOrCreateDailyNote(this.app, date, {
				target: inMain ? 'tab' : 'main',
				noticeCreateFailed: this.L('createNoteFailed'),
			});
		};

		root.addEventListener('click', (evt) => {
			if (evt.defaultPrevented) return;
			if (this.hoverPreview.isOpen()) {
				this.hoverPreview.hide();
				return;
			}
			openNote();
		});

		if (!Platform.isMobile) {
			root.addEventListener('contextmenu', (evt) => {
				evt.preventDefault();
				this.showCellMenu(evt, date, file, openNote, cellParts);
			});
		} else {
			root.addEventListener('contextmenu', (evt) => {
				evt.preventDefault();
			});
		}

		if (this.plugin.settings.hoverPreviewEnabled) {
			this.hoverPreview.attach(root, () => {
				if (!cellParts.filePath || cellParts.allItems.length === 0) {
					return null;
				}
				const options = {
					title: this.formatCellTitle(date),
					items: cellParts.allItems,
					highlights: this.plugin.settings.wordHighlights,
				};
				if (Platform.isMobile) {
					const actions = [
						{ label: this.L('openNote'), onClick: openNote },
					];
					if (file) {
						actions.push({
							label: this.L('openNoteNewTab'),
							onClick: () => {
								void this.app.workspace.getLeaf('tab').openFile(file);
							},
						});
					}
					return { ...options, actions };
				}
				return options;
			});
		}

		return cellParts;
	}

	private formatCellTitle(date: moment.Moment): string {
		const locale = this.lang() === 'ja' ? 'ja' : 'en';
		return locale === 'ja'
			? date.format('YYYY年M月D日')
			: date.format('MMM D, YYYY');
	}

	private showCellMenu(
		evt: MouseEvent,
		date: moment.Moment,
		file: TFile | null,
		openNote: () => void,
		cell: DayCellParts,
	): void {
		const menu = new Menu();
		menu.addItem((item) => {
			item.setTitle(this.L('openNote')).onClick(openNote);
		});
		if (file && this.plugin.settings.hoverPreviewEnabled && cell.allItems.length > 0) {
			menu.addItem((item) => {
				item.setTitle(this.L('showFullPreview')).onClick(() => {
					this.hoverPreview.showManual(cell.root, {
						title: this.formatCellTitle(date),
						items: cell.allItems,
						highlights: this.plugin.settings.wordHighlights,
					});
				});
			});
		}
		if (file) {
			menu.addItem((item) => {
				item.setTitle(this.L('openNoteNewTab')).onClick(() => {
					void this.app.workspace.getLeaf('tab').openFile(file);
				});
			});
		}
		menu.showAtMouseEvent(evt);
	}

	private async loadAllPreviews(generation: number): Promise<void> {
		const settings = this.plugin.settings;
		const tasks = this.cells.map(async (cell) => {
			if (!cell.filePath) {
				cell.allItems = [];
				return;
			}
			let items = this.previewCache.get(cell.filePath);
			if (items === undefined) {
				const file = this.app.vault.getAbstractFileByPath(cell.filePath);
				if (file instanceof TFile) {
					items = await readPreviewItems(this.app, file, settings);
					this.previewCache.set(cell.filePath, items);
				} else {
					items = [];
				}
			}
			cell.allItems = items;
		});

		await Promise.all(tasks);
		if (generation !== this.renderGeneration) return;
	}

	private updateResponsiveLayout(): void {
		if (!this.gridEl || !this.contentEl) return;
		const narrow = this.contentEl.clientWidth < 520;
		this.gridEl.toggleClass('is-narrow', narrow);
	}

	private refitAllPreviews(): void {
		const { wordHighlights, cellLineWrap } = this.plugin.settings;
		for (const cell of this.cells) {
			let fitted: PreviewItem[];
			if (cellLineWrap) {
				cell.preview.empty();
				fitted = fitItemsToHeightWrapped(
					cell.preview,
					cell.allItems,
					wordHighlights,
				);
			} else {
				fitted = fitItemsToHeight(cell.preview, cell.allItems);
			}
			renderPreviewItems(cell.preview, fitted, wordHighlights, {
				wrap: cellLineWrap,
			});
		}
	}
}

export function describeDailyNotesSource(_app: App, lang: UiLanguage): string {
	if (!isDailyNotesAvailable()) {
		return t(lang, 'dailyNotesSourceDisabled');
	}
	const { folder, format } = readDailyNotesConfig();
	const folderLabel =
		folder.length > 0 ? folder : lang === 'ja' ? '（Vault ルート）' : '(vault root)';
	return tf(lang, 'dailyNotesSource', folderLabel, format);
}
