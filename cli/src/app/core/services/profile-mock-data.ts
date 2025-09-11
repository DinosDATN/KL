// Mock data for student profile page
// Models: User, UserProfile, UserStat, UserGoal, Achievement, UserAchievement, UserActivityLog, Course, CourseEnrollment, Badge, UserBadge, Quiz, UserQuizResult, Problem, Submission

import {
  User,
  UserProfile,
  UserStat,
  UserGoal,
  Achievement,
  UserAchievement,
  UserActivityLog,
} from '../models/user.model';
import { Course, CourseEnrollment } from '../models/course.model';
import { Badge, UserBadge } from '../models/gamification.model';
import { Quiz, UserQuizResult } from '../models/quiz.model';
import { Problem, Submission } from '../models/problem.model';

export const mockUser: User = {
  id: 1,
  name: 'Nguyen Van A',
  email: 'nguyenvana@example.com',
  role: 'user',
  is_active: true,
  is_online: false,
  subscription_status: 'free',
  created_at: '2024-01-01T10:00:00Z',
};

export const mockUserProfile: UserProfile = {
  id: 1,
  user_id: 1,
  bio: 'Sinh viên năm 3 ngành CNTT, yêu thích lập trình.',
  birthday: '2003-05-20',
  gender: 'male',
  phone: '0123456789',
  address: 'Hà Nội, Việt Nam',
  website_url: 'https://nguyenvana.dev',
  github_url: 'https://github.com/nguyenvana',
  linkedin_url: 'https://linkedin.com/in/nguyenvana',
  preferred_language: 'vi',
  theme_mode: 'light',
  layout: 'expanded',
  notifications: true,
  visibility_profile: true,
  visibility_achievements: true,
  visibility_progress: true,
  visibility_activity: true,
  created_at: '2024-01-01T10:00:00Z',
};

export const mockUserStat: UserStat = {
  id: 1,
  user_id: 1,
  xp: 3200,
  level: 7,
  rank: 15,
  courses_completed: 3,
  hours_learned: 120,
  problems_solved: 45,
  current_streak: 8,
  longest_streak: 15,
  average_score: 87,
  created_at: '2024-01-01T10:00:00Z',
};

export const mockUserGoals: UserGoal[] = [
  {
    id: 1,
    user_id: 1,
    title: 'Hoàn thành 5 khóa học',
    target: 5,
    current: 3,
    unit: 'khóa học',
    category: 'learning',
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    title: 'Giải 50 bài tập',
    target: 50,
    current: 45,
    unit: 'bài tập',
    category: 'practice',
    created_at: '2024-01-01T10:00:00Z',
  },
];

export const mockAchievements: Achievement[] = [
  {
    id: 1,
    title: 'Chăm chỉ',
    description: 'Đăng nhập liên tục 7 ngày',
    icon: 'streak.png',
    category: 'milestone',
    rarity: 'common',
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 2,
    title: 'Giải bài đầu tiên',
    description: 'Hoàn thành bài tập đầu tiên',
    icon: 'first-problem.png',
    category: 'learning',
    rarity: 'common',
    created_at: '2024-01-01T10:00:00Z',
  },
];

export const mockUserAchievements: UserAchievement[] = [
  {
    id: 1,
    user_id: 1,
    achievement_id: 1,
    date_earned: '2024-01-08T10:00:00Z',
    created_at: '2024-01-08T10:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    achievement_id: 2,
    date_earned: '2024-01-02T10:00:00Z',
    created_at: '2024-01-02T10:00:00Z',
  },
];

export const mockUserActivityLogs: UserActivityLog[] = [
  {
    id: 1,
    user_id: 1,
    type: 'course_started',
    title: 'Bắt đầu khóa học "Lập trình Python cơ bản"',
    date: '2024-01-01T10:00:00Z',
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    type: 'problem_solved',
    title: 'Giải thành công bài "Tính tổng dãy số"',
    date: '2024-01-03T10:00:00Z',
    created_at: '2024-01-03T10:00:00Z',
  },
];

export const mockCourses: Course[] = [
  {
    id: 1,
    instructor_id: 2,
    title: 'Lập trình Python cơ bản',
    status: 'published',
    revenue: 0,
    students: 120,
    rating: 4.7,
    level: 'Beginner',
    category_id: 1,
    is_premium: false,
    is_deleted: false,
    created_at: '2023-12-01T10:00:00Z',
  },
  {
    id: 2,
    instructor_id: 3,
    title: 'Giải thuật nâng cao',
    status: 'published',
    revenue: 0,
    students: 80,
    rating: 4.5,
    level: 'Advanced',
    category_id: 2,
    is_premium: true,
    is_deleted: false,
    created_at: '2023-12-10T10:00:00Z',
  },
];

export const mockCourseEnrollments: CourseEnrollment[] = [
  {
    id: 1,
    user_id: 1,
    course_id: 1,
    progress: 100,
    status: 'completed',
    start_date: '2024-01-01T10:00:00Z',
    completion_date: '2024-01-10T10:00:00Z',
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 2,
    user_id: 1,
    course_id: 2,
    progress: 60,
    status: 'in-progress',
    start_date: '2024-01-11T10:00:00Z',
    created_at: '2024-01-11T10:00:00Z',
  },
];

export const mockBadges: Badge[] = [
  {
    id: 1,
    name: 'Học viên chăm chỉ',
    rarity: 'common',
    category_id: 1,
    created_at: '2024-01-01T10:00:00Z',
  },
];

export const mockUserBadges: UserBadge[] = [
  {
    id: 1,
    user_id: 1,
    badge_id: 1,
    earned_at: '2024-01-05T10:00:00Z',
  },
];

export const mockQuizzes: Quiz[] = [
  {
    id: 1,
    title: 'Quiz Python cơ bản',
    type: 'multiple_choice',
    created_by: 2,
    created_at: '2024-01-01T10:00:00Z',
  },
];

export const mockUserQuizResults: UserQuizResult[] = [
  {
    id: 1,
    user_id: 1,
    quiz_id: 1,
    score: 90,
    completed_at: '2024-01-02T10:00:00Z',
  },
];

export const mockProblems: Problem[] = [
  {
    id: 1,
    title: 'Tính tổng dãy số',
    difficulty: 'Easy',
    likes: 10,
    dislikes: 1,
    acceptance: 95,
    total_submissions: 20,
    solved_count: 15,
    is_new: false,
    is_popular: true,
    is_premium: false,
    category_id: 1,
    created_by: 2,
    is_deleted: false,
    created_at: '2024-01-01T10:00:00Z',
  },
];

export const mockSubmissions: Submission[] = [
  {
    id: 1,
    user_id: 1,
    problem_id: 1,
    code_id: 1,
    language: 'python',
    status: 'accepted',
    score: 100,
    submitted_at: '2024-01-03T10:00:00Z',
  },
];
