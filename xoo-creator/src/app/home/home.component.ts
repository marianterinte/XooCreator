import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgIf, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  // Hybrid images list from public/images/animals/hybrids
  readonly hybrids = [
    '/images/animals/hybrids/hybrid-elephant-fox.jpg',
    '/images/animals/hybrids/hybrid-giraffe_cat.jpg',
    '/images/animals/hybrids/hybrid-rabbit-girafe.jpg',
    '/images/animals/hybrids/hybrid_bunny_cat.jpg',
    '/images/animals/hybrids/hybrid_cat-bunny.jpg',
    '/images/animals/hybrids/hybrid_duckfox.jpg',
    '/images/animals/hybrids/hybrid_giraffe-cat.jpg'
  ];

  private intervalId: any;
  private readonly intervalMs = 2500; // 2.5s between images

  // Rotation state
  idx = signal(0);
  // swap toggles to force DOM recreation for animation
  swap = signal(true);
  currentImage = computed(() => this.hybrids[this.idx() % this.hybrids.length]);

  ngOnInit(): void {
    // start rotation
    this.intervalId = setInterval(() => {
      const next = (this.idx() + 1) % this.hybrids.length;
      this.idx.set(next);
      // flip swap to retrigger animation via *ngIf
      this.swap.set(!this.swap());
    }, this.intervalMs);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  onSignIn(): void {
    // Placeholder sign-in action; can be wired to a real auth flow later
    alert('Sign in coming soon');
  }
}
