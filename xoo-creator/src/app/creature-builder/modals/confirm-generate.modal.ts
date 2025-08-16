import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { PartDef, PartKey, AnimalOption } from '../builder-types';

@Component({
  selector: 'confirm-generate-modal',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './confirm-generate.modal.html',
  styleUrls: ['./confirm-generate.modal.css', './modal-shared.css']
})
export class ConfirmGenerateModalComponent {
  @Input() open = false;
  @Input() parts: ReadonlyArray<PartDef> = [];
  @Input() animals: ReadonlyArray<AnimalOption> = [];
  @Input() assignments: Record<PartKey, number> = {} as any;
  @Input() selection: Record<PartKey, boolean> = {} as any;
  @Input() disabledMap: Record<PartKey, boolean> = {} as any;
  @Input() generateCost = 1;
  @Input() creditsLeft = 0;

  @Output() cancel = new EventEmitter<void>();
  @Output() unlock = new EventEmitter<void>();
  @Output() proceed = new EventEmitter<void>();
  @Output() toggle = new EventEmitter<PartKey>();

  selectedCount(): number {
    return Object.values(this.selection || {}).filter(Boolean).length;
  }
}
