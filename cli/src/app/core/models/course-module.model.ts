export interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  position: number;
  created_at: string;
  updated_at?: string | null;
}

export interface CourseLesson {
  id: number;
  module_id: number;
  title: string;
  content?: string | null; // For video: URL or description; document: markdown/text; quiz: JSON or text
  duration?: number | null; // minutes
  position: number;
  type: 'document' | 'video' | 'exercise' | 'quiz'; // includes quiz for broader support
  created_at: string;
  updated_at?: string | null;
}

export interface CourseLanguage {
  id: number;
  course_id: number;
  language: string;
  created_at: string;
  updated_at?: string | null;
}

export interface CourseReview {
  id: number;
  course_id: number;
  user_id: number;
  rating: number;
  comment?: string | null;
  helpful?: number | null;
  not_helpful?: number | null;
  verified: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface RelatedCourse {
  id: number;
  course_id: number;
  related_course_id: number;
  created_at: string;
}
