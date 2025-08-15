import { Component, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { PersistenceService, BuilderConfig } from '../services/persistence.service';
import { CreditsService } from '../services/credits.service';
import { Router } from '@angular/router';

// Types
type PartKey = 'head' | 'body' | 'arms' | 'legs' | 'tail' | 'wings' | 'horn' | 'horns';
type PartDef = { key: PartKey; name: string; image: string };
type AnimalOption = { src: string; label: string; supports: ReadonlySet<PartKey> };

// Base parts all animals support by default
const BASE_PARTS: ReadonlyArray<PartKey> = ['head', 'body', 'arms', 'legs', 'tail'] as const;
const S = (arr: readonly PartKey[]) => new Set(arr as PartKey[]);

@Component({
  selector: 'app-creature-builder',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './creature-builder.component.html',
  styleUrl: './creature-builder.component.css'
})
export class CreatureBuilderComponent {

  // Body parts order and mapping to representative images (cleaned to existing files)
  protected readonly parts: ReadonlyArray<PartDef> = [
    { key: 'head', name: 'Head', image: '/images/bodyparts/face.webp' },
    { key: 'body', name: 'Body', image: '/images/bodyparts/body.webp' },
  { key: 'arms', name: 'Arms', image: '/images/bodyparts/hands.webp' },
  { key: 'legs', name: 'Legs', image: '/images/bodyparts/legs.webp' },
    { key: 'tail', name: 'Tail', image: '/images/bodyparts/tail.webp' },
  { key: 'wings', name: 'Wings', image: '/images/bodyparts/wings.webp' },
  { key: 'horn', name: 'Horn', image: '/images/bodyparts/horn.webp' },
  { key: 'horns', name: 'Horns', image: '/images/bodyparts/horns.webp' },
  ] as const;

  // Animal options (thumbnails + big image) from /images/animals/base
  protected readonly animals: ReadonlyArray<AnimalOption> = [
    { src: '/images/animals/base/bunny.jpg',   label: 'Bunny',    supports: S([...BASE_PARTS]) },
    { src: '/images/animals/base/cat.jpg',     label: 'Cat',      supports: S([...BASE_PARTS]) },
    { src: '/images/animals/base/giraffe.jpg', label: 'Giraffe',  supports: S([...BASE_PARTS, 'horn', 'horns']) }, // keep third
    { src: '/images/animals/base/dog.jpg',     label: 'Dog',      supports: S([...BASE_PARTS]) },
    { src: '/images/animals/base/fox.jpg',     label: 'Fox',      supports: S([...BASE_PARTS]) },
    { src: '/images/animals/base/hippo.jpg',   label: 'Hippo',    supports: S([...BASE_PARTS]) },
    { src: '/images/animals/base/monkey.jpg',  label: 'Monkey',   supports: S([...BASE_PARTS]) },
    { src: '/images/animals/base/camel.jpg',   label: 'Camel',    supports: S([...BASE_PARTS]) },
    { src: '/images/animals/base/deer.jpg',    label: 'Deer',     supports: S([...BASE_PARTS, 'horn', 'horns']) },
    { src: '/images/animals/base/duck.jpg',    label: 'Duck',     supports: S([...BASE_PARTS, 'wings']) },
    { src: '/images/animals/base/eagle.jpg',   label: 'Eagle',    supports: S([...BASE_PARTS, 'wings']) },
    { src: '/images/animals/base/elephant.jpg',label: 'Elephant', supports: S([...BASE_PARTS]) },
    { src: '/images/animals/base/ostrich.jpg', label: 'Ostrich',  supports: S([...BASE_PARTS, 'wings']) },
    { src: '/images/animals/base/parrot.jpg',  label: 'Parrot',   supports: S([...BASE_PARTS, 'wings']) },
  ] as const;

  // Lock rules: last 2 body parts locked; only first 3 animals unlocked
  private readonly baseUnlockedAnimalCount = 3;
  private readonly baseLockedParts = new Set<PartKey>(['legs', 'tail', 'wings', 'horn', 'horns']);

  // Index state
  protected activePartIdx = signal(0);
  protected activeAnimalIdx = signal(0);
  protected assignments = signal<Record<PartKey, number>>(this.parts.reduce((acc, p) => {
    (acc as any)[p.key] = 0; return acc;
  }, {} as Record<PartKey, number>));
  protected showConfirm = signal(false);
  protected showExitConfirm = signal(false);
  protected showHelp = signal(false);
  protected readonly generateCost = 1; // 1 credit per image
  // Selection state for Generate modal (per-part)
  protected generateSelection = signal<Record<PartKey, boolean>>({
    head: false,
    body: false,
    arms: false,
    legs: false,
    tail: false,
    wings: false,
    horn: false,
    horns: false,
  });

  // Generation/result flow state
  protected showResult = signal(false);
  protected genInProgress = signal(false);
  protected genProgress = signal(0);
  protected genMessage = signal('');
  protected resultImage = signal<string>('');
  protected resultName = signal<string>('Hybrid');
  protected resultFlipped = signal(false);
  private genTimer: any = null;

  // Derived current entities
  protected currentPart = computed(() => this.parts[this.activePartIdx()]);
  protected currentAnimal = computed(() => this.animals[(this.activeAnimalIdx() + this.animals.length) % this.animals.length]);
  protected isCurrentLocked = computed(() => this.isPartLocked(this.currentPart().key) || this.isAnimalLocked(this.activeAnimalIdx()));

  // Animals filtered by support for the currently selected body part
  protected animalsForCurrentPart = computed(() => {
    const part = this.currentPart().key;
    return this.animals.filter(a => a.supports.has(part));
  });

  // Parts to include in the Generate summary: exclude locked parts and parts assigned to locked animals
  protected partsForGenerate = computed(() =>
    this.parts.filter(p => !this.isPartLocked(p.key) && !this.isAnimalLocked(this.assignments()[p.key] ?? 0))
  );

  constructor(private readonly store: PersistenceService, private readonly router: Router, private readonly credits: CreditsService) {
    // Load config or randomize on first visit
    const cfg = this.store.load();
    if (cfg?.assignments) {
      // Map unknown keys defensively
      const m: Record<PartKey, number> = this.parts.reduce((acc, p) => { (acc as any)[p.key] = 0; return acc; }, {} as Record<PartKey, number>);
      for (const p of this.parts) {
        const n = cfg.assignments[p.key] ?? Math.floor(Math.random() * this.animals.length);
        m[p.key] = this.clampAnimalIndex(n);
      }
      this.assignments.set(m);
      if (cfg.activePartKey) {
        const idx = this.parts.findIndex(p => p.key === cfg.activePartKey);
        if (idx >= 0) this.activePartIdx.set(idx);
      }
      // Ensure current part uses a supported animal
      this.syncActiveAnimalToCurrentPart(true);
    } else {
      // Randomize each part once using supported (prefer unlocked) animals
      const m: Record<PartKey, number> = this.parts.reduce((acc, p) => { (acc as any)[p.key] = 0; return acc; }, {} as Record<PartKey, number>);
      for (const p of this.parts) {
        const supported = this.animals.filter(a => a.supports.has(p.key));
  const unlockedCap = this.credits.hasEverToppedUp() ? this.animals.length : this.baseUnlockedAnimalCount;
  const unlockedSupported = supported.filter(a => this.animals.indexOf(a) < unlockedCap);
        const pool = unlockedSupported.length ? unlockedSupported : supported;
        const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : this.animals[0];
        m[p.key] = this.animals.indexOf(pick);
      }
      this.assignments.set(m);
      this.syncActiveAnimalToCurrentPart(true);
      this.persist();
    }

    // Tutorial popup on first visit
    try {
      const seen = localStorage.getItem('xoo.tutorial.seen.v1');
      if (!seen) this.showHelp.set(true);
    } catch { /* ignore */ }
  }

  // Expose credits count for template
  get creditsLeft() { return this.credits.credits(); }

  private persist() {
    const cfg: BuilderConfig = {
      assignments: { ...this.assignments() },
      activePartKey: this.currentPart().key,
      updatedAt: Date.now(),
    };
    this.store.save(cfg);
  }

  private randAnimalIndex(unlockedOnly = false) {
    const max = unlockedOnly ? (this.credits.hasEverToppedUp() ? this.animals.length : this.baseUnlockedAnimalCount) : this.animals.length;
    return Math.floor(Math.random() * Math.max(1, max));
  }
  private clampAnimalIndex(i: number) { const n = this.animals.length; return ((i % n) + n) % n; }
  private clampIndex(i: number, n: number) { return ((i % n) + n) % n; }
  private syncActiveAnimalToCurrentPart(updateAssignment = false) {
    const key = this.currentPart().key;
    let idx = this.assignments()[key] ?? 0;
    idx = this.clampAnimalIndex(idx);

    const current = this.animals[idx];
    const supported = current?.supports.has(key);
    if (!supported) {
      const filtered = this.animalsForCurrentPart();
      if (filtered.length > 0) {
        const fallbackGlobal = this.animals.indexOf(filtered[0]);
        idx = fallbackGlobal >= 0 ? fallbackGlobal : 0;
      } else {
        idx = 0;
      }
      if (updateAssignment) {
        this.assignments.update(m => ({ ...m, [key]: idx }));
      }
    }
    this.activeAnimalIdx.set(idx);
  }

  protected isPartLocked(key: PartKey) {
    return this.credits.hasEverToppedUp() ? false : this.baseLockedParts.has(key);
  }
  protected isAnimalLocked(index: number) {
    if (this.credits.hasEverToppedUp()) return false;
    const unlockedAnimalCount = this.baseUnlockedAnimalCount;
    return index >= unlockedAnimalCount;
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
    this.syncActiveAnimalToCurrentPart(true);
    this.persist();
  }
  // index is position inside filtered list for current part
  selectAnimal(index: number) {
    const filtered = this.animalsForCurrentPart();
    if (filtered.length === 0) return;
    const i = this.clampIndex(index, filtered.length);
    const selected = filtered[i];
    const globalIdx = this.animals.indexOf(selected);
    if (globalIdx < 0) return;

    this.activeAnimalIdx.set(globalIdx);
    // Update assignment for current part
    const key = this.currentPart().key;
    this.assignments.update(m => ({ ...m, [key]: globalIdx }));
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
    const filtered = this.animalsForCurrentPart();
    const n = filtered.length;
    if (n === 0) return;

    const currentGlobal = this.activeAnimalIdx();
    const curPos = Math.max(0, filtered.findIndex(a => this.animals.indexOf(a) === currentGlobal));
    const nextPos = (curPos + 1) % n;
    const nextAnimal = filtered[nextPos];
    const globalIdx = this.animals.indexOf(nextAnimal);

    this.activeAnimalIdx.set(globalIdx);
    const key = this.currentPart().key;
    this.assignments.update(m => ({ ...m, [key]: globalIdx }));
    this.persist();
  }
  private prevAnimal() {
    const filtered = this.animalsForCurrentPart();
    const n = filtered.length;
    if (n === 0) return;

    const currentGlobal = this.activeAnimalIdx();
    const curPos = Math.max(0, filtered.findIndex(a => this.animals.indexOf(a) === currentGlobal));
    const prevPos = (curPos - 1 + n) % n;
    const prevAnimal = filtered[prevPos];
    const globalIdx = this.animals.indexOf(prevAnimal);

    this.activeAnimalIdx.set(globalIdx);
    const key = this.currentPart().key;
    this.assignments.update(m => ({ ...m, [key]: globalIdx }));
    this.persist();
  }

  // Helpers for template
  protected getGlobalIndex(a: AnimalOption) { return this.animals.indexOf(a); }
  protected isActiveAnimal(a: AnimalOption) { return this.getGlobalIndex(a) === this.activeAnimalIdx(); }

  // Modal actions
  confirmGenerate() {
    // Initialize selection: default select all eligible (unlocked) parts
    const sel: Record<PartKey, boolean> = this.parts.reduce((acc, p) => {
      const eligible = !this.isPartLocked(p.key) && !this.isAnimalLocked(this.assignments()[p.key] ?? 0);
      (acc as any)[p.key] = eligible;
      return acc;
    }, {} as Record<PartKey, boolean>);
    this.generateSelection.set(sel);
    this.showConfirm.set(true);
  }
  cancelGenerate() { this.showConfirm.set(false); }
  proceedGenerate() {
    // Build final config including only unlocked parts mapped to unlocked animals
    const finalAssignments: Partial<Record<PartKey, number>> = {};
    const sel = this.generateSelection();
    for (const p of this.parts) {
      if (!sel[p.key]) continue; // only selected
      if (this.isPartLocked(p.key)) continue;
      const idx = this.assignments()[p.key] ?? 0;
      if (this.isAnimalLocked(idx)) continue;
      finalAssignments[p.key] = idx;
    }
    // Try spend credits
    const ok = this.credits.trySpend(this.generateCost);
    if (!ok) {
      // Not enough credits -> send to unlock page
      this.showConfirm.set(false);
      this.router.navigateByUrl('/unlock');
      return;
    }
    // Persist last generated config separately (does not overwrite working assignments)
    try {
      localStorage.setItem('xoo.builder.lastGenerated.v1', JSON.stringify({
        assignments: finalAssignments,
        generatedAt: Date.now(),
      }));
    } catch { /* ignore */ }
  this.showConfirm.set(false);
  this.startGenerationFlow();
  }

  // Toggle selection for a part inside the confirmation modal, enforcing minimum 2 selected
  protected toggleGeneratePart(key: PartKey) {
    const sel = { ...this.generateSelection() };
    const current = !!sel[key];
    if (current) {
      // Count currently selected items
      const count = Object.values(sel).filter(Boolean).length;
      if (count <= 2) return; // enforce minimum 2
      sel[key] = false;
    } else {
      sel[key] = true;
    }
    this.generateSelection.set(sel);
  }

  protected selectedCount() {
    return Object.values(this.generateSelection()).filter(Boolean).length;
  }

  // Whether a part row should be disabled in the generate modal (locked part or locked animal assignment)
  protected isGenerateDisabled(p: PartDef): boolean {
    const idx = this.assignments()[p.key] ?? 0;
    return this.isPartLocked(p.key) || this.isAnimalLocked(idx);
  }

  private startGenerationFlow() {
    // Reset state
    this.showResult.set(true);
    this.genInProgress.set(true);
    this.genProgress.set(0);
    this.genMessage.set('Pregătim magia...');
    this.resultFlipped.set(false);
    // Simulate progress with playful steps
    const steps = [
      { d: 400, m: 'Amestecăm ADN-ul...' },
      { d: 500, m: 'Potrivim părțile...' },
      { d: 450, m: 'Adăugăm scântei de imaginație ✨' },
      { d: 550, m: 'Quasi-hiper sinteză...' },
      { d: 500, m: 'Ultimele retușuri...' },
    ];
    let i = 0;
    const total = steps.length;
    const tick = () => {
      if (i < total) {
        const pct = Math.min(100, Math.floor(((i + 1) / total) * 100));
        this.genProgress.set(pct);
        this.genMessage.set(steps[i].m);
        const delay = steps[i].d;
        i++;
        this.genTimer = setTimeout(tick, delay);
      } else {
        // Done: show result
        this.finishGeneration();
      }
    };
    tick();
  }

  private finishGeneration() {
    if (this.genTimer) { clearTimeout(this.genTimer); this.genTimer = null; }
    this.genProgress.set(100);
    this.genInProgress.set(false);
    // For now, use a placeholder hybrid image
    this.resultImage.set('/images/animals/hybrids/hybrid_duckfox.jpg');
    // Simple derived name from two selected animals could be added; for now keep generic
    this.resultName.set('Hybrid');
  }

  protected flipResultCard() {
    this.resultFlipped.set(!this.resultFlipped());
  }

  // Exit/back flow
  openExitConfirm() { this.showExitConfirm.set(true); }
  cancelExit() { this.showExitConfirm.set(false); }
  async proceedExit() {
    this.store.clear();
    this.showExitConfirm.set(false);
    await this.router.navigateByUrl('/');
  }

  goToUnlock() {
    this.router.navigateByUrl('/unlock');
  }

  // Help modal
  openHelp(){ this.showHelp.set(true); }
  closeHelp(){
    try { localStorage.setItem('xoo.tutorial.seen.v1', '1'); } catch { /* ignore */ }
    this.showHelp.set(false);
  }
}
