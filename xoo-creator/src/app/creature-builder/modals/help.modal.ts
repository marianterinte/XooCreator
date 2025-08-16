import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'help-modal',
  standalone: true,
  templateUrl: './help.modal.html',
  styleUrls: ['./help.modal.css', './modal-shared.css']
})
export class HelpModalComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
}
