import { App, Notice, TFile } from 'obsidian';
import {
	appHasDailyNotesPluginLoaded,
	createDailyNote,
	getAllDailyNotes,
	getDailyNote,
	getDailyNoteSettings,
} from 'obsidian-daily-notes-interface';
import type { Moment } from 'moment';
import { extractPreviewItems, fitItemsToHeight, type PreviewItem } from './previewContent';
import type { DailyPreviewCalendarSettings } from './settings';
import { openFileInWorkspace, type OpenTarget } from './workspaceUtil';

export interface DailyNotesConfig {
	folder: string;
	format: string;
	template: string;
}

export function isDailyNotesAvailable(): boolean {
	return appHasDailyNotesPluginLoaded();
}

export function readDailyNotesConfig(): DailyNotesConfig {
	const { folder, format, template } = getDailyNoteSettings();
	return {
		folder: folder ?? '',
		format: format ?? 'YYYY-MM-DD',
		template: template ?? '',
	};
}

export function getNoteForDate(
	date: Moment,
	dailyNotes?: Record<string, TFile>,
): TFile | null {
	const map = dailyNotes ?? getAllDailyNotes();
	return getDailyNote(date, map) ?? null;
}

export function getAllDailyNotesMap(): Record<string, TFile> {
	try {
		return getAllDailyNotes();
	} catch (err) {
		console.error('Daily Preview Calendar: getAllDailyNotes failed', err);
		return {};
	}
}

export async function openOrCreateDailyNote(
	app: App,
	date: Moment,
	options: { target?: OpenTarget; noticeCreateFailed?: string } = {},
): Promise<TFile | null> {
	if (!isDailyNotesAvailable()) {
		new Notice(
			'Daily Preview Calendar: Enable the core "Daily notes" plugin.',
		);
		return null;
	}

	let file = getNoteForDate(date);
	if (!file) {
		try {
			file = await createDailyNote(date);
		} catch (err) {
			console.error('Daily Preview Calendar: failed to create daily note', err);
			new Notice(
				options.noticeCreateFailed ??
					'Daily Preview Calendar: Failed to create daily note.',
			);
			return null;
		}
	}

	await openFileInWorkspace(app, file, options.target ?? 'main');
	return file;
}

export async function readPreviewItems(
	app: App,
	file: TFile | null,
	settings: Pick<
		DailyPreviewCalendarSettings,
		'showHeadingLines' | 'sectionRules'
	>,
): Promise<PreviewItem[]> {
	if (!file) {
		return [];
	}
	const content = await app.vault.cachedRead(file);
	return extractPreviewItems(content, {
		showHeadingLines: settings.showHeadingLines,
		sectionRules: settings.sectionRules,
	});
}

/** @deprecated Use readPreviewItems */
export async function readPreviewLines(
	app: App,
	file: TFile | null,
	settings: Pick<
		DailyPreviewCalendarSettings,
		'showHeadingLines' | 'sectionRules'
	>,
): Promise<string[]> {
	const items = await readPreviewItems(app, file, settings);
	return items
		.filter((item): item is { kind: 'line'; raw: string } => item.kind === 'line')
		.map((item) => item.raw);
}
