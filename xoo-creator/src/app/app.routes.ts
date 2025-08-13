import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { CreatureBuilderComponent } from './creature-builder/creature-builder.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Xoo Creator — Acasă' },
  { path: 'builder', component: CreatureBuilderComponent, title: 'Xoo Creator — Creează animăluț' },
  { path: '**', redirectTo: '' },
];
