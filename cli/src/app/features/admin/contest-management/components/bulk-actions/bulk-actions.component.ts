import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bulk-actions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bulk-actions.component.html',
  styleUrl: './bulk-actions.component.css',
})
export class BulkActionsComponent {
  @Input() selectedCount = 0;
  @Input() showRestoreAction = false;
  @Output() bulkAction = new EventEmitter<Partial<any>>();
  @Output() clearSelection = new EventEmitter<void>();

  onBulkAction(action: string): void {
    if (this.selectedCount === 0) return;
    this.bulkAction.emit({ action });
  }

  onClearSelection(): void {
    this.clearSelection.emit();
  }
}

