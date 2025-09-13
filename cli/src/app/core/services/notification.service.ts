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
}
