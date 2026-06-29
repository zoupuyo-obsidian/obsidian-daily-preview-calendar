/** Strip YAML frontmatter and return body text. */
export function stripFrontmatter(content: string): string {
	if (!content.startsWith('---')) {
		return content;
	}
	const end = content.indexOf('\n---', 3);
	if (end === -1) {
		return content;
	}
	return content.slice(end + 4);
}

interface NoteSection {
	/** Full heading line e.g. "## 今日のタスク", or null for preamble */
	headingLine: string | null;
	lines: string[];
}

const HEADING_LINE_RE = /^(#{1,6})\s+(.+?)\s*$/;

function splitSections(body: string): NoteSection[] {
	const sections: NoteSection[] = [];
	let current: NoteSection = { headingLine: null, lines: [] };

	for (const raw of body.split('\n')) {
		const match = raw.match(HEADING_LINE_RE);
		if (match) {
			if (current.headingLine !== null || current.lines.length > 0) {
				sections.push(current);
			}
			current = { headingLine: raw.trim(), lines: [] };
			continue;
		}
		current.lines.push(raw);
	}
	sections.push(current);
	return sections;
}

function shouldShowSection(
	headingLine: string | null,
	rules: { headingPattern: string; show: boolean }[],
): boolean {
	if (rules.length === 0) {
		return true;
	}
	if (headingLine === null) {
		return true;
	}
	const normalized = headingLine.trim();
	const rule = rules.find((r) => r.headingPattern.trim() === normalized);
	if (!rule) {
		return true;
	}
	return rule.show;
}

export interface PreviewExtractOptions {
	showHeadingLines: boolean;
	sectionRules: { headingPattern: string; show: boolean }[];
}

export type PreviewItem =
	| { kind: 'line'; raw: string }
	| { kind: 'code'; lines: string[]; language?: string };

function linesToItems(rawLines: string[]): PreviewItem[] {
	const items: PreviewItem[] = [];
	let i = 0;

	while (i < rawLines.length) {
		const raw = rawLines[i]!;
		const fence = raw.trim().match(/^(`{3,}|~{3,})(\w*)$/);
		if (fence) {
			const fenceChar = fence[1]![0]!;
			const lang = fence[2] || undefined;
			const codeLines: string[] = [];
			i++;
			while (i < rawLines.length) {
				const line = rawLines[i]!;
				if (line.trim().startsWith(fenceChar.repeat(3))) {
					i++;
					break;
				}
				codeLines.push(line);
				i++;
			}
			if (codeLines.length > 0) {
				items.push({ kind: 'code', lines: codeLines, language: lang });
			}
			continue;
		}

		items.push({ kind: 'line', raw });
		i++;
	}

	return items;
}

/** Raw markdown items for cell preview (section filter applied). */
export function extractPreviewItems(
	content: string,
	options: PreviewExtractOptions,
): PreviewItem[] {
	const body = stripFrontmatter(content);
	const sections = splitSections(body);
	const rawLines: string[] = [];

	for (const section of sections) {
		if (!shouldShowSection(section.headingLine, options.sectionRules)) {
			continue;
		}

		if (section.headingLine && options.showHeadingLines) {
			rawLines.push(section.headingLine);
		}

		for (const raw of section.lines) {
			const trimmed = raw.trim();
			if (!trimmed) {
				continue;
			}
			if (HEADING_LINE_RE.test(raw)) {
				continue;
			}
			rawLines.push(raw.trimEnd());
		}
	}

	return linesToItems(rawLines);
}

/** @deprecated Use extractPreviewItems */
export function extractPreviewLines(
	content: string,
	options: PreviewExtractOptions,
): string[] {
	return extractPreviewItems(content, options)
		.filter((item): item is { kind: 'line'; raw: string } => item.kind === 'line')
		.map((item) => item.raw);
}

/** Fit as many rows as the container height allows (nowrap: one source row = one row). */
export function fitItemsToHeight(
	container: HTMLElement,
	items: PreviewItem[],
	lineHeightPx?: number,
): PreviewItem[] {
	if (items.length === 0 || container.clientHeight <= 0) {
		return [];
	}

	const style = getComputedStyle(container);
	const fontSize = parseFloat(style.fontSize) || 12;
	const lineHeight =
		lineHeightPx ?? (parseFloat(style.lineHeight) || fontSize * 1.35);
	const paddingTop = parseFloat(style.paddingTop) || 0;
	const paddingBottom = parseFloat(style.paddingBottom) || 0;
	const available = container.clientHeight - paddingTop - paddingBottom;
	const maxRows = Math.max(1, Math.floor(available / lineHeight));

	let used = 0;
	const result: PreviewItem[] = [];

	for (const item of items) {
		if (used >= maxRows) {
			break;
		}
		if (item.kind === 'code') {
			const budget = Math.min(3, maxRows - used);
			if (budget <= 0) {
				break;
			}
			result.push({
				kind: 'code',
				language: item.language,
				lines: item.lines.slice(0, budget),
			});
			used += budget;
		} else {
			result.push(item);
			used += 1;
		}
	}

	return result;
}

/** @deprecated Use fitItemsToHeight */
export function fitLinesToHeight(
	container: HTMLElement,
	lines: string[],
	lineHeightPx?: number,
): string[] {
	const items = fitItemsToHeight(
		container,
		lines.map((raw) => ({ kind: 'line' as const, raw })),
		lineHeightPx,
	);
	return items
		.filter((item): item is { kind: 'line'; raw: string } => item.kind === 'line')
		.map((item) => item.raw);
}
