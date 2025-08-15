import { Component, computed, signal } from '@angular/core';
import { NgFor } from '@angular/common';
import { PersistenceService, BuilderConfig } from '../services/persistence.service';

// Types
type PartKey = 'head' | 'body' | 'arms' | 'legs' | 'tail';
type PartDef = { key: PartKey; name: string; image: string };
type AnimalOption = { src: string; label: string };

@Component({
  selector: 'app-creature-builder',
  standalone: true,
  imports: [NgFor],
  templateUrl: './creature-builder.component.html',
  styleUrl: './creature-builder.component.css'
})
export class CreatureBuilderComponent {

  // Body parts order and mapping to representative images (cleaned to existing files)
  protected readonly parts: ReadonlyArray<PartDef> = [
    { key: 'head', name: 'Head', image: '/images/bodyparts/face.webp' },
    { key: 'body', name: 'Body', image: '/images/bodyparts/body.webp' },
    { key: 'arms', name: 'Arms', image: '/images/bodyparts/hand.webp' },
    { key: 'legs', name: 'Legs', image: '/images/bodyparts/foot.webp' },
    { key: 'tail', name: 'Tail', image: '/images/bodyparts/tail.webp' },
  ] as const;

  // Animal options (thumbnails + big image)
  protected readonly animals: ReadonlyArray<AnimalOption> = [
    { src: '/images/animals/fox.png', label: 'Fox' },
    { src: '/images/animals/lion.png', label: 'Lion' },
    { src: '/images/animals/squirel.jpg', label: 'Squirrel' },
  ] as const;

  // Index state
  protected activePartIdx = signal(0);
  protected activeAnimalIdx = signal(0);
  protected assignments = signal<Record<PartKey, number>>({ head: 0, body: 0, arms: 0, legs: 0, tail: 0 });
  protected showConfirm = signal(false);

  // Derived current entities
  protected currentPart = computed(() => this.parts[this.activePartIdx()]);
  protected currentAnimal = computed(() => this.animals[(this.activeAnimalIdx() + this.animals.length) % this.animals.length]);

  constructor(private readonly store: PersistenceService) {
    // Load config or randomize on first visit
    const cfg = this.store.load();
    if (cfg?.assignments) {
      // Map unknown keys defensively
      const m: Record<PartKey, number> = { head: 0, body: 0, arms: 0, legs: 0, tail: 0 };
      for (const p of this.parts) {
        const n = cfg.assignments[p.key] ?? Math.floor(Math.random() * this.animals.length);
        m[p.key] = this.clampAnimalIndex(n);
      }
      this.assignments.set(m);
      if (cfg.activePartKey) {
        const idx = this.parts.findIndex(p => p.key === cfg.activePartKey);
        if (idx >= 0) this.activePartIdx.set(idx);
      }
      // active animal mirrors assignment of current part
      this.syncActiveAnimalToCurrentPart();
    } else {
      // Randomize each part once
      const m: Record<PartKey, number> = { head: 0, body: 0, arms: 0, legs: 0, tail: 0 };
      for (const p of this.parts) m[p.key] = this.randAnimalIndex();
      this.assignments.set(m);
      this.syncActiveAnimalToCurrentPart();
      this.persist();
    }
  }

  private persist() {
    const cfg: BuilderConfig = {
      assignments: { ...this.assignments() },
      activePartKey: this.currentPart().key,
      updatedAt: Date.now(),
    };
    this.store.save(cfg);
  }

  private randAnimalIndex() { return Math.floor(Math.random() * this.animals.length); }
  private clampAnimalIndex(i: number) { const n = this.animals.length; return ((i % n) + n) % n; }
  private syncActiveAnimalToCurrentPart() {
    const idx = this.assignments()[this.currentPart().key] ?? 0;
    this.activeAnimalIdx.set(this.clampAnimalIndex(idx));
  }

  // Pointer swipe handling (top=parts, bottom=animals)
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
      this.prevAnimal();
    } else if (dx < -threshold) {
      this.nextAnimal();
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

  selectPart(index: number) {
    const i = (index + this.parts.length) % this.parts.length;
    this.activePartIdx.set(i);
  this.syncActiveAnimalToCurrentPart();
  this.persist();
  }
  selectAnimal(index: number) {
    const i = (index + this.animals.length) % this.animals.length;
    this.activeAnimalIdx.set(i);
  // Update assignment for current part
  const key = this.currentPart().key;
  this.assignments.update(m => ({ ...m, [key]: i }));
  this.persist();
  }

  private nextPart() {
    const next = (this.activePartIdx() + 1) % this.parts.length;
    this.activePartIdx.set(next);
    this.syncActiveAnimalToCurrentPart();
    this.persist();
  }
  private prevPart() {
    const prev = (this.activePartIdx() - 1 + this.parts.length) % this.parts.length;
    this.activePartIdx.set(prev);
    this.syncActiveAnimalToCurrentPart();
    this.persist();
  }
  private nextAnimal() {
    const next = (this.activeAnimalIdx() + 1) % this.animals.length;
    this.activeAnimalIdx.set(next);
    const key = this.currentPart().key;
    this.assignments.update(m => ({ ...m, [key]: next }));
    this.persist();
  }
  private prevAnimal() {
    const prev = (this.activeAnimalIdx() - 1 + this.animals.length) % this.animals.length;
    this.activeAnimalIdx.set(prev);
    const key = this.currentPart().key;
    this.assignments.update(m => ({ ...m, [key]: prev }));
    this.persist();
  }

  // Modal actions
  confirmGenerate() { this.showConfirm.set(true); }
  cancelGenerate() { this.showConfirm.set(false); }
  proceedGenerate() {
    // For now, just close the modal; hook real generation later
    this.showConfirm.set(false);
  }
}
