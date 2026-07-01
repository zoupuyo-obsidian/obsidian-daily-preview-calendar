import type { PreviewItem } from './previewContent';
import { renderPreviewItems } from './previewRender';
import type { WordHighlightRule } from './settings';

export interface HoverPreviewAction {
	label: string;
	onClick: () => void;
}

export interface HoverPreviewOptions {
	title: string;
	items: PreviewItem[];
	highlights: WordHighlightRule[];
	actions?: HoverPreviewAction[];
}

const LONG_PRESS_MS = 550;
const MOVE_THRESHOLD_PX = 14;

export class HoverPreviewController {
	private popover: HTMLElement | null = null;
	private anchor: HTMLElement | null = null;
	private showTimer: number | null = null;
	private hideTimer: number | null = null;
	private suppressNextClick = false;
	private longPressTimer: number | null = null;
	private touchStartX = 0;
	private touchStartY = 0;
	private touchCell: HTMLElement | null = null;
	private dismissCleanup: (() => void) | null = null;
	/** Suppress synthetic mouse pointer events after touch (iOS ghost hover). */
	private suppressMouseHoverUntil = 0;

	isOpen(): boolean {
		return this.popover !== null;
	}

	dispose(): void {
		this.hide();
	}

	hide(): void {
		this.clearTimers();
		this.clearTouchState();
		this.removeDismissListeners();
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
				return;
			}
			if (this.isOpen()) {
				evt.preventDefault();
				evt.stopPropagation();
				this.hide();
			}
		};

		cell.addEventListener('click', onClickCapture, true);

		cell.addEventListener('pointerenter', (evt) => {
			if (!this.isHoverPointer(evt.pointerType)) {
				return;
			}
			if (Date.now() < this.suppressMouseHoverUntil) {
				return;
			}
			this.scheduleShow(cell, getOptions);
		});

		cell.addEventListener('pointerleave', (evt) => {
			if (!this.isHoverPointer(evt.pointerType)) {
				return;
			}
			this.scheduleHide();
		});

		cell.addEventListener('pointerdown', (evt) => {
			if (evt.pointerType !== 'touch') {
				return;
			}
			this.beginTouchPress(cell, evt.clientX, evt.clientY, getOptions);
		});

		cell.addEventListener('pointermove', (evt) => {
			if (evt.pointerType !== 'touch' || this.touchCell !== cell) {
				return;
			}
			if (this.pointerMovedTooFar(evt.clientX, evt.clientY)) {
				this.cancelTouchPress(cell);
			}
		});

		const endTouch = (evt: PointerEvent) => {
			if (evt.pointerType !== 'touch' || this.touchCell !== cell) {
				return;
			}
			this.cancelTouchPress(cell);
		};

		cell.addEventListener('pointerup', endTouch);
		cell.addEventListener('pointercancel', endTouch);
		cell.addEventListener('pointerleave', endTouch);

		return { onClickCapture };
	}

	showManual(anchor: HTMLElement, options: HoverPreviewOptions): void {
		this.show(anchor, options);
	}

	private isHoverPointer(pointerType: string): boolean {
		return pointerType === 'mouse' || pointerType === 'pen';
	}

	private beginTouchPress(
		cell: HTMLElement,
		x: number,
		y: number,
		getOptions: () => HoverPreviewOptions | null,
	): void {
		this.cancelTouchPress(this.touchCell ?? undefined);
		this.touchCell = cell;
		this.touchStartX = x;
		this.touchStartY = y;
		this.suppressMouseHoverUntil = Date.now() + 700;
		cell.addClass('is-touch-pressing');

		this.clearLongPress();
		this.longPressTimer = window.setTimeout(() => {
			this.longPressTimer = null;
			const options = getOptions();
			if (!options || options.items.length === 0) {
				this.cancelTouchPress(cell);
				return;
			}
			this.suppressNextClick = true;
			cell.removeClass('is-touch-pressing');
			this.touchCell = null;
			this.show(cell, options);
		}, LONG_PRESS_MS);
	}

	private cancelTouchPress(cell?: HTMLElement): void {
		this.clearLongPress();
		const target = cell ?? this.touchCell;
		target?.removeClass('is-touch-pressing');
		if (!cell || this.touchCell === cell) {
			this.touchCell = null;
		}
	}

	private clearTouchState(): void {
		if (this.touchCell) {
			this.touchCell.removeClass('is-touch-pressing');
			this.touchCell = null;
		}
		if (this.anchor) {
			this.anchor.removeClass('is-preview-anchor');
			this.anchor = null;
		}
	}

	private pointerMovedTooFar(x: number, y: number): boolean {
		const dx = x - this.touchStartX;
		const dy = y - this.touchStartY;
		return Math.hypot(dx, dy) > MOVE_THRESHOLD_PX;
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
		this.hideTimer = window.setTimeout(() => this.hide(), 180);
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
		this.removeDismissListeners();
		this.removePopover();

		if (this.anchor && this.anchor !== anchor) {
			this.anchor.removeClass('is-preview-anchor');
		}
		this.anchor = anchor;
		anchor.addClass('is-preview-anchor');

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

		if (options.actions && options.actions.length > 0) {
			const actionsEl = popover.createDiv({
				cls: 'daily-preview-calendar__hover-popover-actions',
			});
			for (const action of options.actions) {
				const btn = actionsEl.createEl('button', {
					text: action.label,
					cls: options.actions[0] === action ? 'mod-cta' : '',
				});
				btn.addEventListener('click', (evt) => {
					evt.preventDefault();
					evt.stopPropagation();
					this.hide();
					action.onClick();
				});
			}
		}

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
		this.installDismissListeners(doc);
	}

	private installDismissListeners(doc: Document): void {
		this.removeDismissListeners();

		const onPointerDown = (evt: PointerEvent) => {
			const target = evt.target;
			if (!(target instanceof Node)) {
				return;
			}
			if (this.popover?.contains(target)) {
				return;
			}
			if (this.anchor?.contains(target)) {
				return;
			}
			this.hide();
		};

		const onKeyDown = (evt: KeyboardEvent) => {
			if (evt.key === 'Escape') {
				this.hide();
			}
		};

		const onScroll = () => this.hide();

		doc.addEventListener('pointerdown', onPointerDown, true);
		doc.addEventListener('keydown', onKeyDown, true);
		doc.defaultView?.addEventListener('scroll', onScroll, true);

		this.dismissCleanup = () => {
			doc.removeEventListener('pointerdown', onPointerDown, true);
			doc.removeEventListener('keydown', onKeyDown, true);
			doc.defaultView?.removeEventListener('scroll', onScroll, true);
			this.dismissCleanup = null;
		};
	}

	private removeDismissListeners(): void {
		this.dismissCleanup?.();
	}

	private positionPopover(anchor: HTMLElement, popover: HTMLElement): void {
		const rect = anchor.getBoundingClientRect();
		const margin = 8;
		const maxW = Math.min(
			420,
			(anchor.ownerDocument.defaultView?.innerWidth ?? 420) - margin * 2,
		);

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
