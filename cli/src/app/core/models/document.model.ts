export interface Topic {
  id: number;
  name: string;
  created_at: string;
  updated_at?: string | null;
}

export interface DocumentCategory {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Document {
  id: number;
  title: string;
  description?: string | null;
  content?: string | null;
  topic_id: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration?: number | null;
  students: number;
  rating: number;
  thumbnail_url?: string | null;
  created_by: number;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string | null;
}

export interface DocumentCategoryLink {
  id: number;
  document_id: number;
  category_id: number;
  created_at: string;
  updated_at?: string | null;
}

export interface DocumentModule {
  id: number;
  document_id: number;
  title: string;
  position: number;
  created_at: string;
  updated_at?: string | null;
}

export interface DocumentLesson {
  id: number;
  module_id: number;
  title: string;
  content?: string | null;
  code_example?: string | null;
  position: number;
  created_at: string;
  updated_at?: string | null;
}

export interface DocumentLessonCompletion {
  id: number;
  user_id: number;
  lesson_id: number;
  completed_at: string;
}

export interface DocumentCompletion {
  id: number;
  user_id: number;
  document_id: number;
  completed_at: string;
}

export interface Animation {
  id: number;
  document_id?: number | null;
  lesson_id?: number | null;
  title: string;
  type: string;
  description?: string | null;
  embed_code?: string | null;
  created_at: string;
  updated_at?: string | null;
}
