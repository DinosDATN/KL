import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { AdminService } from '../../../core/services/admin.service';
import { ThemeService } from '../../../core/services/theme.service';

interface ReportType {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-user-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-reports.component.html',
  styleUrls: ['./user-reports.component.css']
})
export class UserReportsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isLoading = false;
  isGenerating = false;
  error: string | null = null;

  // Report configuration
  selectedReportType: 'comprehensive' | 'activity' | 'registration' | 'engagement' | 'performance' = 'comprehensive';
  selectedRange: '7d' | '30d' | '90d' | '1y' = '30d';
  selectedFormat: 'json' | 'csv' = 'json';
  customDateRange = false;
  startDate: string = '';
  endDate: string = '';

  // Report types
  reportTypes: ReportType[] = [];

  // Report data
  reportData: any = null;

  // Expose Math and Object for template
  Math = Math;
  Object = Object;

  constructor(
    private adminService: AdminService,
    public themeService: ThemeService
  ) {
    // Set default date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    this.endDate = endDate.toISOString().split('T')[0];
    this.startDate = startDate.toISOString().split('T')[0];
  }

  ngOnInit() {
    this.loadReportTypes();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadReportTypes() {
    this.isLoading = true;
    this.error = null;

    this.adminService.getReportTypes()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (types) => {
          this.reportTypes = types;
        },
        error: (error) => {
          console.error('Error loading report types:', error);
          this.error = error.message || 'Failed to load report types';
        }
      });
  }

  onReportTypeChange(type: string) {
    if (type === 'comprehensive' || type === 'activity' || type === 'registration' || type === 'engagement' || type === 'performance') {
      this.selectedReportType = type;
      this.reportData = null;
    }
  }

  onRangeChange(range: '7d' | '30d' | '90d' | '1y') {
    this.selectedRange = range;
    this.customDateRange = false;
    
    // Update dates based on range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    this.endDate = endDate.toISOString().split('T')[0];
    this.startDate = startDate.toISOString().split('T')[0];
    
    this.reportData = null;
  }

  onCustomDateRangeToggle() {
    this.customDateRange = !this.customDateRange;
    if (this.customDateRange) {
      this.selectedRange = '30d'; // Reset range when using custom
    }
  }

  onFormatChange(format: 'json' | 'csv') {
    this.selectedFormat = format;
  }

  generateReport() {
    if (this.customDateRange && (!this.startDate || !this.endDate)) {
      this.error = 'Please select both start and end dates for custom date range';
      return;
    }

    this.isGenerating = true;
    this.error = null;
    this.reportData = null;

    const params: any = {
      type: this.selectedReportType,
      format: this.selectedFormat
    };

    if (this.customDateRange) {
      params.startDate = this.startDate;
      params.endDate = this.endDate;
    } else {
      params.range = this.selectedRange;
    }

    this.adminService.generateUserReport(params)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isGenerating = false)
      )
      .subscribe({
        next: (data) => {
          if (this.selectedFormat === 'csv') {
            // Handle CSV download
            const blob = new Blob([data], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `user-report-${this.selectedReportType}-${Date.now()}.csv`;
            link.click();
            window.URL.revokeObjectURL(url);
          } else {
            // Handle JSON data
            this.reportData = data;
          }
        },
        error: (error) => {
          console.error('Error generating report:', error);
          this.error = error.message || 'Failed to generate report';
        }
      });
  }

  exportReport() {
    // Force export format
    const exportFormat = this.selectedFormat === 'json' ? 'csv' : 'csv';
    const params: any = {
      type: this.selectedReportType,
      format: exportFormat
    };

    if (this.customDateRange) {
      params.startDate = this.startDate;
      params.endDate = this.endDate;
    } else {
      params.range = this.selectedRange;
    }

    this.adminService.generateUserReport(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          const blob = new Blob([data], { type: exportFormat === 'csv' ? 'text/csv' : 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `user-report-${this.selectedReportType}-${Date.now()}.${exportFormat}`;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error exporting report:', error);
          this.error = error.message || 'Failed to export report';
        }
      });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatNumber(value: unknown): string {
    const num = Number(value);
    if (isNaN(num) || num === null || num === undefined) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
