import type { PreviewItem } from './previewContent';
import type { WordHighlightRule } from './settings';
import {
	parseInlineMarkdown,
	renderInlineNodes,
} from './inlineMarkdown';

export interface RenderPreviewOptions {
	wrap?: boolean;
}

export function renderPreviewItems(
	container: HTMLElement,
	items: PreviewItem[],
	highlights: WordHighlightRule[],
	options: RenderPreviewOptions = {},
): void {
	container.empty();
	if (items.length === 0) {
		container.addClass('is-empty');
		return;
	}
	container.removeClass('is-empty');
	container.toggleClass('is-wrap', options.wrap === true);

	for (const item of items) {
		if (item.kind === 'code') {
			renderCodeBlock(container, item.lines, item.language);
			continue;
		}
		renderPreviewLine(container, item.raw, highlights);
	}
}

function renderCodeBlock(
	parent: HTMLElement,
	lines: string[],
	language?: string,
): void {
	const block = parent.createDiv({ cls: 'daily-preview-calendar__code-block' });
	if (language) {
		block.setAttr('data-lang', language);
	}
	block.createEl('pre').createEl('code', { text: lines.join('\n') });
}

function renderPreviewLine(
	parent: HTMLElement,
	raw: string,
	highlights: WordHighlightRule[],
): void {
	const lineEl = parent.createDiv({ cls: 'daily-preview-calendar__line' });
	const trimmed = raw.trim();

	if (/^(\*{3,}|-{3,}|_{3,})\s*$/.test(trimmed)) {
		lineEl.addClass('is-hr');
		lineEl.createEl('hr');
		return;
	}

	if (/^#{1,6}\s/.test(trimmed)) {
		lineEl.addClass('is-heading');
		const nodes = parseInlineMarkdown(raw);
		renderInlineNodes(lineEl, nodes, highlights);
		return;
	}

	const embedOnly = trimmed.match(/^!\[\[([^\]]+)\]\]\s*$/);
	if (embedOnly) {
		lineEl.addClass('is-embed');
		renderEmbedLabel(lineEl, embedOnly[1]!);
		return;
	}

	const quote = parseBlockquote(raw);
	if (quote) {
		lineEl.addClass('is-quote');
		lineEl.style.setProperty('--dpc-quote-depth', String(quote.depth));
		const nodes = parseInlineMarkdown(quote.content);
		renderInlineNodes(lineEl, nodes, highlights);
		return;
	}

	const list = parseListItem(raw);
	if (list) {
		lineEl.addClass('is-list');
		if (list.task) {
			lineEl.addClass(list.taskDone ? 'is-task-done' : 'is-task');
		}
		lineEl.style.setProperty('--dpc-list-indent', String(list.indent));
		const marker = lineEl.createSpan({ cls: 'daily-preview-calendar__list-marker' });
		marker.setText(list.marker);
		const body = lineEl.createSpan({ cls: 'daily-preview-calendar__list-body' });
		renderInlineNodes(body, parseInlineMarkdown(list.content), highlights);
		return;
	}

	const nodes = parseInlineMarkdown(raw);
	renderInlineNodes(lineEl, nodes, highlights);
}

function parseBlockquote(raw: string): { depth: number; content: string } | null {
	const match = raw.match(/^((?:>\s*)+)/);
	if (!match) {
		return null;
	}
	const prefix = match[1]!;
	const depth = (prefix.match(/>/g) ?? []).length;
	const content = raw.slice(match[0].length).trim();
	return { depth, content };
}

interface ListItemInfo {
	indent: number;
	marker: string;
	content: string;
	task?: boolean;
	taskDone?: boolean;
}

function parseListItem(raw: string): ListItemInfo | null {
	const match = raw.match(/^(\s*)([-*+]|\d+\.)\s+(.*)$/);
	if (!match) {
		return null;
	}
	const spaces = match[1] ?? '';
	const indent = Math.floor(spaces.replace(/\t/g, '  ').length / 2);
	const token = match[2]!;
	let rest = match[3] ?? '';

	const taskMatch = rest.match(/^\[([ xX/-])\]\s+(.*)$/);
	if (taskMatch && /^[-*+]$/.test(token)) {
		const state = taskMatch[1]!;
		return {
			indent,
			marker: state === ' ' ? '☐' : '☑',
			content: taskMatch[2] ?? '',
			task: true,
			taskDone: state !== ' ' && state !== '-',
		};
	}

	const marker = /^\d+\.$/.test(token) ? `${token} ` : `${token} `;
	return { indent, marker, content: rest };
}

function renderEmbedLabel(parent: HTMLElement, inner: string): void {
	const pipe = inner.indexOf('|');
	const target = pipe === -1 ? inner : inner.slice(0, pipe);
	const alias = pipe === -1 ? undefined : inner.slice(pipe + 1);
	const isImage = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(target.split('/').pop() ?? '');
	const icon = isImage ? '🖼 ' : '🔗 ';
	const label = alias?.trim() || target.split('/').pop() || target;
	parent.createSpan({ cls: 'daily-preview-calendar__embed-label', text: icon + label });
}

/** Incrementally fit items when line wrap is enabled (measure rendered height). */
export function fitItemsToHeightWrapped(
	container: HTMLElement,
	items: PreviewItem[],
	highlights: WordHighlightRule[],
): PreviewItem[] {
	if (items.length === 0 || container.clientHeight <= 0) {
		return [];
	}

	const fitted: PreviewItem[] = [];
	for (const item of items) {
		renderPreviewItems(container, [...fitted, item], highlights, { wrap: true });
		if (container.scrollHeight > container.clientHeight && fitted.length > 0) {
			break;
		}
		fitted.push(item);
	}

	return fitted;
}

/** @deprecated Use renderPreviewItems */
export function renderPreviewLines(
	container: HTMLElement,
	lines: string[],
	highlights: WordHighlightRule[],
): void {
	renderPreviewItems(
		container,
		lines.map((raw) => ({ kind: 'line' as const, raw })),
		highlights,
	);
}
