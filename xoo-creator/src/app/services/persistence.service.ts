import { Injectable } from '@angular/core';

export interface BuilderConfig {
  // Record of body part key -> animal index
  assignments: Record<string, number>;
  // Optional currently active part key
  activePartKey?: string;
  // Timestamp for debugging or future use
  updatedAt: number;
}

@Injectable({ providedIn: 'root' })
export class PersistenceService {
  private readonly KEY = 'xoo.builder.config.v1';

  load(): BuilderConfig | null {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as BuilderConfig;
      if (!parsed || typeof parsed !== 'object' || !parsed.assignments) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  save(config: BuilderConfig): void {
    try {
      const withTs: BuilderConfig = { ...config, updatedAt: Date.now() };
      localStorage.setItem(this.KEY, JSON.stringify(withTs));
    } catch {
      // ignore write errors
    }
  }

  clear(): void {
    try { localStorage.removeItem(this.KEY); } catch { /* ignore */ }
  }
}
