import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CoursesService } from '../../../core/services/courses.service';

@Component({
  selector: 'app-bank-transfer-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './bank-transfer-info.component.html',
  styleUrls: ['./bank-transfer-info.component.css']
})
export class BankTransferInfoComponent implements OnInit {
  paymentId: number = 0;
  bankInfo: any = null;
  note: string = '';
  copied: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private coursesService: CoursesService
  ) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { bankInfo: any; note: string };
    
    if (state) {
      this.bankInfo = state.bankInfo;
      this.note = state.note;
    }
  }

  ngOnInit(): void {
    this.paymentId = +this.route.snapshot.params['id'];
    
    if (!this.bankInfo) {
      this.router.navigate(['/courses']);
    }
  }

  copyToClipboard(text: string, field: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2000);
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  goBack(): void {
    this.router.navigate(['/courses']);
  }
}
