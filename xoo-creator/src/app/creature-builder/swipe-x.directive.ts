import { Directive, ElementRef, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Directive({
  selector: '[appSwipeX]',
  standalone: true,
  exportAs: 'swipeX'
})
export class SwipeXDirective {
  @Input() threshold = 60; // pixels
  @Input() preventDefault = false;

  @Output() swipeLeft = new EventEmitter<void>();
  @Output() swipeRight = new EventEmitter<void>();

  // Exposed for template bindings
  public dragX = 0;
  public dragging = false;

  private startX: number | null = null;

  constructor(private readonly el: ElementRef<HTMLElement>) {}

  @HostListener('pointerdown', ['$event'])
  onPointerDown(ev: PointerEvent) {
    if (this.preventDefault) ev.preventDefault();
    ev.stopPropagation();
    this.startX = ev.clientX;
    this.dragging = true;
    this.dragX = 0;
    this.el.nativeElement.setPointerCapture?.(ev.pointerId);
  }

  @HostListener('pointermove', ['$event'])
  onPointerMove(ev: PointerEvent) {
    if (this.preventDefault) ev.preventDefault();
    ev.stopPropagation();
    if (this.startX == null) return;
    const dx = ev.clientX - this.startX;
    this.dragX = dx;
  }

  @HostListener('pointerup', ['$event'])
  onPointerUp(ev: PointerEvent) {
    if (this.preventDefault) ev.preventDefault();
    ev.stopPropagation();
    if (this.startX == null) return;
    const dx = ev.clientX - this.startX;
    this.startX = null;
    if (dx > this.threshold) {
      this.swipeRight.emit();
    } else if (dx < -this.threshold) {
      this.swipeLeft.emit();
    }
    this.dragX = 0;
    this.dragging = false;
    this.el.nativeElement.releasePointerCapture?.(ev.pointerId);
  }

  @HostListener('pointercancel', ['$event'])
  onPointerCancel(ev: PointerEvent) {
    if (this.preventDefault) ev.preventDefault();
    ev.stopPropagation();
    this.startX = null;
    this.dragX = 0;
    this.dragging = false;
  }
}
