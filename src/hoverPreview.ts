import type { PreviewItem } from './previewContent';
import { renderPreviewItems } from './previewRender';
import type { WordHighlightRule } from './settings';

export interface HoverPreviewOptions {
	title: string;
	items: PreviewItem[];
	highlights: WordHighlightRule[];
}

export class HoverPreviewController {
	private popover: HTMLElement | null = null;
	private showTimer: number | null = null;
	private hideTimer: number | null = null;
	private suppressNextClick = false;
	private longPressTimer: number | null = null;

	dispose(): void {
		this.clearTimers();
		this.removePopover();
	}

	attach(
		cell: HTMLElement,
		getOptions: () => HoverPreviewOptions | null,
	): { onClickCapture: (evt: MouseEvent) => void } {
		const onClickCapture = (evt: MouseEvent) => {
			if (this.suppressNextClick) {
				evt.preventDefault();
				evt.stopPropagation();
				this.suppressNextClick = false;
			}
		};

		cell.addEventListener('click', onClickCapture, true);

		cell.addEventListener('mouseenter', () => {
			this.scheduleShow(cell, getOptions);
		});

		cell.addEventListener('mouseleave', () => {
			this.scheduleHide();
		});

		cell.addEventListener('pointerdown', (evt) => {
			if (evt.pointerType !== 'touch') {
				return;
			}
			this.clearLongPress();
			this.longPressTimer = window.setTimeout(() => {
				const options = getOptions();
				if (!options || options.items.length === 0) {
					return;
				}
				this.suppressNextClick = true;
				this.show(cell, options);
			}, 480);
		});

		const cancelLongPress = () => this.clearLongPress();
		cell.addEventListener('pointerup', cancelLongPress);
		cell.addEventListener('pointercancel', cancelLongPress);
		cell.addEventListener('pointerleave', cancelLongPress);

		return { onClickCapture };
	}

	showManual(anchor: HTMLElement, options: HoverPreviewOptions): void {
		this.show(anchor, options);
	}

	private scheduleShow(
		anchor: HTMLElement,
		getOptions: () => HoverPreviewOptions | null,
	): void {
		this.clearShowTimer();
		this.showTimer = window.setTimeout(() => {
			const options = getOptions();
			if (!options || options.items.length === 0) {
				return;
			}
			this.show(anchor, options);
		}, 320);
	}

	private scheduleHide(): void {
		this.clearShowTimer();
		this.hideTimer = window.setTimeout(() => this.removePopover(), 180);
	}

	private clearShowTimer(): void {
		if (this.showTimer !== null) {
			window.clearTimeout(this.showTimer);
			this.showTimer = null;
		}
	}

	private clearLongPress(): void {
		if (this.longPressTimer !== null) {
			window.clearTimeout(this.longPressTimer);
			this.longPressTimer = null;
		}
	}

	private clearTimers(): void {
		this.clearShowTimer();
		this.clearLongPress();
		if (this.hideTimer !== null) {
			window.clearTimeout(this.hideTimer);
			this.hideTimer = null;
		}
	}

	private show(anchor: HTMLElement, options: HoverPreviewOptions): void {
		this.clearTimers();
		this.removePopover();

		const doc = anchor.ownerDocument;
		const popover = doc.body.createDiv({
			cls: 'daily-preview-calendar__hover-popover is-measuring',
		});

		popover.createDiv({
			cls: 'daily-preview-calendar__hover-popover-title',
			text: options.title,
		});

		const body = popover.createDiv({
			cls: 'daily-preview-calendar__hover-popover-body daily-preview-calendar__preview is-wrap',
		});

		renderPreviewItems(body, options.items, options.highlights, { wrap: true });

		const calRoot = doc.querySelector('.daily-preview-calendar-root');
		if (calRoot instanceof HTMLElement) {
			const fontFamily = getComputedStyle(calRoot).getPropertyValue(
				'--dpc-body-font-family',
			);
			const fontSize = getComputedStyle(calRoot).getPropertyValue('--dpc-body-font-size');
			const props: Record<string, string> = {};
			if (fontFamily) {
				props['--dpc-body-font-family'] = fontFamily;
			}
			if (fontSize) {
				props['--dpc-body-font-size'] = fontSize;
			}
			if (Object.keys(props).length > 0) {
				body.setCssProps(props);
			}
		}

		popover.addEventListener('mouseenter', () => {
			if (this.hideTimer !== null) {
				window.clearTimeout(this.hideTimer);
				this.hideTimer = null;
			}
		});
		popover.addEventListener('mouseleave', () => this.scheduleHide());

		this.popover = popover;
		this.positionPopover(anchor, popover);
	}

	private positionPopover(anchor: HTMLElement, popover: HTMLElement): void {
		const rect = anchor.getBoundingClientRect();
		const margin = 8;
		const maxW = Math.min(420, anchor.ownerDocument.defaultView?.innerWidth ?? 420 - margin * 2);

		popover.toggleClass('is-wide', maxW >= 400);

		const popRect = popover.getBoundingClientRect();

		let top = rect.bottom + margin;
		const viewHeight = anchor.ownerDocument.defaultView?.innerHeight ?? 800;
		if (top + popRect.height > viewHeight - margin) {
			top = Math.max(margin, rect.top - popRect.height - margin);
		}

		let left = rect.left;
		const viewWidth = anchor.ownerDocument.defaultView?.innerWidth ?? 800;
		if (left + popRect.width > viewWidth - margin) {
			left = viewWidth - popRect.width - margin;
		}
		left = Math.max(margin, left);

		popover.setCssProps({
			'--dpc-popover-top': `${top}px`,
			'--dpc-popover-left': `${left}px`,
		});
		popover.removeClass('is-measuring');
		popover.addClass('is-visible');
	}

	private removePopover(): void {
		this.popover?.remove();
		this.popover = null;
	}
}
