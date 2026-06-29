import type { App, Workspace, WorkspaceLeaf } from 'obsidian';

/** Calendar view is in the main editor area (not sidebar / drawer). */
export function isMainAreaLeaf(leaf: WorkspaceLeaf, workspace: Workspace): boolean {
	try {
		return leaf.getContainer() === workspace.rootSplit;
	} catch {
		return false;
	}
}

export type OpenTarget = 'main' | 'tab';

export function openFileInWorkspace(
	app: App,
	file: import('obsidian').TFile,
	target: OpenTarget,
): Promise<void> {
	const leaf =
		target === 'tab' ? app.workspace.getLeaf('tab') : app.workspace.getLeaf(false);
	return leaf.openFile(file);
}
