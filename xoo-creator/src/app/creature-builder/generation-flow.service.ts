import { Injectable } from '@angular/core';

export type GenerationStep = { d: number; m: string };

export type GenerationFlowCallbacks = {
  onStart?: () => void;
  onProgress: (pct: number, message: string) => void;
  onComplete: () => void;
};

@Injectable({ providedIn: 'root' })
export class GenerationFlowService {
  private timer: any = null;

  private defaultSteps: GenerationStep[] = [
    { d: 900,  m: 'Amestecăm ADN-ul...' },
    { d: 1100, m: 'Potrivim părțile...' },
    { d: 900,  m: 'Adăugăm scântei de imaginație ✨' },
    { d: 1100, m: 'Quasi-hiper sinteză...' },
    { d: 1000, m: 'Ultimele retușuri...' },
  ];

  start(callbacks: GenerationFlowCallbacks, steps: GenerationStep[] = this.defaultSteps): void {
    this.cancel();
    const total = steps.length;
    let i = 0;

    callbacks.onStart?.();

    const tick = () => {
      if (i < total) {
        const pct = Math.min(100, Math.floor(((i + 1) / total) * 100));
        callbacks.onProgress(pct, steps[i].m);
        const delay = steps[i].d;
        i++;
        this.timer = setTimeout(tick, delay);
      } else {
        this.cancel();
        callbacks.onComplete();
      }
    };

    tick();
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
