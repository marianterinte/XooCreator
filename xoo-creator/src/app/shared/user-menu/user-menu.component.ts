import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'user-menu',
  standalone: true,
  imports: [NgIf],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.css']
})
export class UserMenuComponent {
  @Input() userName = 'Guest';
  @Input() avatarUrl: string | null = null;

  @Output() profile = new EventEmitter<void>();
  @Output() help = new EventEmitter<void>();
  @Output() settings = new EventEmitter<void>();
  @Output() imaginationTree = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  open = false;

  toggle(ev: MouseEvent) {
    ev.stopPropagation();
    this.open = !this.open;
  }

  @HostListener('document:click')
  onDocClick() {
    this.open = false;
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    this.open = false;
  }
}
