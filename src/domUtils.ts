/** setText の null 安全ラッパー（Obsidian 拡張メソッド未付与時は textContent） */
export function safeSetText(el: HTMLElement | null | undefined, text: string): void {
	if (!el) {
		return;
	}
	if (typeof (el as HTMLElement & { setText?: (t: string) => void }).setText === 'function') {
		el.setText(text);
	} else {
		el.textContent = text;
	}
}
