const { ChatRoom, ChatMessage, ChatRoomMember, User } = require('../models');

const seedChatData = async () => {
  try {
    console.log('🌱 Seeding chat data...');

    // Create default chat rooms
    const rooms = await ChatRoom.bulkCreate([
      {
        name: 'Lập trình Web 2025',
        type: 'course',
        description: 'Thảo luận về môn học Lập trình Web',
        is_public: true,
        created_by: 1,
        created_at: new Date('2025-09-01T08:00:00Z'),
        updated_at: new Date('2025-09-11T10:00:00Z')
      },
      {
        name: 'Cộng đồng KLTN',
        type: 'global',
        description: 'Nơi trao đổi mọi chủ đề về KLTN',
        is_public: true,
        created_by: 2,
        created_at: new Date('2025-08-20T09:00:00Z'),
        updated_at: new Date('2025-09-10T15:00:00Z')
      },
      {
        name: 'Nhóm Đồ án AI',
        type: 'group',
        description: 'Trao đổi nhóm đồ án AI',
        is_public: false,
        created_by: 3,
        created_at: new Date('2025-09-05T12:00:00Z'),
        updated_at: new Date('2025-09-11T09:00:00Z')
      }
    ]);

    console.log(`✅ Created ${rooms.length} chat rooms`);

    // Add room members (assuming users 1-7 exist)
    const roomMembers = await ChatRoomMember.bulkCreate([
      // Room 1 members
      { room_id: rooms[0].id, user_id: 1, is_admin: true, joined_at: new Date('2025-09-01T08:00:00Z') },
      { room_id: rooms[0].id, user_id: 2, is_admin: false, joined_at: new Date('2025-09-01T08:10:00Z') },
      { room_id: rooms[0].id, user_id: 3, is_admin: false, joined_at: new Date('2025-09-01T08:20:00Z') },
      
      // Room 2 members  
      { room_id: rooms[1].id, user_id: 1, is_admin: true, joined_at: new Date('2025-08-20T09:00:00Z') },
      { room_id: rooms[1].id, user_id: 4, is_admin: false, joined_at: new Date('2025-08-20T09:10:00Z') },
      { room_id: rooms[1].id, user_id: 5, is_admin: false, joined_at: new Date('2025-08-20T09:20:00Z') },
      
      // Room 3 members
      { room_id: rooms[2].id, user_id: 3, is_admin: true, joined_at: new Date('2025-09-05T12:00:00Z') },
      { room_id: rooms[2].id, user_id: 6, is_admin: false, joined_at: new Date('2025-09-05T12:10:00Z') },
      { room_id: rooms[2].id, user_id: 7, is_admin: false, joined_at: new Date('2025-09-05T12:20:00Z') }
    ]);

    console.log(`✅ Created ${roomMembers.length} room memberships`);

    // Create initial messages
    const messages = await ChatMessage.bulkCreate([
      // Room 1 messages
      {
        room_id: rooms[0].id,
        sender_id: 1,
        content: 'Chào mọi người, ai đã làm xong bài tập tuần này chưa?',
        type: 'text',
        sent_at: new Date('2025-09-11T08:01:00Z'),
        time_stamp: new Date('2025-09-11T08:01:00Z')
      },
      {
        room_id: rooms[0].id,
        sender_id: 2,
        content: 'Mình còn vướng phần API, có ai giúp không?',
        type: 'text',
        reply_to: null,
        sent_at: new Date('2025-09-11T08:02:00Z'),
        time_stamp: new Date('2025-09-11T08:02:00Z')
      },
      {
        room_id: rooms[0].id,
        sender_id: 3,
        content: 'Tối nay mình sẽ lên Zoom hỗ trợ nhé!',
        type: 'text',
        sent_at: new Date('2025-09-11T08:05:00Z'),
        time_stamp: new Date('2025-09-11T08:05:00Z')
      },

      // Room 2 messages
      {
        room_id: rooms[1].id,
        sender_id: 4,
        content: 'Chào mừng các bạn đến với diễn đàn KLTN!',
        type: 'text',
        sent_at: new Date('2025-09-10T15:01:00Z'),
        time_stamp: new Date('2025-09-10T15:01:00Z')
      },
      {
        room_id: rooms[1].id,
        sender_id: 5,
        content: 'Có ai biết thông tin về học bổng không?',
        type: 'text',
        sent_at: new Date('2025-09-10T15:05:00Z'),
        time_stamp: new Date('2025-09-10T15:05:00Z')
      },

      // Room 3 messages
      {
        room_id: rooms[2].id,
        sender_id: 3,
        content: 'Nhóm mình họp lúc 20h tối nay nhé!',
        type: 'text',
        sent_at: new Date('2025-09-11T09:10:00Z'),
        time_stamp: new Date('2025-09-11T09:10:00Z')
      },
      {
        room_id: rooms[2].id,
        sender_id: 6,
        content: 'Ok bạn!',
        type: 'text',
        sent_at: new Date('2025-09-11T09:12:00Z'),
        time_stamp: new Date('2025-09-11T09:12:00Z')
      }
    ]);

    console.log(`✅ Created ${messages.length} chat messages`);

    // Update rooms with last message IDs
    await Promise.all([
      ChatRoom.update(
        { last_message_id: messages[2].id },
        { where: { id: rooms[0].id } }
      ),
      ChatRoom.update(
        { last_message_id: messages[4].id },
        { where: { id: rooms[1].id } }
      ),
      ChatRoom.update(
        { last_message_id: messages[6].id },
        { where: { id: rooms[2].id } }
      )
    ]);

    console.log('✅ Chat data seeded successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding chat data:', error);
    throw error;
  }
};

module.exports = { seedChatData };
