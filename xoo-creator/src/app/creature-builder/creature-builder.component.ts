import { Component, computed, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { PersistenceService, BuilderConfig } from '../services/persistence.service';
import { CreditsService } from '../services/credits.service';
import { PartKey, PartDef, AnimalOption, BASE_PARTS } from './builder-types';
import { PARTS, ANIMALS, BASE_UNLOCKED_ANIMAL_COUNT, BASE_LOCKED_PARTS } from './builder-data';
import { GenerateSelectionService } from './generate-selection.service';
import { Router } from '@angular/router';
import { GenerationFlowService } from './generation-flow.service';
import { SwipeXDirective } from './swipe-x.directive';


@Component({
  selector: 'app-creature-builder',
  standalone: true,
  imports: [NgFor, NgIf, SwipeXDirective],
  templateUrl: './creature-builder.component.html',
  styleUrl: './creature-builder.component.css'
})
export class CreatureBuilderComponent {

  // Body parts order and mapping to representative images (cleaned to existing files)
  protected readonly parts: ReadonlyArray<PartDef> = PARTS;

  // Animal options (thumbnails + big image) from /images/animals/base
  protected readonly animals: ReadonlyArray<AnimalOption> = ANIMALS;

  // Lock rules: last 2 body parts locked; only first 3 animals unlocked
  private readonly baseUnlockedAnimalCount = BASE_UNLOCKED_ANIMAL_COUNT;
  private readonly baseLockedParts = BASE_LOCKED_PARTS;

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
  protected resultStory = signal<string>('');
  protected resultFlipped = signal(false);
  private genTimer: any = null; // kept for backward-compat; will rely on service

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

  constructor(
    private readonly store: PersistenceService,
    private readonly router: Router,
    private readonly credits: CreditsService,
    private readonly genFlow: GenerationFlowService,
    private readonly genSel: GenerateSelectionService,
  ) {
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

  // Swipe handling moved to SwipeXDirective

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

  protected nextPart() {
    const next = (this.activePartIdx() + 1) % this.parts.length;
    this.activePartIdx.set(next);
    this.syncActiveAnimalToCurrentPart();
    this.persist();
  }
  protected prevPart() {
    const prev = (this.activePartIdx() - 1 + this.parts.length) % this.parts.length;
    this.activePartIdx.set(prev);
    this.syncActiveAnimalToCurrentPart();
    this.persist();
  }
  protected nextAnimal() {
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
  protected prevAnimal() {
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
    // Total ~5000ms
    this.genFlow.start({
      onStart: () => {
        this.showResult.set(true);
        this.genInProgress.set(true);
        this.genProgress.set(0);
        this.genMessage.set('Pregătim magia...');
      },
      onProgress: (pct, message) => {
        this.genProgress.set(pct);
        this.genMessage.set(message);
      },
      onComplete: () => {
        this.finishGeneration();
      }
    });
  }

  private finishGeneration() {
  this.genFlow.cancel();
    this.genProgress.set(100);
    this.genInProgress.set(false);
    // For now, use a placeholder hybrid image
    this.resultImage.set('/images/animals/hybrids/hybrid_duckfox.jpg');
  // Show image first; name and story appear on flip
  this.resultName.set('Matzo-Iepurele');
  this.resultStory.set('Născut dintr-o ploaie magică peste un câmp de lalele, Matzo-Iepurele a învățat să repare jucăriile stricându-le mai întâi „din greșeală”. Copiii vin la el să le repare bicicletele și să asculte povești amestecate cu glume. E cunoscut drept aducătorul de zâmbete.');
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
