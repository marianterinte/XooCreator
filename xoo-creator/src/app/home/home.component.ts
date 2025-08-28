import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  // Hybrid images list from public/images/animals/hybrids
  readonly hybrids = [
    { src: 'images/animals/hybrids/hybrid-elephant-fox.jpg', name: 'EleVulpoiul' },
    { src: 'images/animals/hybrids/hybrid-giraffe_cat.jpg', name: 'GiraPisica' },
    { src: 'images/animals/hybrids/hybrid-rabbit-girafe.jpg', name: 'IepuGiraful' },
    { src: 'images/animals/hybrids/hybrid_bunny_cat.jpg', name: 'IepuMiau' },
    { src: 'images/animals/hybrids/hybrid_cat-bunny.jpg', name: 'Matzo-Iepurele' },
    { src: 'images/animals/hybrids/hybrid_duckfox.jpg', name: 'RațVulpoiul' },
    { src: 'images/animals/hybrids/hybrid_giraffe-cat.jpg', name: 'GiraMiau' }
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

  // HERO carousel
  heroSlides = [
    {
      key: 'mod1',
  title: 'Creează doar de distracție',
  text: 'Combină părți, vezi instant rezultatul și salvează preferatele în Bestiarul tău.',
      targetId: 'mod1-section'
    },
    {
      key: 'mod2',
  title: 'Vrei să știi ce fel de animal ești? :)',
      text: 'Strânge indicii din creațiile tale și deblochează Animalul Interior.',
      targetId: 'mod2-section'
    },
  //   {
  //     key: 'tree',
  // title: 'Copacul Imaginației',
  // text: 'Fiecare creatură salvată devine o frunză luminoasă în Copacul tău.',
  //     targetId: 'tree-section'
  //   }
  ];
  heroIndex = signal(0);

  goToHeroSlide(i: number) {
    const n = this.heroSlides.length;
    const idx = ((i % n) + n) % n;
    this.heroIndex.set(idx);
  }

  scrollToTarget(id: string) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  activateAndScroll(i: number, id: string) {
    this.goToHeroSlide(i);
    // allow DOM to update visibility before scrolling
    setTimeout(() => this.scrollToTarget(id), 50);
  }
}
