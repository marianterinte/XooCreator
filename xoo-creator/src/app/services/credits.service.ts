import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CreditsService {
  private readonly key = 'xoo.credits.v1';
  private readonly everKey = 'xoo.credits.ever.v1';
  private readonly _credits = signal<number>(0);
  private readonly _ever = signal<boolean>(false);

  constructor() { this.load(); }

  credits() { return this._credits(); }
  hasEverToppedUp() { return this._ever(); }

  addCredits(n: number) {
    n = Math.max(0, Math.floor(n));
    if (n <= 0) return;
    const next = Math.max(0, this._credits() + n);
    this._credits.set(next);
    if (!this._ever()) this._ever.set(true);
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
    try {
      localStorage.setItem(this.key, String(this._credits()));
      localStorage.setItem(this.everKey, this._ever() ? '1' : '0');
    } catch { /* ignore */ }
  }
  private load() {
    try {
      const raw = localStorage.getItem(this.key);
      const val = raw != null ? parseInt(raw, 10) : 0;
      const everRaw = localStorage.getItem(this.everKey);
      const ever = everRaw === '1';
      this._credits.set(Number.isFinite(val) ? val : 0);
      // Do NOT infer purchase from credits; keep this separate as requested
      this._ever.set(ever);
    } catch {
      this._credits.set(0);
      this._ever.set(false);
    }
  }
}
