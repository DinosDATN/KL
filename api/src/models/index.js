const Problem = require('./Problem');
const ProblemCategory = require('./ProblemCategory');
const Tag = require('./Tag');
const ProblemTag = require('./ProblemTag');
const ProblemExample = require('./ProblemExample');
const ProblemConstraint = require('./ProblemConstraint');
const StarterCode = require('./StarterCode');
const TestCase = require('./TestCase');
const SubmissionCode = require('./SubmissionCode');
const Submission = require('./Submission');
const ProblemComment = require('./ProblemComment');
const User = require('./User');
const UserProfile = require('./UserProfile');
const UserStats = require('./UserStats');
const Level = require('./Level');
const BadgeCategory = require('./BadgeCategory');
const Badge = require('./Badge');
const UserBadge = require('./UserBadge');
const LeaderboardEntry = require('./LeaderboardEntry');

// Define associations
Problem.belongsTo(ProblemCategory, {
  foreignKey: 'category_id',
  as: 'Category'
});

ProblemCategory.hasMany(Problem, {
  foreignKey: 'category_id',
  as: 'Problems'
});

Problem.belongsToMany(Tag, {
  through: ProblemTag,
  foreignKey: 'problem_id',
  otherKey: 'tag_id',
  as: 'Tags'
});

Tag.belongsToMany(Problem, {
  through: ProblemTag,
  foreignKey: 'tag_id',
  otherKey: 'problem_id',
  as: 'Problems'
});

ProblemTag.belongsTo(Problem, { foreignKey: 'problem_id' });
ProblemTag.belongsTo(Tag, { foreignKey: 'tag_id' });

Problem.hasMany(ProblemExample, {
  foreignKey: 'problem_id',
  as: 'Examples'
});

ProblemExample.belongsTo(Problem, {
  foreignKey: 'problem_id'
});

Problem.hasMany(ProblemConstraint, {
  foreignKey: 'problem_id',
  as: 'Constraints'
});

ProblemConstraint.belongsTo(Problem, {
  foreignKey: 'problem_id'
});

Problem.hasMany(StarterCode, {
  foreignKey: 'problem_id',
  as: 'StarterCodes'
});

StarterCode.belongsTo(Problem, {
  foreignKey: 'problem_id'
});

Problem.hasMany(TestCase, {
  foreignKey: 'problem_id',
  as: 'TestCases'
});

TestCase.belongsTo(Problem, {
  foreignKey: 'problem_id'
});

Problem.hasMany(Submission, {
  foreignKey: 'problem_id',
  as: 'Submissions'
});

Submission.belongsTo(Problem, {
  foreignKey: 'problem_id'
});

Submission.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User'
});

Submission.belongsTo(SubmissionCode, {
  foreignKey: 'code_id',
  as: 'Code'
});

SubmissionCode.hasMany(Submission, {
  foreignKey: 'code_id'
});

Problem.hasMany(ProblemComment, {
  foreignKey: 'problem_id',
  as: 'Comments'
});

ProblemComment.belongsTo(Problem, {
  foreignKey: 'problem_id'
});

ProblemComment.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User'
});

// User associations
User.hasOne(UserProfile, {
  foreignKey: 'user_id',
  as: 'Profile'
});

UserProfile.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User'
});

User.hasOne(UserStats, {
  foreignKey: 'user_id',
  as: 'Stats'
});

UserStats.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User'
});

// Badge associations
BadgeCategory.hasMany(Badge, {
  foreignKey: 'category_id',
  as: 'Badges'
});

Badge.belongsTo(BadgeCategory, {
  foreignKey: 'category_id',
  as: 'Category'
});

// User-Badge many-to-many relationship
User.belongsToMany(Badge, {
  through: UserBadge,
  foreignKey: 'user_id',
  otherKey: 'badge_id',
  as: 'Badges'
});

Badge.belongsToMany(User, {
  through: UserBadge,
  foreignKey: 'badge_id',
  otherKey: 'user_id',
  as: 'Users'
});

UserBadge.belongsTo(User, { foreignKey: 'user_id' });
UserBadge.belongsTo(Badge, { foreignKey: 'badge_id' });

// Leaderboard associations
User.hasMany(LeaderboardEntry, {
  foreignKey: 'user_id',
  as: 'LeaderboardEntries'
});

LeaderboardEntry.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User'
});

module.exports = {
  Problem,
  ProblemCategory,
  Tag,
  ProblemTag,
  ProblemExample,
  ProblemConstraint,
  StarterCode,
  TestCase,
  SubmissionCode,
  Submission,
  ProblemComment,
  User,
  UserProfile,
  UserStats,
  Level,
  BadgeCategory,
  Badge,
  UserBadge,
  LeaderboardEntry
};
