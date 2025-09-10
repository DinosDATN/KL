import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-documents-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './documents-pagination.component.html',
  styleUrl: './documents-pagination.component.css'
})
export class DocumentsPaginationComponent {
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() itemsPerPage: number = 9;
  @Input() totalItems: number = 0;
  
  @Output() pageChange = new EventEmitter<number>();
  @Output() itemsPerPageChange = new EventEmitter<number>();
  
  itemsPerPageOptions = [6, 8, 9, 10, 12];
  
  Math = Math;
  
  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.pageChange.emit(page);
    }
  }
  
  onItemsPerPageChange(newItemsPerPage: number): void {
    this.itemsPerPageChange.emit(newItemsPerPage);
  }
  
  getVisiblePages(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push(-1); // Ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push(-1); // Ellipsis
        for (let i = this.currentPage - 1; i <= this.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push(-2); // Ellipsis
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }
  
  get startItem(): number {
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }
  
  get endItem(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }
}
