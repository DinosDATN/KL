const Problem = require("./Problem");
const ProblemCategory = require("./ProblemCategory");
const Tag = require("./Tag");
const ProblemTag = require("./ProblemTag");
const ProblemExample = require("./ProblemExample");
const ProblemConstraint = require("./ProblemConstraint");
const StarterCode = require("./StarterCode");
const TestCase = require("./TestCase");
const SubmissionCode = require("./SubmissionCode");
const Submission = require("./Submission");
const ProblemComment = require("./ProblemComment");
const User = require("./User");
const UserProfile = require("./UserProfile");
const UserStats = require("./UserStats");
const UserGoal = require("./UserGoal");
const Achievement = require("./Achievement");
const UserAchievement = require("./UserAchievement");
const UserActivityLog = require("./UserActivityLog");
const ChatRoom = require("./ChatRoom");
const ChatMessage = require("./ChatMessage");
const ChatRoomMember = require("./ChatRoomMember");
const ChatReaction = require("./ChatReaction");
const Level = require("./Level");
const BadgeCategory = require("./BadgeCategory");
const Badge = require("./Badge");
const UserBadge = require("./UserBadge");
const LeaderboardEntry = require("./LeaderboardEntry");
const Contest = require("./Contest");
const ContestProblem = require("./ContestProblem");
const UserContest = require("./UserContest");
const ContestSubmission = require("./ContestSubmission");
const JudgeSubmission = require("./JudgeSubmission");

// Course models
const Course = require("./Course");
const CourseCategory = require("./CourseCategory");
const CourseModule = require("./CourseModule");
const CourseLesson = require("./CourseLesson");
const CourseEnrollment = require("./CourseEnrollment");
const CourseReview = require("./CourseReview");
const InstructorQualification = require("./InstructorQualification");
const CourseLessonCompletion = require("./CourseLessonCompletion");

// Payment models
const CoursePayment = require("./CoursePayment");
const CourseCoupon = require("./CourseCoupon");
const CouponUsage = require("./CouponUsage");

// Document models
const Document = require("./Document");
const DocumentCategory = require("./DocumentCategory");
const DocumentCategoryLink = require("./DocumentCategoryLink");
const DocumentCompletion = require("./DocumentCompletion");
const DocumentModule = require("./DocumentModule");
const DocumentLesson = require("./DocumentLesson");
const DocumentLessonCompletion = require("./DocumentLessonCompletion");
const Topic = require("./Topic");
const Animation = require("./Animation");

// Friendship and Private Chat models
const Friendship = require("./Friendship");
const UserBlock = require("./UserBlock");
const PrivateConversation = require("./PrivateConversation");
const PrivateMessage = require("./PrivateMessage");
const PrivateMessageStatus = require("./PrivateMessageStatus");

// Game models
const Game = require("./Game");
const GameLevel = require("./GameLevel");
const UserGameProcess = require("./UserGameProcess");

// Notification model
const Notification = require("./Notification");

// Reward models
const RewardTransaction = require("./RewardTransaction");
const RewardConfig = require("./RewardConfig");

// Creator Application model
const CreatorApplication = require("./CreatorApplication");

// Define associations

// Course associations
// Course belongs to CourseCategory
Course.belongsTo(CourseCategory, {
  foreignKey: "category_id",
  as: "Category",
});

CourseCategory.hasMany(Course, {
  foreignKey: "category_id",
  as: "Courses",
});

// Course belongs to User (instructor)
Course.belongsTo(User, {
  foreignKey: "instructor_id",
  as: "Instructor",
});

User.hasMany(Course, {
  foreignKey: "instructor_id",
  as: "CreatedCourses",
});

// Course has many CourseModules
Course.hasMany(CourseModule, {
  foreignKey: "course_id",
  as: "Modules",
});

CourseModule.belongsTo(Course, {
  foreignKey: "course_id",
  as: "Course",
});

// CourseModule has many CourseLessons
CourseModule.hasMany(CourseLesson, {
  foreignKey: "module_id",
  as: "Lessons",
});

CourseLesson.belongsTo(CourseModule, {
  foreignKey: "module_id",
  as: "Module",
});

// Course enrollment associations
User.belongsToMany(Course, {
  through: CourseEnrollment,
  foreignKey: "user_id",
  otherKey: "course_id",
  as: "EnrolledCourses",
});

Course.belongsToMany(User, {
  through: CourseEnrollment,
  foreignKey: "course_id",
  otherKey: "user_id",
  as: "EnrolledStudents",
});

CourseEnrollment.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

CourseEnrollment.belongsTo(Course, {
  foreignKey: "course_id",
  as: "Course",
});

// Course has many CourseEnrollments (direct relationship)
Course.hasMany(CourseEnrollment, {
  foreignKey: "course_id",
  as: "Enrollments",
});

// Course review associations
Course.hasMany(CourseReview, {
  foreignKey: "course_id",
  as: "Reviews",
});

CourseReview.belongsTo(Course, {
  foreignKey: "course_id",
  as: "Course",
});

CourseReview.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

User.hasMany(CourseReview, {
  foreignKey: "user_id",
  as: "CourseReviews",
});

// Instructor qualification associations
User.hasMany(InstructorQualification, {
  foreignKey: "user_id",
  as: "Qualifications",
});

InstructorQualification.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

// Course lesson completion associations
CourseLessonCompletion.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

CourseLessonCompletion.belongsTo(Course, {
  foreignKey: "course_id",
  as: "Course",
});

CourseLessonCompletion.belongsTo(CourseLesson, {
  foreignKey: "lesson_id",
  as: "Lesson",
});

User.hasMany(CourseLessonCompletion, {
  foreignKey: "user_id",
  as: "LessonCompletions",
});

Course.hasMany(CourseLessonCompletion, {
  foreignKey: "course_id",
  as: "LessonCompletions",
});

CourseLesson.hasMany(CourseLessonCompletion, {
  foreignKey: "lesson_id",
  as: "Completions",
});

// Payment associations
CoursePayment.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

CoursePayment.belongsTo(Course, {
  foreignKey: "course_id",
  as: "Course",
});

User.hasMany(CoursePayment, {
  foreignKey: "user_id",
  as: "Payments",
});

Course.hasMany(CoursePayment, {
  foreignKey: "course_id",
  as: "Payments",
});

// Enrollment - Payment relationship
CourseEnrollment.belongsTo(CoursePayment, {
  foreignKey: "payment_id",
  as: "Payment",
});

CoursePayment.hasOne(CourseEnrollment, {
  foreignKey: "payment_id",
  as: "Enrollment",
});

// Coupon associations
CourseCoupon.belongsTo(User, {
  foreignKey: "created_by",
  as: "Creator",
});

User.hasMany(CourseCoupon, {
  foreignKey: "created_by",
  as: "CreatedCoupons",
});

// Coupon usage associations
CouponUsage.belongsTo(CourseCoupon, {
  foreignKey: "coupon_id",
  as: "Coupon",
});

CouponUsage.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

CouponUsage.belongsTo(CoursePayment, {
  foreignKey: "payment_id",
  as: "Payment",
});

CourseCoupon.hasMany(CouponUsage, {
  foreignKey: "coupon_id",
  as: "Usages",
});

Problem.belongsTo(ProblemCategory, {
  foreignKey: "category_id",
  as: "Category",
});

ProblemCategory.hasMany(Problem, {
  foreignKey: "category_id",
  as: "Problems",
});

// Problem belongs to User (creator)
Problem.belongsTo(User, {
  foreignKey: "created_by",
  as: "Creator",
});

User.hasMany(Problem, {
  foreignKey: "created_by",
  as: "CreatedProblems",
});

Problem.belongsToMany(Tag, {
  through: ProblemTag,
  foreignKey: "problem_id",
  otherKey: "tag_id",
  as: "Tags",
});

Tag.belongsToMany(Problem, {
  through: ProblemTag,
  foreignKey: "tag_id",
  otherKey: "problem_id",
  as: "Problems",
});

ProblemTag.belongsTo(Problem, { foreignKey: "problem_id" });
ProblemTag.belongsTo(Tag, { foreignKey: "tag_id" });

Problem.hasMany(ProblemExample, {
  foreignKey: "problem_id",
  as: "Examples",
});

ProblemExample.belongsTo(Problem, {
  foreignKey: "problem_id",
});

Problem.hasMany(ProblemConstraint, {
  foreignKey: "problem_id",
  as: "Constraints",
});

ProblemConstraint.belongsTo(Problem, {
  foreignKey: "problem_id",
});

Problem.hasMany(StarterCode, {
  foreignKey: "problem_id",
  as: "StarterCodes",
});

StarterCode.belongsTo(Problem, {
  foreignKey: "problem_id",
});

Problem.hasMany(TestCase, {
  foreignKey: "problem_id",
  as: "TestCases",
});

TestCase.belongsTo(Problem, {
  foreignKey: "problem_id",
});

Problem.hasMany(Submission, {
  foreignKey: "problem_id",
  as: "Submissions",
});

Submission.belongsTo(Problem, {
  foreignKey: "problem_id",
});

Submission.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

User.hasMany(Submission, {
  foreignKey: "user_id",
  as: "Submissions",
});

Submission.belongsTo(SubmissionCode, {
  foreignKey: "code_id",
  as: "Code",
});

SubmissionCode.hasMany(Submission, {
  foreignKey: "code_id",
});

Problem.hasMany(ProblemComment, {
  foreignKey: "problem_id",
  as: "Comments",
});

ProblemComment.belongsTo(Problem, {
  foreignKey: "problem_id",
});

ProblemComment.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

User.hasMany(ProblemComment, {
  foreignKey: "user_id",
  as: "ProblemComments",
});

// User associations
User.hasOne(UserProfile, {
  foreignKey: "user_id",
  as: "Profile",
});

UserProfile.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

User.hasOne(UserStats, {
  foreignKey: "user_id",
  as: "Stats",
});

UserStats.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

// Badge associations
BadgeCategory.hasMany(Badge, {
  foreignKey: "category_id",
  as: "Badges",
});

Badge.belongsTo(BadgeCategory, {
  foreignKey: "category_id",
  as: "Category",
});

// User-Badge many-to-many relationship
User.belongsToMany(Badge, {
  through: UserBadge,
  foreignKey: "user_id",
  otherKey: "badge_id",
  as: "Badges",
});

Badge.belongsToMany(User, {
  through: UserBadge,
  foreignKey: "badge_id",
  otherKey: "user_id",
  as: "Users",
});

UserBadge.belongsTo(User, { foreignKey: "user_id" });
UserBadge.belongsTo(Badge, { foreignKey: "badge_id" });

// Leaderboard associations
User.hasMany(LeaderboardEntry, {
  foreignKey: "user_id",
  as: "LeaderboardEntries",
});

LeaderboardEntry.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

// Contest associations
// Contest belongs to User (creator)
Contest.belongsTo(User, {
  foreignKey: "created_by",
  as: "Creator",
});

User.hasMany(Contest, {
  foreignKey: "created_by",
  as: "CreatedContests",
});

// Contest has many Problems through ContestProblem
Contest.belongsToMany(Problem, {
  through: ContestProblem,
  foreignKey: "contest_id",
  otherKey: "problem_id",
  as: "Problems",
});

Problem.belongsToMany(Contest, {
  through: ContestProblem,
  foreignKey: "problem_id",
  otherKey: "contest_id",
  as: "Contests",
});

// ContestProblem associations
ContestProblem.belongsTo(Contest, {
  foreignKey: "contest_id",
  as: "Contest",
});

ContestProblem.belongsTo(Problem, {
  foreignKey: "problem_id",
  as: "Problem",
});

Contest.hasMany(ContestProblem, {
  foreignKey: "contest_id",
  as: "ContestProblems",
});

Problem.hasMany(ContestProblem, {
  foreignKey: "problem_id",
  as: "ContestProblems",
});

// User-Contest participation
User.belongsToMany(Contest, {
  through: UserContest,
  foreignKey: "user_id",
  otherKey: "contest_id",
  as: "ParticipatedContests",
});

Contest.belongsToMany(User, {
  through: UserContest,
  foreignKey: "contest_id",
  otherKey: "user_id",
  as: "Participants",
});

// UserContest associations
UserContest.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

UserContest.belongsTo(Contest, {
  foreignKey: "contest_id",
  as: "Contest",
});

User.hasMany(UserContest, {
  foreignKey: "user_id",
  as: "UserContests",
});

Contest.hasMany(UserContest, {
  foreignKey: "contest_id",
  as: "UserContests",
});

// Contest Submission associations
ContestSubmission.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

ContestSubmission.belongsTo(ContestProblem, {
  foreignKey: "contest_problem_id",
  as: "ContestProblem",
});

ContestSubmission.belongsTo(SubmissionCode, {
  foreignKey: "code_id",
  as: "Code",
});

User.hasMany(ContestSubmission, {
  foreignKey: "user_id",
  as: "ContestSubmissions",
});

ContestProblem.hasMany(ContestSubmission, {
  foreignKey: "contest_problem_id",
  as: "ContestSubmissions",
});

SubmissionCode.hasMany(ContestSubmission, {
  foreignKey: "code_id",
  as: "ContestSubmissions",
});

// Chat Room associations
ChatRoom.belongsTo(User, {
  foreignKey: "created_by",
  as: "Creator",
});

User.hasMany(ChatRoom, {
  foreignKey: "created_by",
  as: "CreatedRooms",
});

// Chat Room Members associations
ChatRoom.belongsToMany(User, {
  through: ChatRoomMember,
  foreignKey: "room_id",
  otherKey: "user_id",
  as: "Members",
});

User.belongsToMany(ChatRoom, {
  through: ChatRoomMember,
  foreignKey: "user_id",
  otherKey: "room_id",
  as: "ChatRooms",
});

ChatRoomMember.belongsTo(ChatRoom, {
  foreignKey: "room_id",
  as: "Room",
});

ChatRoomMember.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

// Chat Messages associations
ChatRoom.hasMany(ChatMessage, {
  foreignKey: "room_id",
  as: "Messages",
});

ChatMessage.belongsTo(ChatRoom, {
  foreignKey: "room_id",
  as: "Room",
});

ChatMessage.belongsTo(User, {
  foreignKey: "sender_id",
  as: "Sender",
});

User.hasMany(ChatMessage, {
  foreignKey: "sender_id",
  as: "SentMessages",
});

// Self-referencing for reply_to
ChatMessage.belongsTo(ChatMessage, {
  foreignKey: "reply_to",
  as: "ReplyToMessage",
});

ChatMessage.hasMany(ChatMessage, {
  foreignKey: "reply_to",
  as: "Replies",
});

// Chat Reactions associations
ChatMessage.hasMany(ChatReaction, {
  foreignKey: "message_id",
  as: "Reactions",
});

ChatReaction.belongsTo(ChatMessage, {
  foreignKey: "message_id",
  as: "Message",
});

ChatReaction.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

User.hasMany(ChatReaction, {
  foreignKey: "user_id",
  as: "Reactions",
});

// Judge Submission associations
JudgeSubmission.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

JudgeSubmission.belongsTo(Problem, {
  foreignKey: "problem_id",
  as: "Problem",
});

User.hasMany(JudgeSubmission, {
  foreignKey: "user_id",
  as: "JudgeSubmissions",
});

Problem.hasMany(JudgeSubmission, {
  foreignKey: "problem_id",
  as: "JudgeSubmissions",
});

// Friendship associations
// Friendship belongs to Users for requester and addressee
Friendship.belongsTo(User, {
  foreignKey: "requester_id",
  as: "Requester",
});

Friendship.belongsTo(User, {
  foreignKey: "addressee_id",
  as: "Addressee",
});

User.hasMany(Friendship, {
  foreignKey: "requester_id",
  as: "SentFriendRequests",
});

User.hasMany(Friendship, {
  foreignKey: "addressee_id",
  as: "ReceivedFriendRequests",
});

// User Block associations
UserBlock.belongsTo(User, {
  foreignKey: "blocker_id",
  as: "Blocker",
});

UserBlock.belongsTo(User, {
  foreignKey: "blocked_id",
  as: "BlockedUser",
});

User.hasMany(UserBlock, {
  foreignKey: "blocker_id",
  as: "BlockedUsers",
});

User.hasMany(UserBlock, {
  foreignKey: "blocked_id",
  as: "BlockingUsers",
});

// Private Conversation associations
PrivateConversation.belongsTo(User, {
  foreignKey: "participant1_id",
  as: "Participant1",
});

PrivateConversation.belongsTo(User, {
  foreignKey: "participant2_id",
  as: "Participant2",
});

User.hasMany(PrivateConversation, {
  foreignKey: "participant1_id",
  as: "ConversationsAsParticipant1",
});

User.hasMany(PrivateConversation, {
  foreignKey: "participant2_id",
  as: "ConversationsAsParticipant2",
});

// Private Message associations
PrivateConversation.hasMany(PrivateMessage, {
  foreignKey: "conversation_id",
  as: "Messages",
});

PrivateMessage.belongsTo(PrivateConversation, {
  foreignKey: "conversation_id",
  as: "Conversation",
});

PrivateMessage.belongsTo(User, {
  foreignKey: "sender_id",
  as: "Sender",
});

PrivateMessage.belongsTo(User, {
  foreignKey: "receiver_id",
  as: "Receiver",
});

User.hasMany(PrivateMessage, {
  foreignKey: "sender_id",
  as: "SentPrivateMessages",
});

User.hasMany(PrivateMessage, {
  foreignKey: "receiver_id",
  as: "ReceivedPrivateMessages",
});

// Self-referencing for reply_to_message_id
PrivateMessage.belongsTo(PrivateMessage, {
  foreignKey: "reply_to_message_id",
  as: "ReplyToMessage",
});

PrivateMessage.hasMany(PrivateMessage, {
  foreignKey: "reply_to_message_id",
  as: "Replies",
});

// Private Message Status associations
PrivateMessage.hasMany(PrivateMessageStatus, {
  foreignKey: "message_id",
  as: "MessageStatuses",
});

PrivateMessageStatus.belongsTo(PrivateMessage, {
  foreignKey: "message_id",
  as: "Message",
});

PrivateMessageStatus.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

User.hasMany(PrivateMessageStatus, {
  foreignKey: "user_id",
  as: "MessageStatuses",
});

// Private Conversation - Last Message association
PrivateConversation.belongsTo(PrivateMessage, {
  foreignKey: "last_message_id",
  as: "LastMessage",
});

// Document associations
// Document belongs to Topic
Document.belongsTo(Topic, {
  foreignKey: "topic_id",
  as: "Topic",
});

Topic.hasMany(Document, {
  foreignKey: "topic_id",
  as: "Documents",
});

// Document belongs to User (creator)
Document.belongsTo(User, {
  foreignKey: "created_by",
  as: "Creator",
});

User.hasMany(Document, {
  foreignKey: "created_by",
  as: "CreatedDocuments",
});

// Document has many DocumentModules
Document.hasMany(DocumentModule, {
  foreignKey: "document_id",
  as: "Modules",
});

DocumentModule.belongsTo(Document, {
  foreignKey: "document_id",
  as: "Document",
});

// DocumentModule has many DocumentLessons
DocumentModule.hasMany(DocumentLesson, {
  foreignKey: "module_id",
  as: "Lessons",
});

DocumentLesson.belongsTo(DocumentModule, {
  foreignKey: "module_id",
  as: "Module",
});

// Document category associations
Document.belongsToMany(DocumentCategory, {
  through: DocumentCategoryLink,
  foreignKey: "document_id",
  otherKey: "category_id",
  as: "Categories",
});

DocumentCategory.belongsToMany(Document, {
  through: DocumentCategoryLink,
  foreignKey: "category_id",
  otherKey: "document_id",
  as: "Documents",
});

DocumentCategoryLink.belongsTo(Document, {
  foreignKey: "document_id",
  as: "Document",
});

DocumentCategoryLink.belongsTo(DocumentCategory, {
  foreignKey: "category_id",
  as: "Category",
});

// Document completion associations
User.belongsToMany(Document, {
  through: DocumentCompletion,
  foreignKey: "user_id",
  otherKey: "document_id",
  as: "CompletedDocuments",
});

Document.belongsToMany(User, {
  through: DocumentCompletion,
  foreignKey: "document_id",
  otherKey: "user_id",
  as: "CompletedByUsers",
});

DocumentCompletion.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

DocumentCompletion.belongsTo(Document, {
  foreignKey: "document_id",
  as: "Document",
});

// Document lesson completion associations
User.belongsToMany(DocumentLesson, {
  through: DocumentLessonCompletion,
  foreignKey: "user_id",
  otherKey: "lesson_id",
  as: "CompletedLessons",
});

DocumentLesson.belongsToMany(User, {
  through: DocumentLessonCompletion,
  foreignKey: "lesson_id",
  otherKey: "user_id",
  as: "CompletedByUsers",
});

DocumentLessonCompletion.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

DocumentLessonCompletion.belongsTo(DocumentLesson, {
  foreignKey: "lesson_id",
  as: "Lesson",
});

DocumentLesson.hasMany(DocumentLessonCompletion, {
  foreignKey: "lesson_id",
  as: "Completions",
});

// Animation associations
Animation.belongsTo(Document, {
  foreignKey: "document_id",
  as: "Document",
});

Animation.belongsTo(DocumentLesson, {
  foreignKey: "lesson_id",
  as: "Lesson",
});

Document.hasMany(Animation, {
  foreignKey: "document_id",
  as: "Animations",
});

DocumentLesson.hasMany(Animation, {
  foreignKey: "lesson_id",
  as: "Animations",
});

// Game associations
// Game has many GameLevels
Game.hasMany(GameLevel, {
  foreignKey: "game_id",
  as: "Levels",
});

GameLevel.belongsTo(Game, {
  foreignKey: "game_id",
  as: "Game",
});

// UserGameProcess associations
UserGameProcess.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

UserGameProcess.belongsTo(Game, {
  foreignKey: "game_id",
  as: "Game",
});

UserGameProcess.belongsTo(GameLevel, {
  foreignKey: "level_id",
  as: "Level",
});

User.hasMany(UserGameProcess, {
  foreignKey: "user_id",
  as: "GameProcesses",
});

Game.hasMany(UserGameProcess, {
  foreignKey: "game_id",
  as: "UserProcesses",
});

GameLevel.hasMany(UserGameProcess, {
  foreignKey: "level_id",
  as: "UserProcesses",
});

// Notification associations
Notification.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

User.hasMany(Notification, {
  foreignKey: "user_id",
  as: "Notifications",
});

// Reward Transaction associations
RewardTransaction.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

User.hasMany(RewardTransaction, {
  foreignKey: "user_id",
  as: "RewardTransactions",
});

// User Goal associations
User.hasMany(UserGoal, {
  foreignKey: "user_id",
  as: "Goals",
});

UserGoal.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

// Achievement associations
User.belongsToMany(Achievement, {
  through: UserAchievement,
  foreignKey: "user_id",
  otherKey: "achievement_id",
  as: "Achievements",
});

Achievement.belongsToMany(User, {
  through: UserAchievement,
  foreignKey: "achievement_id",
  otherKey: "user_id",
  as: "Users",
});

UserAchievement.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

UserAchievement.belongsTo(Achievement, {
  foreignKey: "achievement_id",
  as: "Achievement",
});

User.hasMany(UserAchievement, {
  foreignKey: "user_id",
  as: "UserAchievements",
});

Achievement.hasMany(UserAchievement, {
  foreignKey: "achievement_id",
  as: "UserAchievements",
});

// User Activity Log associations
User.hasMany(UserActivityLog, {
  foreignKey: "user_id",
  as: "ActivityLogs",
});

UserActivityLog.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

// Creator Application associations
CreatorApplication.belongsTo(User, {
  foreignKey: "user_id",
  as: "User",
});

CreatorApplication.belongsTo(User, {
  foreignKey: "reviewed_by",
  as: "Reviewer",
});

User.hasMany(CreatorApplication, {
  foreignKey: "user_id",
  as: "CreatorApplications",
});

User.hasMany(CreatorApplication, {
  foreignKey: "reviewed_by",
  as: "ReviewedApplications",
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
  UserGoal,
  Achievement,
  UserAchievement,
  UserActivityLog,
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
  ChatReaction,
  // Course models
  Course,
  CourseCategory,
  CourseModule,
  CourseLesson,
  CourseEnrollment,
  CourseReview,
  InstructorQualification,
  CourseLessonCompletion,
  // Payment models
  CoursePayment,
  CourseCoupon,
  CouponUsage,
  // Document models
  Document,
  DocumentCategory,
  DocumentCategoryLink,
  DocumentCompletion,
  DocumentModule,
  DocumentLesson,
  DocumentLessonCompletion,
  Topic,
  Animation,
  // Friendship and Private Chat models
  Friendship,
  UserBlock,
  PrivateConversation,
  PrivateMessage,
  PrivateMessageStatus,
  // Game models
  Game,
  GameLevel,
  UserGameProcess,
  // Notification model
  Notification,
  // Reward models
  RewardTransaction,
  RewardConfig,
  // Creator Application model
  CreatorApplication,
};
