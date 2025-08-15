import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CreatureBuilderComponent } from './creature-builder/creature-builder.component';
import { UnlockComponent } from './unlock/unlock.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Xoo Creator — Acasă' },
  { path: 'builder', component: CreatureBuilderComponent, title: 'Xoo Creator — Creează animăluț' },
  { path: 'unlock', component: UnlockComponent, title: 'Xoo Creator — Unlock' },
  { path: '**', redirectTo: '' },
];
