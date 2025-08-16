import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'result-modal',
  standalone: true,
  imports: [NgIf],
  templateUrl: './result.modal.html',
  styleUrls: ['./result.modal.css', './modal-shared.css']
})
export class ResultModalComponent {
  @Input() open = false;
  @Input() inProgress = false;
  @Input() progress = 0;
  @Input() message = '';
  @Input() image = '';
  @Input() name = '';
  @Input() story = '';
  @Input() flipped = false;

  @Output() close = new EventEmitter<void>();
  @Output() flip = new EventEmitter<void>();
}
