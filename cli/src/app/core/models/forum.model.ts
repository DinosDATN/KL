export interface Forum {
  id: number;
  title: string;
  description?: string | null;
  type: 'course' | 'problem' | 'general';
  related_id?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface ForumPost {
  id: number;
  forum_id: number;
  user_id: number;
  content: string;
  votes: number;
  created_at: string;
  updated_at?: string | null;
}

export interface ForumVote {
  id: number;
  post_id: number;
  user_id: number;
  vote_type: 'up' | 'down';
  created_at: string;
}
