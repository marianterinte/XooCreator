import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-creature-builder',
  standalone: true,
  templateUrl: './creature-builder.component.html',
  styleUrl: './creature-builder.component.css'
})
export class CreatureBuilderComponent {
  // Skeleton state: selected parts (no logic yet)
  head = signal<string | null>(null);
  body = signal<string | null>(null);
  arms = signal<string | null>(null);
  legs = signal<string | null>(null);
  tail = signal<string | null>(null);
}
