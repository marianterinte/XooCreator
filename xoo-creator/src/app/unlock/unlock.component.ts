import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unlock',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section style="display:grid;place-items:center;height:100dvh;padding:16px;text-align:center">
      <div style="max-width:520px">
        <h1 style="margin:0 0 8px 0">Unlock content</h1>
        <p style="margin:0 0 16px 0;color:#555">Cumpără credite pentru a debloca animalele și părțile corpului premium.</p>
        <div style="display:flex;gap:8px;justify-content:center">
          <button style="padding:10px 14px;border:none;border-radius:10px;background:#4F46E5;color:#fff">10 credite — 4.99€</button>
          <button style="padding:10px 14px;border:none;border-radius:10px;background:#111827;color:#fff">50 credite — 17.99€</button>
        </div>
        <a routerLink="/builder" style="display:inline-block;margin-top:16px;color:#4F46E5;text-decoration:none">Înapoi la builder</a>
      </div>
    </section>
  `,
})
export class UnlockComponent {}
