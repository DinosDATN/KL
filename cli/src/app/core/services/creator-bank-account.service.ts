import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface BankAccount {
  id?: number;
  user_id?: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  branch?: string;
  is_verified?: boolean;
  is_active?: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CreatorBankAccountService {
  private apiUrl = `${environment.apiUrl}/creator-bank-accounts`;

  constructor(private http: HttpClient) {}

  /**
   * Lấy thông tin tài khoản ngân hàng của creator hiện tại
   */
  getMyBankAccount(): Observable<BankAccount> {
    return this.http.get<ApiResponse<BankAccount>>(
      `${this.apiUrl}/my-bank-account`,
      { withCredentials: true }
    ).pipe(
      timeout(environment.apiTimeout),
      map(response => response.data!),
      catchError(error => {
        console.error('Error getting bank account:', error);
        throw error;
      })
    );
  }

  /**
   * Tạo hoặc cập nhật thông tin tài khoản ngân hàng
   */
  upsertBankAccount(bankAccount: BankAccount): Observable<ApiResponse<BankAccount>> {
    return this.http.post<ApiResponse<BankAccount>>(
      `${this.apiUrl}/my-bank-account`,
      bankAccount,
      { withCredentials: true }
    ).pipe(
      timeout(environment.apiTimeout),
      catchError(error => {
        console.error('Error upserting bank account:', error);
        throw error;
      })
    );
  }

  /**
   * Xóa tài khoản ngân hàng
   */
  deleteBankAccount(): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/my-bank-account`,
      { withCredentials: true }
    ).pipe(
      timeout(environment.apiTimeout),
      catchError(error => {
        console.error('Error deleting bank account:', error);
        throw error;
      })
    );
  }

  /**
   * Lấy thông tin tài khoản ngân hàng theo courseId (cho payment)
   */
  getBankAccountByCourse(courseId: number): Observable<any> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/courses/${courseId}/bank-account`
    ).pipe(
      timeout(environment.apiTimeout),
      map(response => response.data),
      catchError(error => {
        console.error('Error getting bank account by course:', error);
        throw error;
      })
    );
  }

  /**
   * Admin: Lấy danh sách tất cả tài khoản ngân hàng
   */
  getAllBankAccounts(filters?: { is_verified?: boolean; is_active?: boolean }): Observable<BankAccount[]> {
    let url = `${this.apiUrl}/admin/bank-accounts`;
    const params: string[] = [];
    
    if (filters?.is_verified !== undefined) {
      params.push(`is_verified=${filters.is_verified}`);
    }
    if (filters?.is_active !== undefined) {
      params.push(`is_active=${filters.is_active}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return this.http.get<ApiResponse<BankAccount[]>>(
      url,
      { withCredentials: true }
    ).pipe(
      timeout(environment.apiTimeout),
      map(response => response.data!),
      catchError(error => {
        console.error('Error getting all bank accounts:', error);
        throw error;
      })
    );
  }

  /**
   * Admin: Xác thực tài khoản ngân hàng
   */
  verifyBankAccount(accountId: number, isVerified: boolean): Observable<ApiResponse<BankAccount>> {
    return this.http.patch<ApiResponse<BankAccount>>(
      `${this.apiUrl}/admin/bank-accounts/${accountId}/verify`,
      { is_verified: isVerified },
      { withCredentials: true }
    ).pipe(
      timeout(environment.apiTimeout),
      catchError(error => {
        console.error('Error verifying bank account:', error);
        throw error;
      })
    );
  }
}
