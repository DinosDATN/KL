// Mock data service for homepage (Trang chủ)
// Dựa trên cấu trúc CSDL Lfys_main.sql
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Course } from '../models/course.model';
import { Document } from '../models/document.model';
import { Problem } from '../models/problem.model';
import { User } from '../models/user.model';
import { LeaderboardEntry } from '../models/gamification.model';
import { Testimonial } from '../models/course.model';

@Injectable({ providedIn: 'root' })
export class HomepageMockDataService {
  // Thông tin tổng quan
  getOverview() {
    return of({
      totalUsers: 10234,
      totalCourses: 120,
      totalDocuments: 85,
      totalProblems: 340,
      totalSubmissions: 12000,
      totalBadges: 24,
      totalAchievements: 18,
    });
  }

  // Khóa học nổi bật
  getFeaturedCourses(): Observable<Course[]> {
    return of([
      {
        id: 1,
        instructor_id: 101,
        title: 'Lập trình Python cơ bản',
        thumbnail: '/assets/courses/python.jpg',
        publish_date: '2025-07-01',
        status: 'published',
        revenue: 0,
        students: 1200,
        rating: 4.8,
        description: 'Khóa học nhập môn Python cho người mới bắt đầu.',
        level: 'Beginner',
        duration: 600,
        category_id: 1,
        is_premium: false,
        is_deleted: false,
        created_at: '2025-06-01',
        updated_at: '2025-08-01',
      },
      {
        id: 2,
        instructor_id: 102,
        title: 'JavaScript nâng cao',
        thumbnail: '/assets/courses/js.jpg',
        publish_date: '2025-06-15',
        status: 'published',
        revenue: 0,
        students: 950,
        rating: 4.7,
        description: 'Nâng cao kỹ năng JavaScript với các chủ đề chuyên sâu.',
        level: 'Intermediate',
        duration: 720,
        category_id: 2,
        is_premium: true,
        is_deleted: false,
        created_at: '2025-05-10',
        updated_at: '2025-08-01',
      },
    ]);
  }

  // Tài liệu nổi bật
  getFeaturedDocuments(): Observable<Document[]> {
    return of([
      {
        id: 1,
        title: 'Thuật toán sắp xếp',
        description: 'Tổng hợp các thuật toán sắp xếp cơ bản và nâng cao.',
        content: '',
        topic_id: 1,
        level: 'Beginner',
        duration: 60,
        students: 800,
        rating: 4.6,
        thumbnail_url: '/assets/documents/sort.jpg',
        created_by: 101,
        is_deleted: false,
        created_at: '2025-07-01',
        updated_at: '2025-08-01',
      },
      {
        id: 2,
        title: 'Cấu trúc dữ liệu nâng cao',
        description: 'Khám phá các cấu trúc dữ liệu phức tạp.',
        content: '',
        topic_id: 2,
        level: 'Advanced',
        duration: 90,
        students: 600,
        rating: 4.5,
        thumbnail_url: '/assets/documents/data-struct.jpg',
        created_by: 102,
        is_deleted: false,
        created_at: '2025-06-15',
        updated_at: '2025-08-01',
      },
    ]);
  }

  // Bài tập nổi bật
  getFeaturedProblems(): Observable<Problem[]> {
    return of([
      {
        id: 1,
        title: 'Tìm số lớn thứ hai',
        description: 'Tìm số lớn thứ hai trong mảng số nguyên.',
        difficulty: 'Easy',
        estimated_time: '10 phút',
        likes: 120,
        dislikes: 5,
        acceptance: 95.5,
        total_submissions: 1000,
        solved_count: 900,
        is_new: true,
        is_popular: true,
        is_premium: false,
        category_id: 1,
        created_by: 101,
        is_deleted: false,
        created_at: '2025-07-01',
        updated_at: '2025-08-01',
      },
      {
        id: 2,
        title: 'Dãy con tăng dài nhất',
        description: 'Tìm dãy con tăng dài nhất trong mảng.',
        difficulty: 'Medium',
        estimated_time: '20 phút',
        likes: 80,
        dislikes: 10,
        acceptance: 80.2,
        total_submissions: 700,
        solved_count: 500,
        is_new: false,
        is_popular: true,
        is_premium: false,
        category_id: 2,
        created_by: 102,
        is_deleted: false,
        created_at: '2025-06-15',
        updated_at: '2025-08-01',
      },
    ]);
  }

  // Thành tích nổi bật
  getFeaturedAchievements() {
    return of([
      {
        id: 1,
        title: 'Chinh phục 100 bài tập',
        icon: 'trophy',
        category: 'milestone',
        rarity: 'epic',
      },
      {
        id: 2,
        title: 'Học viên tích cực',
        icon: 'star',
        category: 'community',
        rarity: 'rare',
      },
    ]);
  }

  // Bảng xếp hạng (top 5)
  getLeaderboard(): Observable<(User & { xp: number; level: number })[]> {
    return of([
      {
        id: 1,
        name: 'Nguyễn Văn A',
        email: 'a@example.com',
        role: 'user',
        is_active: true,
        is_online: true,
        subscription_status: 'free',
        created_at: '2025-01-01',
        avatar_url: '/assets/avatars/a.jpg',
        xp: 12000,
        level: 15,
      },
      {
        id: 2,
        name: 'Trần Thị B',
        email: 'b@example.com',
        role: 'user',
        is_active: true,
        is_online: true,
        subscription_status: 'premium',
        created_at: '2025-02-01',
        avatar_url: '/assets/avatars/b.jpg',
        xp: 11500,
        level: 14,
      },
      {
        id: 3,
        name: 'Lê Văn C',
        email: 'c@example.com',
        role: 'user',
        is_active: true,
        is_online: false,
        subscription_status: 'free',
        created_at: '2025-03-01',
        avatar_url: '/assets/avatars/c.jpg',
        xp: 11000,
        level: 14,
      },
      {
        id: 4,
        name: 'Phạm Thị D',
        email: 'd@example.com',
        role: 'user',
        is_active: true,
        is_online: false,
        subscription_status: 'free',
        created_at: '2025-04-01',
        avatar_url: '/assets/avatars/d.jpg',
        xp: 10800,
        level: 13,
      },
      {
        id: 5,
        name: 'Hoàng Văn E',
        email: 'e@example.com',
        role: 'user',
        is_active: true,
        is_online: true,
        subscription_status: 'premium',
        created_at: '2025-05-01',
        avatar_url: '/assets/avatars/e.jpg',
        xp: 10500,
        level: 13,
      },
    ]);
  }

  // Đánh giá học viên
  getTestimonials(): Observable<Testimonial[]> {
    return of([
      {
        id: 1,
        instructor_id: 101,
        student_name: 'Nguyễn Văn F',
        student_avatar: '/assets/avatars/f.jpg',
        rating: 5,
        comment: 'Khóa học rất bổ ích, giảng viên nhiệt tình!',
        course_title: 'Lập trình Python cơ bản',
        date: '2025-08-01',
        created_at: '2025-08-01',
        updated_at: '2025-08-01',
      },
      {
        id: 2,
        instructor_id: 102,
        student_name: 'Trần Thị G',
        student_avatar: '/assets/avatars/g.jpg',
        rating: 4.8,
        comment: 'Tài liệu chi tiết, dễ hiểu.',
        course_title: 'JavaScript nâng cao',
        date: '2025-07-20',
        created_at: '2025-07-20',
        updated_at: '2025-08-01',
      },
    ]);
  }
}
