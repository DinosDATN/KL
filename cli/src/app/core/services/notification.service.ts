import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 = no auto-hide
  timestamp: Date;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  show(notification: Omit<Notification, 'id' | 'timestamp'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      duration: notification.duration ?? 5000,
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([newNotification, ...currentNotifications]);

    // Auto-hide if duration is set
    if (
      typeof newNotification.duration === 'number' &&
      newNotification.duration > 0
    ) {
      setTimeout(() => {
        this.remove(newNotification.id);
      }, newNotification.duration);
    }
  }

  success(title: string, message?: string, duration?: number): void {
    this.show({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration?: number): void {
    this.show({ type: 'error', title, message, duration });
  }

  info(title: string, message?: string, duration?: number): void {
    this.show({ type: 'info', title, message, duration });
  }

  warning(title: string, message?: string, duration?: number): void {
    this.show({ type: 'warning', title, message, duration });
  }

  remove(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(
      (n) => n.id !== id
    );
    this.notificationsSubject.next(filteredNotifications);
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }

  // Specific methods for code evaluation
  codeExecutionSuccess(executionTime: number, memoryUsed: number): void {
    this.success(
      'Thực thi thành công',
      `Code đã chạy thành công trong ${executionTime}ms, sử dụng ${(memoryUsed/1024).toFixed(2)}MB bộ nhớ`
    );
  }

  codeExecutionError(error: string): void {
    this.error(
      'Lỗi thực thi',
      error || 'Có lỗi xảy ra khi chạy code. Vui lòng kiểm tra lại.'
    );
  }

  codeSubmissionSuccess(score: number, testCasesPassed: number, totalTestCases: number): void {
    const status = score === 100 ? 'hoàn hảo' : score >= 70 ? 'tốt' : 'cần cải thiện';
    this.success(
      'Nộp bài thành công',
      `Điểm số: ${score}/100 (${testCasesPassed}/${totalTestCases} test cases). Kết quả ${status}!`
    );
  }

  codeSubmissionError(error: string): void {
    this.error(
      'Lỗi nộp bài',
      error || 'Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.'
    );
  }

  judgeApiError(): void {
    this.error(
      'Dịch vụ đánh giá không khả dụng',
      'Hệ thống đánh giá code đang gặp sự cố. Vui lòng thử lại sau.',
      10000
    );
  }

  networkError(): void {
    this.error(
      'Lỗi kết nối',
      'Không thể kết nối tới server. Vui lòng kiểm tra kết nối mạng.',
      8000
    );
  }

  rateLimitError(): void {
    this.warning(
      'Quá nhiều yêu cầu',
      'Bạn đã gử i quá nhiều yêu cầu. Vui lòng chờ một chút rồi thử lại.',
      6000
    );
  }

  languageNotSupported(language: string): void {
    this.warning(
      'Ngôn ngữ không được hỗ trợ',
      `Ngôn ngữ ${language} hiện tại chưa được hỗ trợ. Vui lòng chọn ngôn ngữ khác.`
    );
  }

  codeValidationError(error: string): void {
    this.warning(
      'Lỗi validation',
      error || 'Code không hợp lệ. Vui lòng kiểm tra lại syntax.'
    );
  }
}
