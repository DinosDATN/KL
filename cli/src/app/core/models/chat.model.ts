export interface ChatRoom {
  id: number;
  name: string;
  type: 'course' | 'global' | 'group';
  description?: string | null;
  avatar_url?: string | null;
  unread_count: number;
  last_message_id?: number | null;
  course_id?: number | null;
  is_public: boolean;
  created_by: number;
  created_at: string;
  updated_at?: string | null;
}

export interface ChatMessage {
  id: number;
  room_id: number;
  sender_id: number;
  content: string;
  time_stamp: string;
  type: 'text' | 'image' | 'file';
  is_edited: boolean;
  reply_to?: number | null;
  sent_at: string;
}

export interface ChatRoomMember {
  id: number;
  room_id: number;
  user_id: number;
  joined_at: string;
  is_admin: boolean;
}

export interface ChatReaction {
  id: number;
  message_id: number;
  user_id: number;
  reaction_type: 'like' | 'love' | 'laugh' | 'sad' | 'angry';
  reacted_at: string;
}

export interface MessageMention {
  id: number;
  message_id: number;
  user_id: number;
  created_at: string;
}
