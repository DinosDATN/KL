import { User } from './user.model';

export interface PrivateConversation {
  id: number;
  participant1_id: number;
  participant2_id: number;
  last_message_id: number | null;
  last_activity_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Populated fields
  other_participant?: User;
  last_message?: PrivateMessage;
  unread_count?: number;
  
  // Associations
  Participant1?: User;
  Participant2?: User;
  LastMessage?: PrivateMessage;
}

export interface PrivateMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  message_type: 'text' | 'image' | 'file' | 'voice' | 'video';
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  reply_to_message_id: number | null;
  is_edited: boolean;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  sent_at: string;
  created_at: string;
  updated_at: string;
  
  // Computed fields
  read_status?: MessageStatus;
  
  // Associations
  Sender?: User;
  Receiver?: User;
  ReplyToMessage?: PrivateMessage;
  MessageStatuses?: PrivateMessageStatus[];
}

export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface PrivateMessageStatus {
  id: number;
  message_id: number;
  user_id: number;
  status: MessageStatus;
  status_updated_at: string;
  created_at: string;
  updated_at: string;
  Message?: PrivateMessage;
  User?: User;
}

export interface PrivateMessageReaction {
  id: number;
  message_id: number;
  user_id: number;
  reaction_type: 'like' | 'love' | 'laugh' | 'sad' | 'angry' | 'wow';
  reacted_at: string;
  created_at: string;
  updated_at: string;
  Message?: PrivateMessage;
  User?: User;
}

export interface PrivateConversationSettings {
  id: number;
  conversation_id: number;
  user_id: number;
  is_muted: boolean;
  is_archived: boolean;
  is_pinned: boolean;
  custom_nickname: string | null;
  background_theme: string | null;
  font_size: 'small' | 'medium' | 'large';
  muted_until: string | null;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ConversationListResponse {
  conversations: PrivateConversation[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface MessageListResponse {
  messages: PrivateMessage[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  unread_count: number;
  conversation_id: number | null;
}
