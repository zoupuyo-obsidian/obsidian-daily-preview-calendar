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
	private anchorEl: HTMLElement | null = null;
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
		this.anchorEl = anchor;
		this.removePopover();

		const popover = document.body.createDiv({
			cls: 'daily-preview-calendar__hover-popover',
		});

		popover.createDiv({
			cls: 'daily-preview-calendar__hover-popover-title',
			text: options.title,
		});

		const body = popover.createDiv({
			cls: 'daily-preview-calendar__hover-popover-body daily-preview-calendar__preview is-wrap',
		});

		renderPreviewItems(body, options.items, options.highlights, { wrap: true });

		const calRoot = document.querySelector(
			'.daily-preview-calendar-root',
		) as HTMLElement | null;
		if (calRoot) {
			for (const name of ['--dpc-body-font-family', '--dpc-body-font-size']) {
				const value = getComputedStyle(calRoot).getPropertyValue(name);
				if (value) {
					body.style.setProperty(name, value);
				}
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
		const maxW = Math.min(420, window.innerWidth - margin * 2);
		popover.style.maxWidth = `${maxW}px`;

		popover.style.visibility = 'hidden';
		popover.style.display = 'block';
		const popRect = popover.getBoundingClientRect();

		let top = rect.bottom + margin;
		if (top + popRect.height > window.innerHeight - margin) {
			top = Math.max(margin, rect.top - popRect.height - margin);
		}

		let left = rect.left;
		if (left + popRect.width > window.innerWidth - margin) {
			left = window.innerWidth - popRect.width - margin;
		}
		left = Math.max(margin, left);

		popover.style.top = `${top}px`;
		popover.style.left = `${left}px`;
		popover.style.visibility = 'visible';
	}

	private removePopover(): void {
		this.popover?.remove();
		this.popover = null;
		this.anchorEl = null;
	}
}
