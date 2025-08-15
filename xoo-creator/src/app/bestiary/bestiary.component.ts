import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-bestiary',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './bestiary.component.html',
  styleUrl: './bestiary.component.css'
})
export class BestiaryComponent {}
