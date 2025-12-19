export interface CourseCategory {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Course {
  id: number;
  instructor_id: number;
  title: string;
  thumbnail?: string | null;
  publish_date?: string | null;
  status: 'published' | 'draft' | 'archived';
  revenue: number;
  students: number | null;
  rating: number | null;
  description?: string | null;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: number | null;
  category_id: number;
  is_premium: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string | null;
  price?: number;
  original_price?: number;
  discount?: number;
}

export interface CourseEnrollment {
  id: number;
  user_id: number;
  course_id: number;
  enrollment_type?: 'free' | 'paid';
  progress: number;
  status: 'completed' | 'in-progress' | 'not-started';
  start_date?: string | null;
  completion_date?: string | null;
  rating?: number | null;
  created_at: string;
  updated_at?: string | null;
  course?: Course; // Nested course from API
}

export interface InstructorQualification {
  id: number;
  user_id: number;
  title: string;
  institution?: string | null;
  date?: string | null;
  credential_url?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Testimonial {
  id: number;
  instructor_id: number;
  student_name: string;
  student_avatar?: string | null;
  rating: number;
  comment?: string | null;
  course_title?: string | null;
  date: string;
  created_at: string;
  updated_at?: string | null;
}
