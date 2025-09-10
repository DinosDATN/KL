export interface Admin {
  id: number;
  user_id: number;
  level: 'mod' | 'super';
  assigned_at: string;
}

export interface Report {
  id: number;
  user_id: number;
  content: string;
  type: 'bug' | 'feedback' | 'violation';
  created_at: string;
  updated_at?: string | null;
}

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  is_read: boolean;
  created_at: string;
  updated_at?: string | null;
}
