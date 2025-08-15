import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CreatureBuilderComponent } from './creature-builder/creature-builder.component';
import { UnlockComponent } from './unlock/unlock.component';
import { JournalComponent } from './journal/journal.component';
import { MapComponent } from './map/map.component';
import { ProgressComponent } from './progress/progress.component';
import { BestiaryComponent } from './bestiary/bestiary.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Imagination Zoo — Acasă' },
  { path: 'builder', component: CreatureBuilderComponent, title: 'Imagination Zoo — Creează' },
  { path: 'unlock', component: UnlockComponent, title: 'Imagination Zoo — Unlock' },
  { path: 'journal', component: JournalComponent, title: 'Imagination Zoo — Jurnalul Meu' },
  { path: 'map', component: MapComponent, title: 'Imagination Zoo — Harta Lumii' },
  { path: 'progress', component: ProgressComponent, title: 'Imagination Zoo — Progres' },
  { path: 'bestiary', component: BestiaryComponent, title: 'Imagination Zoo — Bestiar' },
  { path: '**', redirectTo: '' },
];
