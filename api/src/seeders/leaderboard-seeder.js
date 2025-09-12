const { 
  User, 
  UserProfile, 
  UserStats, 
  Level, 
  BadgeCategory, 
  Badge, 
  UserBadge, 
  LeaderboardEntry 
} = require('../models');

const seedLeaderboardData = async () => {
  try {
    console.log('🌱 Starting leaderboard data seeding...');

    // Create levels
    const levels = [
      { level: 1, name: 'Newbie', xp_required: 0, xp_to_next: 100, color: '#94a3b8', icon: 'newbie.png' },
      { level: 2, name: 'Beginner', xp_required: 100, xp_to_next: 200, color: '#65a30d', icon: 'beginner.png' },
      { level: 3, name: 'Apprentice', xp_required: 300, xp_to_next: 400, color: '#059669', icon: 'apprentice.png' },
      { level: 4, name: 'Junior', xp_required: 700, xp_to_next: 600, color: '#0284c7', icon: 'junior.png' },
      { level: 5, name: 'Developer', xp_required: 1300, xp_to_next: 700, color: '#7c3aed', icon: 'developer.png' },
      { level: 6, name: 'Senior', xp_required: 2000, xp_to_next: 1000, color: '#dc2626', icon: 'senior.png' },
      { level: 7, name: 'Expert', xp_required: 3000, xp_to_next: 1500, color: '#ea580c', icon: 'expert.png' },
      { level: 8, name: 'Pro', xp_required: 4500, xp_to_next: 500, color: '#4f8cff', icon: 'pro.png' },
      { level: 9, name: 'Master', xp_required: 5000, xp_to_next: 700, color: '#ffb84f', icon: 'master.png' },
      { level: 10, name: 'Grandmaster', xp_required: 5700, xp_to_next: 0, color: '#ff4f81', icon: 'grandmaster.png' }
    ];

    for (const levelData of levels) {
      await Level.findOrCreate({
        where: { level: levelData.level },
        defaults: levelData
      });
    }
    console.log('✅ Levels seeded');

    // Create badge categories
    const badgeCategories = [
      { name: 'Leaderboard', description: 'Achievements related to leaderboard ranking' },
      { name: 'Learning', description: 'Achievements related to learning progress' },
      { name: 'Community', description: 'Achievements related to community participation' }
    ];

    const createdCategories = {};
    for (const categoryData of badgeCategories) {
      const [category] = await BadgeCategory.findOrCreate({
        where: { name: categoryData.name },
        defaults: categoryData
      });
      createdCategories[category.name] = category.id;
    }
    console.log('✅ Badge categories seeded');

    // Create badges
    const badges = [
      { name: 'Top 1 tuần', rarity: 'epic', category_id: createdCategories['Leaderboard'] },
      { name: 'Top 3 tuần', rarity: 'rare', category_id: createdCategories['Leaderboard'] },
      { name: 'Top 10 tuần', rarity: 'common', category_id: createdCategories['Leaderboard'] },
      { name: 'Top 1 tháng', rarity: 'legendary', category_id: createdCategories['Leaderboard'] },
      { name: 'Top 3 tháng', rarity: 'epic', category_id: createdCategories['Leaderboard'] },
      { name: 'Top 10 tháng', rarity: 'rare', category_id: createdCategories['Leaderboard'] },
      { name: 'Người học chăm chỉ', rarity: 'common', category_id: createdCategories['Learning'] },
      { name: 'Chuyên gia giải thuật', rarity: 'rare', category_id: createdCategories['Learning'] }
    ];

    const createdBadges = {};
    for (const badgeData of badges) {
      const [badge] = await Badge.findOrCreate({
        where: { name: badgeData.name },
        defaults: badgeData
      });
      createdBadges[badge.name] = badge.id;
    }
    console.log('✅ Badges seeded');

    // Create sample users if they don't exist
    const sampleUsers = [
      {
        name: 'Nguyen Van A',
        email: 'nguyenvana@example.com',
        avatar_url: 'https://i.pravatar.cc/150?img=1',
        role: 'user',
        is_active: true,
        is_online: false,
        subscription_status: 'free'
      },
      {
        name: 'Tran Thi B',
        email: 'tranthib@example.com',
        avatar_url: 'https://i.pravatar.cc/150?img=2',
        role: 'user',
        is_active: true,
        is_online: true,
        subscription_status: 'premium'
      },
      {
        name: 'Le Van C',
        email: 'levanc@example.com',
        avatar_url: 'https://i.pravatar.cc/150?img=3',
        role: 'user',
        is_active: true,
        is_online: false,
        subscription_status: 'free'
      },
      {
        name: 'Pham Minh D',
        email: 'phamminhd@example.com',
        avatar_url: 'https://i.pravatar.cc/150?img=4',
        role: 'user',
        is_active: true,
        is_online: true,
        subscription_status: 'premium'
      },
      {
        name: 'Hoang Thi E',
        email: 'hoangthie@example.com',
        avatar_url: 'https://i.pravatar.cc/150?img=5',
        role: 'user',
        is_active: true,
        is_online: false,
        subscription_status: 'free'
      }
    ];

    const createdUsers = [];
    for (const userData of sampleUsers) {
      const [user] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData
      });
      createdUsers.push(user);
    }
    console.log('✅ Sample users seeded');

    // Create user profiles
    const userProfileData = [
      { user_id: createdUsers[0].id, bio: 'Sinh viên CNTT', preferred_language: 'vi', theme_mode: 'light', layout: 'expanded' },
      { user_id: createdUsers[1].id, bio: 'Yêu thích giải thuật', preferred_language: 'vi', theme_mode: 'dark', layout: 'compact' },
      { user_id: createdUsers[2].id, bio: 'Coder trẻ', preferred_language: 'vi', theme_mode: 'system', layout: 'expanded' },
      { user_id: createdUsers[3].id, bio: 'Chuyên gia về web development', preferred_language: 'vi', theme_mode: 'dark', layout: 'expanded' },
      { user_id: createdUsers[4].id, bio: 'Thích học hỏi những công nghệ mới', preferred_language: 'vi', theme_mode: 'light', layout: 'compact' }
    ];

    for (const profileData of userProfileData) {
      await UserProfile.findOrCreate({
        where: { user_id: profileData.user_id },
        defaults: profileData
      });
    }
    console.log('✅ User profiles seeded');

    // Create user stats
    const userStatsData = [
      { user_id: createdUsers[0].id, xp: 4200, level: 8, rank: 1, courses_completed: 7, hours_learned: 200, problems_solved: 120, current_streak: 15, longest_streak: 30, average_score: 95 },
      { user_id: createdUsers[1].id, xp: 3900, level: 7, rank: 2, courses_completed: 6, hours_learned: 180, problems_solved: 110, current_streak: 10, longest_streak: 25, average_score: 92 },
      { user_id: createdUsers[2].id, xp: 3500, level: 7, rank: 3, courses_completed: 5, hours_learned: 150, problems_solved: 100, current_streak: 7, longest_streak: 20, average_score: 90 },
      { user_id: createdUsers[3].id, xp: 3200, level: 6, rank: 4, courses_completed: 4, hours_learned: 140, problems_solved: 95, current_streak: 12, longest_streak: 18, average_score: 88 },
      { user_id: createdUsers[4].id, xp: 2900, level: 6, rank: 5, courses_completed: 4, hours_learned: 120, problems_solved: 85, current_streak: 5, longest_streak: 15, average_score: 85 }
    ];

    for (const statsData of userStatsData) {
      await UserStats.findOrCreate({
        where: { user_id: statsData.user_id },
        defaults: statsData
      });
    }
    console.log('✅ User stats seeded');

    // Create some user badges
    const userBadgeData = [
      { user_id: createdUsers[0].id, badge_id: createdBadges['Top 1 tuần'] },
      { user_id: createdUsers[0].id, badge_id: createdBadges['Top 1 tháng'] },
      { user_id: createdUsers[1].id, badge_id: createdBadges['Top 3 tuần'] },
      { user_id: createdUsers[1].id, badge_id: createdBadges['Top 3 tháng'] },
      { user_id: createdUsers[2].id, badge_id: createdBadges['Top 10 tuần'] }
    ];

    for (const badgeData of userBadgeData) {
      await UserBadge.findOrCreate({
        where: { user_id: badgeData.user_id, badge_id: badgeData.badge_id },
        defaults: badgeData
      });
    }
    console.log('✅ User badges seeded');

    // Create leaderboard entries
    const leaderboardEntryData = [
      // Weekly entries
      { user_id: createdUsers[0].id, xp: 4200, type: 'weekly' },
      { user_id: createdUsers[1].id, xp: 3900, type: 'weekly' },
      { user_id: createdUsers[2].id, xp: 3500, type: 'weekly' },
      { user_id: createdUsers[3].id, xp: 3200, type: 'weekly' },
      { user_id: createdUsers[4].id, xp: 2900, type: 'weekly' },
      // Monthly entries (higher values)
      { user_id: createdUsers[0].id, xp: 15000, type: 'monthly' },
      { user_id: createdUsers[1].id, xp: 14000, type: 'monthly' },
      { user_id: createdUsers[2].id, xp: 13000, type: 'monthly' },
      { user_id: createdUsers[3].id, xp: 12000, type: 'monthly' },
      { user_id: createdUsers[4].id, xp: 11000, type: 'monthly' }
    ];

    for (const entryData of leaderboardEntryData) {
      await LeaderboardEntry.findOrCreate({
        where: { user_id: entryData.user_id, type: entryData.type },
        defaults: entryData
      });
    }
    console.log('✅ Leaderboard entries seeded');

    console.log('🎉 Leaderboard data seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding leaderboard data:', error);
    throw error;
  }
};

module.exports = seedLeaderboardData;

// Run seeder if this file is executed directly
if (require.main === module) {
  const { testConnection } = require('../config/sequelize');
  
  (async () => {
    try {
      await testConnection();
      await seedLeaderboardData();
      process.exit(0);
    } catch (error) {
      console.error('Seeding failed:', error);
      process.exit(1);
    }
  })();
}
