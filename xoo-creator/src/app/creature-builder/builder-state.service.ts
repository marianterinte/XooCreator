import { Injectable } from '@angular/core';
import { PersistenceService, BuilderConfig } from '../services/persistence.service';
import { CreditsService } from '../services/credits.service';
import { AnimalOption, PartDef, PartKey } from './builder-types';

export interface BuilderInitResult {
  assignments: Record<PartKey, number>;
  activePartIdx: number;
  showTutorial: boolean;
}

@Injectable({ providedIn: 'root' })
export class BuilderStateService {
  private readonly TUTORIAL_KEY = 'xoo.tutorial.seen.v1';

  constructor(
    private readonly store: PersistenceService,
    private readonly credits: CreditsService,
  ) {}

  loadOrInit(parts: ReadonlyArray<PartDef>, animals: ReadonlyArray<AnimalOption>, baseUnlockedAnimalCount: number): BuilderInitResult {
    const empty: Record<PartKey, number> = parts.reduce((acc, p) => {
      (acc as any)[p.key] = 0; return acc;
    }, {} as Record<PartKey, number>);

    const cfg = this.store.load();
    let assignments = { ...empty };
    let activePartIdx = 0;

    if (cfg?.assignments) {
      // Normalize/defend against unknown keys
      for (const p of parts) {
        const n = cfg.assignments[p.key];
        const candidate = typeof n === 'number' ? n : Math.floor(Math.random() * Math.max(1, animals.length));
        assignments[p.key] = this.clamp(candidate, animals.length);
      }
      if (cfg.activePartKey) {
        const found = parts.findIndex(p => p.key === cfg.activePartKey);
        if (found >= 0) activePartIdx = found;
      }
    } else {
      // Randomize each part using supported animals; prefer unlocked-supported
      const unlockedCap = this.credits.hasEverToppedUp() ? animals.length : baseUnlockedAnimalCount;
      for (const p of parts) {
        const supported = animals.filter(a => a.supports.has(p.key));
        const unlockedSupported = supported.filter(a => animals.indexOf(a) < unlockedCap);
        const pool = unlockedSupported.length ? unlockedSupported : supported.length ? supported : animals;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        assignments[p.key] = Math.max(0, animals.indexOf(pick));
      }
      // Persist initial state
      this.persist(assignments, parts[activePartIdx]?.key ?? parts[0].key);
    }

    const showTutorial = !this.getTutorialSeen();

    return { assignments, activePartIdx, showTutorial };
  }

  persist(assignments: Record<PartKey, number>, activePartKey: PartKey) {
    const cfg: BuilderConfig = {
      assignments: { ...assignments },
      activePartKey,
      updatedAt: Date.now(),
    };
    this.store.save(cfg);
  }

  markTutorialSeen() {
    try { localStorage.setItem(this.TUTORIAL_KEY, '1'); } catch { /* ignore */ }
  }

  private getTutorialSeen(): boolean {
    try { return !!localStorage.getItem(this.TUTORIAL_KEY); } catch { return true; }
  }

  private clamp(i: number, n: number) { return ((i % n) + n) % n; }
}
