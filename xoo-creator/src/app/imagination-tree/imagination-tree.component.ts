import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-imagination-tree',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './imagination-tree.component.html',
  styleUrl: './imagination-tree.component.css'
})
export class ImaginationTreeComponent {}
