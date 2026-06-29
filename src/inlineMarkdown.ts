import type { WordHighlightRule } from './settings';

export type InlineNode =
	| { type: 'text'; value: string }
	| { type: 'strong'; children: InlineNode[] }
	| { type: 'em'; children: InlineNode[] }
	| { type: 'code'; value: string }
	| { type: 'wikilink'; target: string; alias?: string }
	| { type: 'embed'; target: string; alias?: string }
	| { type: 'link'; text: string; href: string }
	| { type: 'highlight'; children: InlineNode[] }
	| { type: 'strike'; children: InlineNode[] };

/** Remove list/checkbox prefix only when parsing inline body (list markers rendered separately). */
export function normalizeListLine(line: string): string {
	return line
		.replace(/<!--[\s\S]*?-->/g, '')
		.trim();
}

export function parseInlineMarkdown(line: string): InlineNode[] {
	const normalized = normalizeListLine(line);
	if (!normalized) {
		return [];
	}
	if (/^#{1,6}\s/.test(line.trim())) {
		return [{ type: 'text', value: line.trim().replace(/^#{1,6}\s+/, '') }];
	}
	return parseInlineRecursive(normalized);
}

function parseInlineRecursive(text: string): InlineNode[] {
	if (!text) {
		return [];
	}

	const patterns: {
		re: RegExp;
		build: (m: RegExpMatchArray) => { len: number; node: InlineNode };
	}[] = [
		{
			re: /\*\*(.+?)\*\*/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'strong' as const, children: parseInlineRecursive(m[1]!) },
			}),
		},
		{
			re: /__(.+?)__/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'strong' as const, children: parseInlineRecursive(m[1]!) },
			}),
		},
		{
			re: /\*(.+?)\*/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'em' as const, children: parseInlineRecursive(m[1]!) },
			}),
		},
		{
			re: /_(.+?)_/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'em' as const, children: parseInlineRecursive(m[1]!) },
			}),
		},
		{
			re: /==(.+?)==/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'highlight' as const, children: parseInlineRecursive(m[1]!) },
			}),
		},
		{
			re: /~~(.+?)~~/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'strike' as const, children: parseInlineRecursive(m[1]!) },
			}),
		},
		{
			re: /`([^`]+)`/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'code' as const, value: m[1]! },
			}),
		},
		{
			re: /!\[\[([^\]|]+)\|([^\]]+)\]\]/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'embed' as const, target: m[1]!, alias: m[2]! },
			}),
		},
		{
			re: /!\[\[([^\]]+)\]\]/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'embed' as const, target: m[1]! },
			}),
		},
		{
			re: /\[\[([^\]|]+)\|([^\]]+)\]\]/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'wikilink' as const, target: m[1]!, alias: m[2]! },
			}),
		},
		{
			re: /\[\[([^\]]+)\]\]/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'wikilink' as const, target: m[1]! },
			}),
		},
		{
			re: /\[([^\]]+)\]\(([^)]+)\)/,
			build: (m) => ({
				len: m[0].length,
				node: { type: 'link' as const, text: m[1]!, href: m[2]! },
			}),
		},
	];

	let best: { index: number; len: number; node: InlineNode } | null = null;
	for (const { re, build } of patterns) {
		re.lastIndex = 0;
		const m = re.exec(text);
		if (m && m.index !== undefined && (best === null || m.index < best.index)) {
			best = { index: m.index, ...build(m) };
		}
	}

	if (!best) {
		return [{ type: 'text', value: text }];
	}

	const nodes: InlineNode[] = [];
	if (best.index > 0) {
		nodes.push({ type: 'text', value: text.slice(0, best.index) });
	}
	nodes.push(best.node);
	nodes.push(...parseInlineRecursive(text.slice(best.index + best.len)));
	return nodes;
}

export function renderInlineNodes(
	parent: HTMLElement,
	nodes: InlineNode[],
	highlights: WordHighlightRule[],
): void {
	for (const node of nodes) {
		renderInlineNode(parent, node, highlights);
	}
}

function renderInlineNode(
	parent: HTMLElement,
	node: InlineNode,
	highlights: WordHighlightRule[],
): void {
	switch (node.type) {
		case 'text':
			appendTextWithHighlights(parent, node.value, highlights);
			break;
		case 'strong': {
			const el = parent.createEl('strong');
			renderInlineNodes(el, node.children, highlights);
			break;
		}
		case 'em': {
			const el = parent.createEl('em');
			renderInlineNodes(el, node.children, highlights);
			break;
		}
		case 'code':
			parent.createEl('code', { text: node.value });
			break;
		case 'wikilink':
			parent.createEl('span', {
				cls: 'internal-link',
				text: node.alias ?? node.target,
			});
			break;
		case 'embed': {
			const span = parent.createEl('span', { cls: 'daily-preview-calendar__embed-inline' });
			const target = node.target;
			const isImage = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(
				target.split('/').pop() ?? '',
			);
			span.setText((isImage ? '🖼 ' : '🔗 ') + (node.alias ?? target.split('/').pop() ?? target));
			break;
		}
		case 'link': {
			const a = parent.createEl('a', { cls: 'external-link', text: node.text });
			a.href = node.href;
			break;
		}
		case 'highlight': {
			const el = parent.createEl('mark');
			renderInlineNodes(el, node.children, highlights);
			break;
		}
		case 'strike': {
			const el = parent.createEl('del');
			renderInlineNodes(el, node.children, highlights);
			break;
		}
	}
}

function appendTextWithHighlights(
	parent: HTMLElement,
	text: string,
	highlights: WordHighlightRule[],
): void {
	const rules = highlights
		.filter((r) => r.enabled && r.word.length > 0)
		.sort((a, b) => b.word.length - a.word.length);

	if (rules.length === 0 || !text) {
		parent.appendText(text);
		return;
	}

	let remaining = text;
	while (remaining.length > 0) {
		let bestIndex = -1;
		let bestRule: WordHighlightRule | null = null;

		for (const rule of rules) {
			const idx = remaining.indexOf(rule.word);
			if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
				bestIndex = idx;
				bestRule = rule;
			}
		}

		if (bestIndex === -1 || !bestRule) {
			parent.appendText(remaining);
			break;
		}

		if (bestIndex > 0) {
			parent.appendText(remaining.slice(0, bestIndex));
		}

		const span = parent.createEl('span', {
			cls:
				bestRule.style === 'marker'
					? 'daily-preview-calendar__kw-marker'
					: 'daily-preview-calendar__kw-color',
		});
		span.setText(bestRule.word);
		if (bestRule.style === 'marker') {
			span.style.backgroundColor = bestRule.color;
		} else {
			span.style.color = bestRule.color;
		}

		remaining = remaining.slice(bestIndex + bestRule.word.length);
	}
}
