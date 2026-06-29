import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import {
	DailyPreviewCalendarSettingTab,
	migrateSettings,
	type DailyPreviewCalendarSettings,
	type OpenLocation,
} from './settings';
import {
	DailyPreviewCalendarView,
	VIEW_TYPE_DAILY_PREVIEW,
} from './views/DailyPreviewCalendarView';
import { isDailyNotesAvailable } from './dailyNotes';
import { t } from './i18n';

export default class DailyPreviewCalendarPlugin extends Plugin {
	settings!: DailyPreviewCalendarSettings;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.registerView(
			VIEW_TYPE_DAILY_PREVIEW,
			(leaf: WorkspaceLeaf) => new DailyPreviewCalendarView(leaf, this),
		);

		this.registerCommands();
		this.addSettingTab(new DailyPreviewCalendarSettingTab(this.app, this));

		this.addRibbonIcon('calendar', t(this.settings.uiLanguage, 'ribbonTooltip'), () => {
			void this.activateView();
		});

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					void this.handleFileModify(file);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on('create', () => {
				void this.refreshViews();
			}),
		);

		this.registerEvent(
			this.app.vault.on('delete', () => {
				void this.refreshViews();
			}),
		);

		this.registerEvent(
			this.app.vault.on('rename', () => {
				void this.refreshViews();
			}),
		);
	}

	private registerCommands(): void {
		const lang = this.settings.uiLanguage;

		this.addCommand({
			id: 'open',
			name: t(lang, 'cmdOpen'),
			callback: () => {
				void this.activateView();
			},
		});

		this.addCommand({
			id: 'open-sidebar',
			name: t(lang, 'cmdOpenSidebar'),
			callback: () => {
				void this.activateView('sidebar');
			},
		});

		this.addCommand({
			id: 'open-main',
			name: t(lang, 'cmdOpenMain'),
			callback: () => {
				void this.activateView('main');
			},
		});
	}

	async activateView(location?: OpenLocation): Promise<void> {
		if (!isDailyNotesAvailable()) {
			new Notice(t(this.settings.uiLanguage, 'dailyNotesCoreNotice'));
		}

		const loc = location ?? this.settings.defaultOpenLocation;
		const { workspace } = this.app;

		const existing = workspace.getLeavesOfType(VIEW_TYPE_DAILY_PREVIEW)[0];
		if (existing) {
			await workspace.revealLeaf(existing);
			return;
		}

		const openInLeaf = async (leaf: WorkspaceLeaf): Promise<void> => {
			await leaf.setViewState({
				type: VIEW_TYPE_DAILY_PREVIEW,
				active: true,
			});
			await workspace.revealLeaf(leaf);
		};

		if (loc === 'main') {
			await openInLeaf(workspace.getLeaf('tab'));
			return;
		}

		const rightLeaf = workspace.getRightLeaf(false);
		if (rightLeaf) {
			await openInLeaf(rightLeaf);
			return;
		}

		const leftLeaf = workspace.getLeftLeaf(false);
		if (leftLeaf) {
			await openInLeaf(leftLeaf);
			return;
		}

		await openInLeaf(workspace.getLeaf(false));
	}

	async applySettingsAndRefresh(): Promise<void> {
		await this.saveSettings();
		await this.refreshViews();
	}

	async refreshViews(): Promise<void> {
		for (const leaf of this.app.workspace.getLeavesOfType(
			VIEW_TYPE_DAILY_PREVIEW,
		)) {
			const view = leaf.view;
			if (view instanceof DailyPreviewCalendarView) {
				view.invalidateCache();
				await view.refresh();
			}
		}
	}

	private async handleFileModify(file: TFile): Promise<void> {
		for (const leaf of this.app.workspace.getLeavesOfType(
			VIEW_TYPE_DAILY_PREVIEW,
		)) {
			const view = leaf.view;
			if (view instanceof DailyPreviewCalendarView) {
				await view.updateFilePreview(file);
			}
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = migrateSettings(
			(await this.loadData()) as Partial<DailyPreviewCalendarSettings>,
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}
