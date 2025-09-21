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
const ChatRoom = require('./ChatRoom');
const ChatMessage = require('./ChatMessage');
const ChatRoomMember = require('./ChatRoomMember');
const ChatReaction = require('./ChatReaction');
const Level = require('./Level');
const BadgeCategory = require('./BadgeCategory');
const Badge = require('./Badge');
const UserBadge = require('./UserBadge');
const LeaderboardEntry = require('./LeaderboardEntry');
const Contest = require('./Contest');
const ContestProblem = require('./ContestProblem');
const UserContest = require('./UserContest');
const ContestSubmission = require('./ContestSubmission');
const JudgeSubmission = require('./JudgeSubmission');

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

// Contest associations
// Contest belongs to User (creator)
Contest.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'Creator'
});

User.hasMany(Contest, {
  foreignKey: 'created_by',
  as: 'CreatedContests'
});

// Contest has many Problems through ContestProblem
Contest.belongsToMany(Problem, {
  through: ContestProblem,
  foreignKey: 'contest_id',
  otherKey: 'problem_id',
  as: 'Problems'
});

Problem.belongsToMany(Contest, {
  through: ContestProblem,
  foreignKey: 'problem_id',
  otherKey: 'contest_id',
  as: 'Contests'
});

// ContestProblem associations
ContestProblem.belongsTo(Contest, {
  foreignKey: 'contest_id',
  as: 'Contest'
});

ContestProblem.belongsTo(Problem, {
  foreignKey: 'problem_id',
  as: 'Problem'
});

Contest.hasMany(ContestProblem, {
  foreignKey: 'contest_id',
  as: 'ContestProblems'
});

Problem.hasMany(ContestProblem, {
  foreignKey: 'problem_id',
  as: 'ContestProblems'
});

// User-Contest participation
User.belongsToMany(Contest, {
  through: UserContest,
  foreignKey: 'user_id',
  otherKey: 'contest_id',
  as: 'ParticipatedContests'
});

Contest.belongsToMany(User, {
  through: UserContest,
  foreignKey: 'contest_id',
  otherKey: 'user_id',
  as: 'Participants'
});

// UserContest associations
UserContest.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User'
});

UserContest.belongsTo(Contest, {
  foreignKey: 'contest_id',
  as: 'Contest'
});

User.hasMany(UserContest, {
  foreignKey: 'user_id',
  as: 'UserContests'
});

Contest.hasMany(UserContest, {
  foreignKey: 'contest_id',
  as: 'UserContests'
});

// Contest Submission associations
ContestSubmission.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User'
});

ContestSubmission.belongsTo(ContestProblem, {
  foreignKey: 'contest_problem_id',
  as: 'ContestProblem'
});

ContestSubmission.belongsTo(SubmissionCode, {
  foreignKey: 'code_id',
  as: 'Code'
});

User.hasMany(ContestSubmission, {
  foreignKey: 'user_id',
  as: 'ContestSubmissions'
});

ContestProblem.hasMany(ContestSubmission, {
  foreignKey: 'contest_problem_id',
  as: 'ContestSubmissions'
});

SubmissionCode.hasMany(ContestSubmission, {
  foreignKey: 'code_id',
  as: 'ContestSubmissions'
});

// Chat Room associations
ChatRoom.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'Creator'
});

User.hasMany(ChatRoom, {
  foreignKey: 'created_by',
  as: 'CreatedRooms'
});

// Chat Room Members associations
ChatRoom.belongsToMany(User, {
  through: ChatRoomMember,
  foreignKey: 'room_id',
  otherKey: 'user_id',
  as: 'Members'
});

User.belongsToMany(ChatRoom, {
  through: ChatRoomMember,
  foreignKey: 'user_id',
  otherKey: 'room_id',
  as: 'ChatRooms'
});

ChatRoomMember.belongsTo(ChatRoom, {
  foreignKey: 'room_id',
  as: 'Room'
});

ChatRoomMember.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User'
});

// Chat Messages associations
ChatRoom.hasMany(ChatMessage, {
  foreignKey: 'room_id',
  as: 'Messages'
});

ChatMessage.belongsTo(ChatRoom, {
  foreignKey: 'room_id',
  as: 'Room'
});

ChatMessage.belongsTo(User, {
  foreignKey: 'sender_id',
  as: 'Sender'
});

User.hasMany(ChatMessage, {
  foreignKey: 'sender_id',
  as: 'SentMessages'
});

// Self-referencing for reply_to
ChatMessage.belongsTo(ChatMessage, {
  foreignKey: 'reply_to',
  as: 'ReplyToMessage'
});

ChatMessage.hasMany(ChatMessage, {
  foreignKey: 'reply_to',
  as: 'Replies'
});

// Chat Reactions associations
ChatMessage.hasMany(ChatReaction, {
  foreignKey: 'message_id',
  as: 'Reactions'
});

ChatReaction.belongsTo(ChatMessage, {
  foreignKey: 'message_id',
  as: 'Message'
});

ChatReaction.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User'
});

User.hasMany(ChatReaction, {
  foreignKey: 'user_id',
  as: 'Reactions'
});

// Judge Submission associations
JudgeSubmission.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'User'
});

JudgeSubmission.belongsTo(Problem, {
  foreignKey: 'problem_id',
  as: 'Problem'
});

User.hasMany(JudgeSubmission, {
  foreignKey: 'user_id',
  as: 'JudgeSubmissions'
});

Problem.hasMany(JudgeSubmission, {
  foreignKey: 'problem_id',
  as: 'JudgeSubmissions'
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
  LeaderboardEntry,
  Contest,
  ContestProblem,
  UserContest,
  ContestSubmission,
  JudgeSubmission,
  ChatRoom,
  ChatMessage,
  ChatRoomMember,
  ChatReaction
};
