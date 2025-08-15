import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CreditsService } from '../services/credits.service';

@Component({
  selector: 'app-unlock',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section style="display:grid;place-items:center;height:100dvh;padding:16px;text-align:center">
      <div style="max-width:520px">
        <h1 style="margin:0 0 8px 0">Unlock content</h1>
        <p style="margin:0 0 16px 0;color:#555">Cumpără credite pentru a debloca animalele și părțile corpului premium.</p>
        <p style="margin:0 0 12px;color:#111;font-weight:600">Credite disponibile: {{ credits.credits() }}</p>
        <div style="display:grid;grid-template-columns:1fr;gap:8px;justify-items:stretch">
          <button (click)="add(10)" style="padding:12px 14px;border:none;border-radius:12px;background:#4F46E5;color:#fff">10 credite — 0,50€ (0,05€/credit)</button>
          <button (click)="add(20)" style="padding:12px 14px;border:none;border-radius:12px;background:#4F46E5;color:#fff">20 credite — 1,00€ (0,05€/credit)</button>
          <button (click)="add(50)" style="padding:12px 14px;border:none;border-radius:12px;background:#4338CA;color:#fff">50 credite — 2,00€ (0,04€/credit)</button>
          <button (click)="add(100)" style="padding:12px 14px;border:none;border-radius:12px;background:#3730A3;color:#fff">100 credite — 3,50€ (0,035€/credit)</button>
          <button (click)="add(500)" style="padding:12px 14px;border:none;border-radius:12px;background:#111827;color:#fff">500 credite — 11,00€ (0,022€/credit)</button>
        </div>
        <button (click)="add(5)" style="margin-top:12px;padding:10px 14px;border:none;border-radius:10px;background:#059669;color:#fff">Simulează +5 credite</button>
        <a routerLink="/builder" style="display:inline-block;margin-top:16px;color:#4F46E5;text-decoration:none">Înapoi la builder</a>
      </div>
    </section>
  `,
})
export class UnlockComponent {
  constructor(public credits: CreditsService) {}
  add(n: number) { this.credits.addCredits(n); }
}
