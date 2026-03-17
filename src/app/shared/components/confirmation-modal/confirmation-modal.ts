import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirmation-modal',
  imports: [],
  templateUrl: './confirmation-modal.html',
  styleUrl: './confirmation-modal.scss',
})
export class ConfirmationModal {
  @Input() invoiceId: string = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() close =new EventEmitter<void>()
}
