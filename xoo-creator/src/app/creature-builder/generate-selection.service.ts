import { Injectable } from '@angular/core';
import { PartDef, PartKey } from './builder-types';

export type Assignments = Partial<Record<PartKey, number>>;

@Injectable({ providedIn: 'root' })
export class GenerateSelectionService {
  initSelection(
    parts: ReadonlyArray<PartDef>,
    assignments: Assignments,
    isPartLocked: (key: PartKey) => boolean,
    isAnimalLocked: (index: number) => boolean
  ): Record<PartKey, boolean> {
    const sel: Record<PartKey, boolean> = {} as any;
    for (const p of parts) {
      const idx = assignments[p.key] ?? 0;
      const eligible = !isPartLocked(p.key) && !isAnimalLocked(idx);
      (sel as any)[p.key] = eligible;
    }
    return sel;
  }

  toggle(
    current: Record<PartKey, boolean>,
    key: PartKey,
    minSelected = 2
  ): Record<PartKey, boolean> {
    const sel = { ...current } as Record<PartKey, boolean>;
    const isOn = !!sel[key];
    if (isOn) {
      const count = this.countSelected(sel);
      if (count <= minSelected) return sel; // enforce minimum
      sel[key] = false;
    } else {
      sel[key] = true;
    }
    return sel;
  }

  countSelected(sel: Record<PartKey, boolean>): number {
    return Object.values(sel).filter(Boolean).length;
  }

  isRowDisabled(
    part: PartDef,
    assignments: Assignments,
    isPartLocked: (key: PartKey) => boolean,
    isAnimalLocked: (index: number) => boolean
  ): boolean {
    const idx = assignments[part.key] ?? 0;
    return isPartLocked(part.key) || isAnimalLocked(idx);
  }

  buildFinalAssignments(
    parts: ReadonlyArray<PartDef>,
    selection: Record<PartKey, boolean>,
    assignments: Assignments,
    isPartLocked: (key: PartKey) => boolean,
    isAnimalLocked: (index: number) => boolean
  ): Assignments {
    const out: Assignments = {};
    for (const p of parts) {
      if (!selection[p.key]) continue;
      if (isPartLocked(p.key)) continue;
      const idx = assignments[p.key] ?? 0;
      if (isAnimalLocked(idx)) continue;
      out[p.key] = idx;
    }
    return out;
  }
}
