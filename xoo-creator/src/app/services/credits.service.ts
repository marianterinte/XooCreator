import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CreditsService {
  private readonly key = 'xoo.credits.v1';
  private readonly _credits = signal<number>(0);

  constructor() {
    this.load();
  }

  credits() { return this._credits(); }

  addCredits(n: number) {
    const next = Math.max(0, this._credits() + Math.floor(n));
    this._credits.set(next);
    this.persist();
  }

  trySpend(n: number): boolean {
    n = Math.max(0, Math.floor(n));
    if (this._credits() < n) return false;
    this._credits.set(this._credits() - n);
    this.persist();
    return true;
  }

  private persist() {
    try { localStorage.setItem(this.key, String(this._credits())); } catch { /* ignore */ }
  }
  private load() {
    try {
      const raw = localStorage.getItem(this.key);
      const val = raw != null ? parseInt(raw, 10) : 0;
      this._credits.set(Number.isFinite(val) ? val : 0);
    } catch {
      this._credits.set(0);
    }
  }
}
