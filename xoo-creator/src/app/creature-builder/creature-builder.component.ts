import { Component, computed, signal } from '@angular/core';

// Types
type PartKey = 'head' | 'body' | 'arms' | 'legs' | 'tail';
type PartDef = { key: PartKey; name: string; image: string };
type PartOption = { src: string; label: string };

@Component({
  selector: 'app-creature-builder',
  standalone: true,
  templateUrl: './creature-builder.component.html',
  styleUrl: './creature-builder.component.css'
})
export class CreatureBuilderComponent {

  // Body parts order and mapping to a representative image
  private readonly parts: ReadonlyArray<PartDef> = [
    { key: 'head', name: 'Head', image: '/images/face.webp' },
    { key: 'body', name: 'Body', image: '/images/body.webp' },
    { key: 'arms', name: 'Arms', image: '/images/hand1.webp' },
    { key: 'legs', name: 'Legs', image: '/images/foot.webp' },
    { key: 'tail', name: 'Tail', image: '/images/tail.webp' },
  ] as const;

  // Options per body part (acts as species placeholders for now)
  private readonly options: Record<PartKey, PartOption[]> = {
    head: [
      { src: '/images/face.webp', label: 'Face' },
    ],
    body: [
      { src: '/images/body.webp', label: 'Body' },
    ],
    arms: [
      { src: '/images/hand1.webp', label: 'Arms Option 1' },
      { src: '/images/hand2.webp', label: 'Arms Option 2' },
    ],
    legs: [
      { src: '/images/foot.webp', label: 'Legs Option 1' },
      { src: '/images/foot2.webp', label: 'Legs Option 2' },
    ],
    tail: [
      { src: '/images/tail.webp', label: 'Tail Option 1' },
      { src: '/images/tail2.webp', label: 'Tail Option 2' },
    ],
  };

  // Index state
  protected activePartIdx = signal(0);
  protected optionIndexByPart = signal<Record<PartKey, number>>(
    this.parts.reduce((acc, p) => { acc[p.key] = 0; return acc; }, {} as Record<PartKey, number>)
  );

  // Derived current part and option
  protected currentPart = computed(() => this.parts[this.activePartIdx()]);
  protected currentOptions = computed(() => this.options[this.currentPart().key]);
  protected currentOption = computed(() => {
    const key = this.currentPart().key;
    const idx = this.optionIndexByPart()[key] ?? 0;
    const list = this.currentOptions();
    return list[(idx + list.length) % list.length];
  });

  // Pointer swipe handling (top and bottom panels)
  private topStartX: number | null = null;
  private bottomStartX: number | null = null;
  protected topDragX = signal(0);
  protected bottomDragX = signal(0);
  protected topDragging = signal(false);
  protected bottomDragging = signal(false);

  onTopPointerDown(ev: PointerEvent) {
  ev.stopPropagation();
  this.topStartX = ev.clientX;
    this.topDragging.set(true);
    this.topDragX.set(0);
    (ev.currentTarget as HTMLElement)?.setPointerCapture?.(ev.pointerId);
  }
  onTopPointerMove(ev: PointerEvent) {
  ev.stopPropagation();
  if (this.topStartX == null) return;
    const dx = ev.clientX - this.topStartX;
    this.topDragX.set(dx);
  }
  onTopPointerUp(ev: PointerEvent) {
  ev.stopPropagation();
  if (this.topStartX == null) return;
    const dx = ev.clientX - this.topStartX;
    this.topStartX = null;
    const threshold = 60; // px
    if (dx > threshold) {
      this.prevPart();
    } else if (dx < -threshold) {
      this.nextPart();
    }
    this.topDragX.set(0);
    this.topDragging.set(false);
    (ev.currentTarget as HTMLElement)?.releasePointerCapture?.(ev.pointerId);
  }
  onTopPointerCancel(ev: PointerEvent) {
  ev.stopPropagation();
    this.topStartX = null;
    this.topDragX.set(0);
    this.topDragging.set(false);
  }

  onBottomPointerDown(ev: PointerEvent) {
  ev.stopPropagation();
  this.bottomStartX = ev.clientX;
    this.bottomDragging.set(true);
    this.bottomDragX.set(0);
    (ev.currentTarget as HTMLElement)?.setPointerCapture?.(ev.pointerId);
  }
  onBottomPointerMove(ev: PointerEvent) {
  ev.stopPropagation();
  if (this.bottomStartX == null) return;
    const dx = ev.clientX - this.bottomStartX;
    this.bottomDragX.set(dx);
  }
  onBottomPointerUp(ev: PointerEvent) {
  ev.stopPropagation();
  if (this.bottomStartX == null) return;
    const dx = ev.clientX - this.bottomStartX;
    this.bottomStartX = null;
    const threshold = 60;
    if (dx > threshold) {
      this.prevOption();
    } else if (dx < -threshold) {
      this.nextOption();
    }
    this.bottomDragX.set(0);
    this.bottomDragging.set(false);
    (ev.currentTarget as HTMLElement)?.releasePointerCapture?.(ev.pointerId);
  }
  onBottomPointerCancel(ev: PointerEvent) {
  ev.stopPropagation();
    this.bottomStartX = null;
    this.bottomDragX.set(0);
    this.bottomDragging.set(false);
  }

  private nextPart() {
    const next = (this.activePartIdx() + 1) % this.parts.length;
    this.activePartIdx.set(next);
  }
  private prevPart() {
    const prev = (this.activePartIdx() - 1 + this.parts.length) % this.parts.length;
    this.activePartIdx.set(prev);
  }
  private nextOption() {
    const key = this.currentPart().key;
    const list = this.options[key];
    const idx = (this.optionIndexByPart()[key] ?? 0) + 1;
    this.optionIndexByPart.update(m => ({...m, [key]: idx % list.length}));
  }
  private prevOption() {
    const key = this.currentPart().key;
    const list = this.options[key];
    const len = list.length;
    const idx = (this.optionIndexByPart()[key] ?? 0) - 1;
    this.optionIndexByPart.update(m => ({...m, [key]: (idx + len) % len}));
  }
}
