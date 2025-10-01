import { User } from './user.model';

export interface Friendship {
  id: number;
  requester_id: number;
  addressee_id: number;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  requested_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
  Requester?: User;
  Addressee?: User;
}

export interface FriendshipStatus {
  status: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked' | 'self';
  isRequester?: boolean;
  requestedAt?: string;
  respondedAt?: string;
  message?: string;
}

export interface FriendRequest {
  friendship_id: number;
  friend: User;
  friendship_date: string;
  is_online: boolean;
  last_seen_at: string | null;
}

export interface UserBlock {
  id: number;
  blocker_id: number;
  blocked_id: number;
  reason: string | null;
  blocked_at: string;
  created_at: string;
  updated_at: string;
  BlockedUser?: User;
  Blocker?: User;
}

export interface FriendSearchResult extends User {
  friendship_status?: FriendshipStatus;
}
