import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <header style="padding:12px 16px;border-bottom:1px solid #eee">
      <strong>{{ title() }}</strong>
    </header>
    <main style="padding:16px">
      <router-outlet />
    </main>
  `,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('xoo-creator');
}
