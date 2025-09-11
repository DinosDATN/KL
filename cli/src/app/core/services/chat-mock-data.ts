import {
  ChatRoom,
  ChatMessage,
  ChatRoomMember,
  ChatReaction,
  MessageMention,
} from '../models/chat.model';
import { User } from '../models/user.model';

// Mock Chat Rooms
export const mockChatRooms: ChatRoom[] = [
  {
    id: 1,
    name: 'Lập trình Web 2025',
    type: 'course',
    description: 'Thảo luận về môn học Lập trình Web',
    avatar_url: '/assets/chat/web2025.png',
    unread_count: 2,
    last_message_id: 4,
    course_id: 101,
    is_public: true,
    created_by: 1,
    created_at: '2025-09-01T08:00:00Z',
    updated_at: '2025-09-11T10:00:00Z',
  },
  {
    id: 2,
    name: 'Cộng đồng KLTN',
    type: 'global',
    description: 'Nơi trao đổi mọi chủ đề về KLTN',
    avatar_url: '/assets/chat/global.png',
    unread_count: 0,
    last_message_id: 7,
    is_public: true,
    created_by: 2,
    created_at: '2025-08-20T09:00:00Z',
    updated_at: '2025-09-10T15:00:00Z',
  },
  {
    id: 3,
    name: 'Nhóm Đồ án AI',
    type: 'group',
    description: 'Trao đổi nhóm đồ án AI',
    avatar_url: '/assets/chat/ai.png',
    unread_count: 5,
    last_message_id: 10,
    is_public: false,
    created_by: 3,
    created_at: '2025-09-05T12:00:00Z',
    updated_at: '2025-09-11T09:00:00Z',
  },
];

// Mock Chat Messages
export const mockChatMessages: ChatMessage[] = [
  {
    id: 1,
    room_id: 1,
    sender_id: 1,
    content: 'Chào mọi người, ai đã làm xong bài tập tuần này chưa?',
    time_stamp: '2025-09-11T08:01:00Z',
    type: 'text',
    is_edited: false,
    sent_at: '2025-09-11T08:01:00Z',
  },
  {
    id: 2,
    room_id: 1,
    sender_id: 2,
    content: 'Mình còn vướng phần API, có ai giúp không?',
    time_stamp: '2025-09-11T08:02:00Z',
    type: 'text',
    is_edited: false,
    reply_to: 1,
    sent_at: '2025-09-11T08:02:00Z',
  },
  {
    id: 3,
    room_id: 1,
    sender_id: 3,
    content: 'Tối nay mình sẽ lên Zoom hỗ trợ nhé!',
    time_stamp: '2025-09-11T08:05:00Z',
    type: 'text',
    is_edited: false,
    sent_at: '2025-09-11T08:05:00Z',
  },
  {
    id: 4,
    room_id: 1,
    sender_id: 2,
    content: 'Cảm ơn bạn nhiều!',
    time_stamp: '2025-09-11T08:06:00Z',
    type: 'text',
    is_edited: false,
    reply_to: 3,
    sent_at: '2025-09-11T08:06:00Z',
  },
  {
    id: 5,
    room_id: 2,
    sender_id: 4,
    content: 'Chào mừng các bạn đến với diễn đàn KLTN!',
    time_stamp: '2025-09-10T15:01:00Z',
    type: 'text',
    is_edited: false,
    sent_at: '2025-09-10T15:01:00Z',
  },
  {
    id: 6,
    room_id: 2,
    sender_id: 5,
    content: 'Có ai biết thông tin về học bổng không?',
    time_stamp: '2025-09-10T15:05:00Z',
    type: 'text',
    is_edited: false,
    sent_at: '2025-09-10T15:05:00Z',
  },
  {
    id: 7,
    room_id: 2,
    sender_id: 1,
    content: 'Bạn vào mục Thông báo nhé!',
    time_stamp: '2025-09-10T15:10:00Z',
    type: 'text',
    is_edited: false,
    reply_to: 6,
    sent_at: '2025-09-10T15:10:00Z',
  },
  {
    id: 8,
    room_id: 3,
    sender_id: 3,
    content: 'Nhóm mình họp lúc 20h tối nay nhé!',
    time_stamp: '2025-09-11T09:10:00Z',
    type: 'text',
    is_edited: false,
    sent_at: '2025-09-11T09:10:00Z',
  },
  {
    id: 9,
    room_id: 3,
    sender_id: 6,
    content: 'Ok bạn!',
    time_stamp: '2025-09-11T09:12:00Z',
    type: 'text',
    is_edited: false,
    reply_to: 8,
    sent_at: '2025-09-11T09:12:00Z',
  },
  {
    id: 10,
    room_id: 3,
    sender_id: 7,
    content: 'Tối nay mình bận, mai họp được không?',
    time_stamp: '2025-09-11T09:15:00Z',
    type: 'text',
    is_edited: false,
    sent_at: '2025-09-11T09:15:00Z',
  },
];

// Mock Chat Room Members
export const mockChatRoomMembers: ChatRoomMember[] = [
  {
    id: 1,
    room_id: 1,
    user_id: 1,
    joined_at: '2025-09-01T08:00:00Z',
    is_admin: true,
  },
  {
    id: 2,
    room_id: 1,
    user_id: 2,
    joined_at: '2025-09-01T08:10:00Z',
    is_admin: false,
  },
  {
    id: 3,
    room_id: 1,
    user_id: 3,
    joined_at: '2025-09-01T08:20:00Z',
    is_admin: false,
  },
  {
    id: 4,
    room_id: 2,
    user_id: 1,
    joined_at: '2025-08-20T09:00:00Z',
    is_admin: true,
  },
  {
    id: 5,
    room_id: 2,
    user_id: 4,
    joined_at: '2025-08-20T09:10:00Z',
    is_admin: false,
  },
  {
    id: 6,
    room_id: 2,
    user_id: 5,
    joined_at: '2025-08-20T09:20:00Z',
    is_admin: false,
  },
  {
    id: 7,
    room_id: 3,
    user_id: 3,
    joined_at: '2025-09-05T12:00:00Z',
    is_admin: true,
  },
  {
    id: 8,
    room_id: 3,
    user_id: 6,
    joined_at: '2025-09-05T12:10:00Z',
    is_admin: false,
  },
  {
    id: 9,
    room_id: 3,
    user_id: 7,
    joined_at: '2025-09-05T12:20:00Z',
    is_admin: false,
  },
];

// Mock Chat Reactions
export const mockChatReactions: ChatReaction[] = [
  {
    id: 1,
    message_id: 1,
    user_id: 2,
    reaction_type: 'like',
    reacted_at: '2025-09-11T08:02:10Z',
  },
  {
    id: 2,
    message_id: 2,
    user_id: 1,
    reaction_type: 'love',
    reacted_at: '2025-09-11T08:02:20Z',
  },
  {
    id: 3,
    message_id: 3,
    user_id: 2,
    reaction_type: 'laugh',
    reacted_at: '2025-09-11T08:05:10Z',
  },
  {
    id: 4,
    message_id: 4,
    user_id: 3,
    reaction_type: 'like',
    reacted_at: '2025-09-11T08:06:10Z',
  },
  {
    id: 5,
    message_id: 7,
    user_id: 5,
    reaction_type: 'sad',
    reacted_at: '2025-09-10T15:10:10Z',
  },
  {
    id: 6,
    message_id: 8,
    user_id: 6,
    reaction_type: 'angry',
    reacted_at: '2025-09-11T09:10:10Z',
  },
];

// Mock Message Mentions
export const mockMessageMentions: MessageMention[] = [
  { id: 1, message_id: 2, user_id: 1, created_at: '2025-09-11T08:02:05Z' },
  { id: 2, message_id: 7, user_id: 5, created_at: '2025-09-10T15:10:05Z' },
];

// Optionally, you can create a service class to provide these mocks
export class MockChatDataService {
  getRooms(): ChatRoom[] {
    return mockChatRooms;
  }
  getMessages(roomId: number): ChatMessage[] {
    return mockChatMessages.filter((m) => m.room_id === roomId);
  }
  getRoomMembers(roomId: number): ChatRoomMember[] {
    return mockChatRoomMembers.filter((m) => m.room_id === roomId);
  }
  getReactions(messageId: number): ChatReaction[] {
    return mockChatReactions.filter((r) => r.message_id === messageId);
  }
  getMentions(messageId: number): MessageMention[] {
    return mockMessageMentions.filter((m) => m.message_id === messageId);
  }
}
