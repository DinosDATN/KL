/**
 * Service to fetch public data for RAG (Retrieval-Augmented Generation)
 * Returns data in nested JSON format similar to cake.json structure
 */

const Course = require('../models/Course');
const CourseCategory = require('../models/CourseCategory');
const CourseModule = require('../models/CourseModule');
const CourseLesson = require('../models/CourseLesson');
const CourseReview = require('../models/CourseReview');
// Note: CourseLanguage and RelatedCourse models may not exist yet
// We'll handle them with raw queries if needed
const Testimonial = require('../models/Testimonial');
const InstructorQualification = require('../models/InstructorQualification');

const Document = require('../models/Document');
const DocumentCategory = require('../models/DocumentCategory');
const DocumentCategoryLink = require('../models/DocumentCategoryLink');
const DocumentModule = require('../models/DocumentModule');
const DocumentLesson = require('../models/DocumentLesson');
const Topic = require('../models/Topic');
const Animation = require('../models/Animation');

const Problem = require('../models/Problem');
const ProblemCategory = require('../models/ProblemCategory');
const Tag = require('../models/Tag');
const ProblemTag = require('../models/ProblemTag');
const ProblemExample = require('../models/ProblemExample');
const ProblemConstraint = require('../models/ProblemConstraint');
const TestCase = require('../models/TestCase');
const StarterCode = require('../models/StarterCode');
const ProblemComment = require('../models/ProblemComment');

const Contest = require('../models/Contest');
const ContestProblem = require('../models/ContestProblem');

const BadgeCategory = require('../models/BadgeCategory');
const Badge = require('../models/Badge');
const Level = require('../models/Level');
const LeaderboardEntry = require('../models/LeaderboardEntry');
const Achievement = require('../models/Achievement');

// Note: Forum models may not exist yet - will handle with raw queries if needed

const Game = require('../models/Game');
const GameLevel = require('../models/GameLevel');

const RewardConfig = require('../models/RewardConfig');
const CourseCoupon = require('../models/CourseCoupon');
// Note: Translation model may not exist yet - will handle with raw queries if needed
// Note: Forum models may not exist - using raw queries

const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const UserStats = require('../models/UserStats');
const UserAchievement = require('../models/UserAchievement');

const { Op } = require('sequelize');
const { sequelize } = require('../config/sequelize');

/**
 * Helper function to convert Sequelize instance to plain object
 */
function toPlainObject(instance) {
  if (!instance) return null;
  if (Array.isArray(instance)) {
    return instance.map(item => toPlainObject(item));
  }
  return instance.get ? instance.get({ plain: true }) : instance;
}

/**
 * Get course languages using raw query
 */
async function getCourseLanguages(courseId) {
  try {
    const [results] = await sequelize.query(
      'SELECT id, course_id, language, created_at FROM course_languages WHERE course_id = :courseId',
      {
        replacements: { courseId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    return results || [];
  } catch (error) {
    console.warn('Error fetching course languages:', error.message);
    return [];
  }
}

/**
 * Get related courses using raw query
 */
async function getRelatedCourses(courseId) {
  try {
    const [results] = await sequelize.query(
      'SELECT id, course_id, related_course_id, created_at FROM related_courses WHERE course_id = :courseId',
      {
        replacements: { courseId },
        type: sequelize.QueryTypes.SELECT
      }
    );
    return results || [];
  } catch (error) {
    console.warn('Error fetching related courses:', error.message);
    return [];
  }
}

/**
 * Get all public courses with nested data
 */
async function getPublicCourses() {
  const courses = await Course.findAll({
    where: {
      status: 'published',
      is_deleted: false
    },
    include: [
      {
        model: CourseCategory,
        as: 'Category',
        attributes: ['id', 'name', 'description', 'created_at']
      },
      {
        model: CourseModule,
        as: 'Modules',
        attributes: ['id', 'title', 'position', 'created_at'],
        include: [
          {
            model: CourseLesson,
            as: 'Lessons',
            attributes: ['id', 'title', 'type', 'duration', 'position', 'created_at']
          }
        ],
        order: [['position', 'ASC']]
      },
      {
        model: CourseReview,
        as: 'Reviews',
        where: { verified: true },
        required: false,
        attributes: ['id', 'rating', 'comment', 'helpful', 'not_helpful', 'created_at'],
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name', 'avatar_url']
          }
        ]
      },
      // CourseLanguage and RelatedCourse - using raw query if models don't exist
    ],
    attributes: [
      'id', 'title', 'description', 'thumbnail',
      'rating', 'students', 'level', 'duration',
      'price', 'original_price', 'discount',
      'status', 'is_premium', 'is_free',
      'publish_date', 'created_at'
    ],
    order: [['created_at', 'DESC']]
  });

  const coursesWithRelations = await Promise.all(
    courses.map(async (course) => {
    const plain = toPlainObject(course);
    return {
      id: plain.id,
      title: plain.title,
      description: plain.description,
      thumbnail: plain.thumbnail,
      rating: plain.rating,
      students: plain.students,
      level: plain.level,
      duration: plain.duration,
      price: parseFloat(plain.price) || 0,
      original_price: parseFloat(plain.original_price) || 0,
      discount: plain.discount || 0,
      status: plain.status,
      is_premium: plain.is_premium,
      is_free: plain.is_free,
      publish_date: plain.publish_date,
      created_at: plain.created_at,
      category: plain.Category ? {
        id: plain.Category.id,
        name: plain.Category.name,
        description: plain.Category.description,
        created_at: plain.Category.created_at
      } : null,
      modules: plain.Modules ? plain.Modules.map(module => ({
        id: module.id,
        title: module.title,
        position: module.position,
        created_at: module.created_at,
        lessons: module.Lessons ? module.Lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          duration: lesson.duration,
          position: lesson.position,
          created_at: lesson.created_at
        })) : []
      })) : [],
      reviews: plain.Reviews ? plain.Reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        helpful: review.helpful,
        not_helpful: review.not_helpful,
        created_at: review.created_at,
        user: review.User ? {
          id: review.User.id,
          name: review.User.name,
          avatar_url: review.User.avatar_url
        } : null
      })) : [],
      languages: await getCourseLanguages(plain.id),
      related_courses: await getRelatedCourses(plain.id)
    };
    })
  );

  return coursesWithRelations;
}

/**
 * Get all public documents with nested data
 */
async function getPublicDocuments() {
  const documents = await Document.findAll({
    where: {
      is_deleted: false
    },
    include: [
      {
        model: Topic,
        as: 'Topic',
        attributes: ['id', 'name', 'created_at']
      },
      {
        model: DocumentCategoryLink,
        as: 'CategoryLinks',
        attributes: ['id', 'category_id', 'created_at'],
        include: [
          {
            model: DocumentCategory,
            as: 'Category',
            attributes: ['id', 'name', 'description', 'created_at']
          }
        ]
      },
      {
        model: DocumentModule,
        as: 'Modules',
        attributes: ['id', 'title', 'position', 'created_at'],
        include: [
          {
            model: DocumentLesson,
            as: 'Lessons',
            attributes: ['id', 'title', 'content', 'code_example', 'position', 'created_at'],
            include: [
              {
                model: Animation,
                as: 'Animations',
                attributes: ['id', 'title', 'type', 'description', 'embed_code', 'created_at']
              }
            ],
            order: [['position', 'ASC']]
          }
        ],
        order: [['position', 'ASC']]
      },
      {
        model: Animation,
        as: 'Animations',
        attributes: ['id', 'title', 'type', 'description', 'embed_code', 'created_at']
      }
    ],
    attributes: [
      'id', 'title', 'description', 'content',
      'level', 'duration', 'students', 'rating',
      'thumbnail_url', 'created_at'
    ],
    order: [['created_at', 'DESC']]
  });

  return documents.map(doc => {
    const plain = toPlainObject(doc);
    return {
      id: plain.id,
      title: plain.title,
      description: plain.description,
      content: plain.content,
      level: plain.level,
      duration: plain.duration,
      students: plain.students,
      rating: plain.rating,
      thumbnail_url: plain.thumbnail_url,
      created_at: plain.created_at,
      topic: plain.Topic ? {
        id: plain.Topic.id,
        name: plain.Topic.name,
        created_at: plain.Topic.created_at
      } : null,
      categories: plain.Categories || [],
      modules: plain.Modules ? plain.Modules.map(module => ({
        id: module.id,
        title: module.title,
        position: module.position,
        created_at: module.created_at,
        lessons: module.Lessons ? module.Lessons.map(lesson => ({
          id: lesson.id,
          title: lesson.title,
          content: lesson.content,
          code_example: lesson.code_example,
          position: lesson.position,
          created_at: lesson.created_at,
          animations: lesson.Animations || []
        })) : []
      })) : [],
      animations: plain.Animations || []
    };
  });
}

/**
 * Get all public problems with nested data
 */
async function getPublicProblems() {
  const problems = await Problem.findAll({
    where: {
      is_premium: false,
      is_deleted: false
    },
    include: [
      {
        model: ProblemCategory,
        as: 'Category',
        attributes: ['id', 'name', 'description', 'created_at']
      },
      {
        model: Tag,
        as: 'Tags',
        through: { attributes: [] },
        attributes: ['id', 'name', 'created_at']
      },
      {
        model: ProblemExample,
        as: 'Examples',
        attributes: ['id', 'input', 'output', 'explanation', 'created_at']
      },
      {
        model: ProblemConstraint,
        as: 'Constraints',
        attributes: ['id', 'constraint_text', 'created_at']
      },
      {
        model: TestCase,
        as: 'TestCases',
        where: { is_sample: true },
        required: false,
        attributes: ['id', 'input', 'expected_output', 'is_sample', 'created_at']
      },
      {
        model: StarterCode,
        as: 'StarterCodes',
        attributes: ['id', 'language', 'code', 'created_at']
      },
      {
        model: ProblemComment,
        as: 'Comments',
        attributes: ['id', 'content', 'created_at', 'updated_at'],
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name', 'avatar_url']
          }
        ]
      }
    ],
    attributes: [
      'id', 'title', 'description', 'difficulty',
      'estimated_time', 'likes', 'dislikes', 'acceptance',
      'total_submissions', 'solved_count',
      'is_new', 'is_popular', 'created_at'
    ],
    order: [['created_at', 'DESC']]
  });

  return problems.map(problem => {
    const plain = toPlainObject(problem);
    return {
      id: plain.id,
      title: plain.title,
      description: plain.description,
      difficulty: plain.difficulty,
      estimated_time: plain.estimated_time,
      likes: plain.likes,
      dislikes: plain.dislikes,
      acceptance: parseFloat(plain.acceptance) || 0,
      total_submissions: plain.total_submissions,
      solved_count: plain.solved_count,
      is_new: plain.is_new,
      is_popular: plain.is_popular,
      created_at: plain.created_at,
      category: plain.Category ? {
        id: plain.Category.id,
        name: plain.Category.name,
        description: plain.Category.description,
        created_at: plain.Category.created_at
      } : null,
      tags: plain.Tags || [],
      examples: plain.Examples || [],
      constraints: plain.Constraints || [],
      test_cases: plain.TestCases || [],
      starter_codes: plain.StarterCodes || [],
      comments: plain.Comments ? plain.Comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: comment.User ? {
          id: comment.User.id,
          name: comment.User.name,
          avatar_url: comment.User.avatar_url
        } : null
      })) : []
    };
  });
}

/**
 * Get all public contests with nested data
 */
async function getPublicContests() {
  const contests = await Contest.findAll({
    where: {
      is_deleted: false
    },
    include: [
      {
        model: ContestProblem,
        as: 'Problems',
        attributes: ['id', 'problem_id', 'score', 'created_at'],
        include: [
          {
            model: Problem,
            as: 'Problem',
            attributes: ['id', 'title', 'difficulty', 'description']
          }
        ]
      }
    ],
    attributes: ['id', 'title', 'description', 'start_time', 'end_time', 'created_at'],
    order: [['created_at', 'DESC']]
  });

  return contests.map(contest => {
    const plain = toPlainObject(contest);
    return {
      id: plain.id,
      title: plain.title,
      description: plain.description,
      start_time: plain.start_time,
      end_time: plain.end_time,
      created_at: plain.created_at,
      problems: plain.Problems ? plain.Problems.map(cp => ({
        id: cp.id,
        problem_id: cp.problem_id,
        score: cp.score,
        created_at: cp.created_at,
        problem: cp.Problem ? {
          id: cp.Problem.id,
          title: cp.Problem.title,
          difficulty: cp.Problem.difficulty,
          description: cp.Problem.description
        } : null
      })) : []
    };
  });
}

/**
 * Get all public gamification data
 */
async function getPublicGamification() {
  const [badgeCategories, badges, levels, leaderboardEntries, achievements] = await Promise.all([
    BadgeCategory.findAll({
      attributes: ['id', 'name', 'description', 'created_at'],
      order: [['created_at', 'ASC']]
    }),
    Badge.findAll({
      include: [
        {
          model: BadgeCategory,
          as: 'Category',
          attributes: ['id', 'name', 'description']
        }
      ],
      attributes: ['id', 'name', 'description', 'icon', 'rarity', 'category_id', 'created_at'],
      order: [['created_at', 'ASC']]
    }),
    Level.findAll({
      attributes: ['id', 'level', 'name', 'xp_required', 'xp_to_next', 'color', 'icon', 'created_at'],
      order: [['level', 'ASC']]
    }),
    LeaderboardEntry.findAll({
      attributes: ['id', 'user_id', 'xp', 'type', 'created_at', 'updated_at'],
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'avatar_url']
        }
      ],
      order: [['xp', 'DESC']],
      limit: 100
    }),
    Achievement.findAll({
      attributes: ['id', 'title', 'description', 'icon', 'category', 'rarity', 'created_at'],
      order: [['created_at', 'ASC']]
    })
  ]);

  return {
    badge_categories: toPlainObject(badgeCategories),
    badges: badges.map(badge => {
      const plain = toPlainObject(badge);
      return {
        id: plain.id,
        name: plain.name,
        description: plain.description,
        icon: plain.icon,
        rarity: plain.rarity,
        category_id: plain.category_id,
        created_at: plain.created_at,
        category: plain.Category ? {
          id: plain.Category.id,
          name: plain.Category.name,
          description: plain.Category.description
        } : null
      };
    }),
    levels: toPlainObject(levels),
    leaderboard_entries: leaderboardEntries.map(entry => {
      const plain = toPlainObject(entry);
      return {
        id: plain.id,
        user_id: plain.user_id,
        xp: plain.xp,
        type: plain.type,
        created_at: plain.created_at,
        updated_at: plain.updated_at,
        user: plain.User ? {
          id: plain.User.id,
          name: plain.User.name,
          avatar_url: plain.User.avatar_url
        } : null
      };
    }),
    achievements: toPlainObject(achievements)
  };
}

/**
 * Get all public forums data using raw query
 */
async function getPublicForums() {
  try {
    // Use raw query since Forum models may not exist
    const [forums] = await sequelize.query(
      `SELECT f.id, f.title, f.description, f.type, f.related_id, f.created_at,
       (SELECT COUNT(*) FROM forum_posts WHERE forum_id = f.id) as post_count
       FROM forums f
       ORDER BY f.created_at DESC
       LIMIT 100`,
      { type: sequelize.QueryTypes.SELECT }
    );

    // Get posts for each forum
    const forumsWithPosts = await Promise.all(
      forums.map(async (forum) => {
        const [posts] = await sequelize.query(
          `SELECT fp.id, fp.forum_id, fp.user_id, fp.content, fp.votes, 
           fp.created_at, fp.updated_at,
           u.id as user_id, u.name as user_name, u.avatar_url as user_avatar_url
           FROM forum_posts fp
           LEFT JOIN users u ON fp.user_id = u.id
           WHERE fp.forum_id = :forumId
           ORDER BY fp.created_at DESC
           LIMIT 50`,
          {
            replacements: { forumId: forum.id },
            type: sequelize.QueryTypes.SELECT
          }
        );

        return {
          id: forum.id,
          title: forum.title,
          description: forum.description,
          type: forum.type,
          related_id: forum.related_id,
          created_at: forum.created_at,
          posts: posts.map(post => ({
            id: post.id,
            content: post.content,
            votes: post.votes,
            created_at: post.created_at,
            updated_at: post.updated_at,
            user: post.user_id ? {
              id: post.user_id,
              name: post.user_name,
              avatar_url: post.user_avatar_url
            } : null
          }))
        };
      })
    );

    return forumsWithPosts;
  } catch (error) {
    console.warn('Error fetching forums (models may not exist):', error.message);
    return [];
  }
}

/**
 * Get all public forums data (old version with models - kept for reference)
 */
async function getPublicForumsOld() {
  const forums = await Forum.findAll({
    include: [
      {
        model: ForumPost,
        as: 'Posts',
        attributes: ['id', 'content', 'votes', 'created_at', 'updated_at'],
        include: [
          {
            model: User,
            as: 'User',
            attributes: ['id', 'name', 'avatar_url']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: 50
      }
    ],
    attributes: ['id', 'title', 'description', 'type', 'related_id', 'created_at'],
    order: [['created_at', 'DESC']]
  });

  return forums.map(forum => {
    const plain = toPlainObject(forum);
    return {
      id: plain.id,
      title: plain.title,
      description: plain.description,
      type: plain.type,
      related_id: plain.related_id,
      created_at: plain.created_at,
      posts: plain.Posts ? plain.Posts.map(post => ({
        id: post.id,
        content: post.content,
        votes: post.votes,
        created_at: post.created_at,
        updated_at: post.updated_at,
        user: post.User ? {
          id: post.User.id,
          name: post.User.name,
          avatar_url: post.User.avatar_url
        } : null
      })) : []
    };
  });
}

/**
 * Get all public games data
 */
async function getPublicGames() {
  const games = await Game.findAll({
    include: [
      {
        model: GameLevel,
        as: 'Levels',
        attributes: ['id', 'level_number', 'difficulty', 'created_at'],
        order: [['level_number', 'ASC']]
      }
    ],
    attributes: ['id', 'name', 'description', 'created_at'],
    order: [['created_at', 'ASC']]
  });

  return games.map(game => {
    const plain = toPlainObject(game);
    return {
      id: plain.id,
      name: plain.name,
      description: plain.description,
      created_at: plain.created_at,
      levels: plain.Levels || []
    };
  });
}

/**
 * Get all public system data
 */
async function getPublicSystemData() {
  const [rewardConfigs, coupons] = await Promise.all([
    RewardConfig.findAll({
      where: { is_active: true },
      attributes: ['id', 'config_key', 'config_value', 'description', 'is_active', 'created_at'],
      order: [['created_at', 'ASC']]
    }),
    CourseCoupon.findAll({
      where: {
        is_active: true,
        valid_from: { [Op.lte]: new Date() },
        valid_until: { [Op.gte]: new Date() }
      },
      attributes: [
        'id', 'code', 'description', 'discount_type',
        'discount_value', 'min_purchase_amount', 'max_discount_amount',
        'valid_from', 'valid_until', 'is_active'
      ],
      order: [['created_at', 'DESC']]
    })
  ]);

  // Get translations using raw query if model doesn't exist
  let translations = [];
  try {
    const [results] = await sequelize.query(
      'SELECT id, entity_type, entity_id, language, field, translated_text, created_at FROM translations ORDER BY created_at ASC',
      { type: sequelize.QueryTypes.SELECT }
    );
    translations = results || [];
  } catch (error) {
    console.warn('Error fetching translations (table may not exist):', error.message);
  }

  return {
    reward_configs: toPlainObject(rewardConfigs),
    course_coupons: toPlainObject(coupons),
    translations: translations
  };
}

/**
 * Get all public user data (limited to public profiles)
 */
async function getPublicUsers() {
  const users = await User.findAll({
    where: {
      is_active: true
    },
    include: [
      {
        model: UserProfile,
        as: 'Profile',
        where: { visibility_profile: true },
        required: false,
        attributes: [
          'id', 'user_id', 'bio', 'birthday', 'gender',
          'website_url', 'github_url', 'linkedin_url',
          'preferred_language', 'theme_mode', 'layout'
        ]
      },
      {
        model: UserStats,
        as: 'Stats',
        where: { visibility_progress: true },
        required: false,
        attributes: [
          'id', 'user_id', 'xp', 'level', 'rank',
          'courses_completed', 'hours_learned', 'problems_solved',
          'current_streak', 'longest_streak', 'average_score',
          'reward_points'
        ]
      },
      {
        model: UserAchievement,
        as: 'Achievements',
        where: { visibility_achievements: true },
        required: false,
        attributes: ['id', 'user_id', 'achievement_id', 'date_earned', 'created_at'],
        include: [
          {
            model: Achievement,
            as: 'Achievement',
            attributes: ['id', 'title', 'description', 'icon', 'category', 'rarity']
          }
        ]
      },
      {
        model: InstructorQualification,
        as: 'Qualifications',
        attributes: ['id', 'title', 'institution', 'date', 'credential_url', 'created_at']
      },
      {
        model: Testimonial,
        as: 'Testimonials',
        attributes: [
          'id', 'student_name', 'student_avatar',
          'rating', 'comment', 'course_title', 'date', 'created_at'
        ]
      }
    ],
    attributes: ['id', 'name', 'avatar_url', 'role', 'is_active', 'created_at'],
    order: [['created_at', 'DESC']],
    limit: 1000
  });

  return users.map(user => {
    const plain = toPlainObject(user);
    return {
      id: plain.id,
      name: plain.name,
      avatar_url: plain.avatar_url,
      role: plain.role,
      is_active: plain.is_active,
      created_at: plain.created_at,
      profile: plain.Profile || null,
      stats: plain.Stats || null,
      achievements: plain.Achievements ? plain.Achievements.map(ua => ({
        id: ua.id,
        user_id: ua.user_id,
        achievement_id: ua.achievement_id,
        date_earned: ua.date_earned,
        created_at: ua.created_at,
        achievement: ua.Achievement ? {
          id: ua.Achievement.id,
          title: ua.Achievement.title,
          description: ua.Achievement.description,
          icon: ua.Achievement.icon,
          category: ua.Achievement.category,
          rarity: ua.Achievement.rarity
        } : null
      })) : [],
      qualifications: plain.Qualifications || [],
      testimonials: plain.Testimonials || []
    };
  });
}

/**
 * Get all public data in nested JSON format
 */
async function getAllPublicData() {
  try {
    const [
      courses,
      documents,
      problems,
      contests,
      gamification,
      forums,
      games,
      systemData,
      users
    ] = await Promise.all([
      getPublicCourses(),
      getPublicDocuments(),
      getPublicProblems(),
      getPublicContests(),
      getPublicGamification(),
      getPublicForums(),
      getPublicGames(),
      getPublicSystemData(),
      getPublicUsers()
    ]);

    return {
      items: {
        courses: {
          course: courses
        },
        documents: {
          document: documents
        },
        problems: {
          problem: problems
        },
        contests: {
          contest: contests
        },
        gamification: gamification,
        forums: {
          forum: forums
        },
        games: {
          game: games
        },
        system: systemData,
        users: {
          user: users
        }
      }
    };
  } catch (error) {
    console.error('Error fetching public data:', error);
    throw error;
  }
}

/**
 * Get specific category of public data
 */
async function getPublicDataByCategory(category) {
  switch (category) {
    case 'courses':
      return {
        items: {
          courses: {
            course: await getPublicCourses()
          }
        }
      };
    case 'documents':
      return {
        items: {
          documents: {
            document: await getPublicDocuments()
          }
        }
      };
    case 'problems':
      return {
        items: {
          problems: {
            problem: await getPublicProblems()
          }
        }
      };
    case 'contests':
      return {
        items: {
          contests: {
            contest: await getPublicContests()
          }
        }
      };
    case 'gamification':
      return {
        items: {
          gamification: await getPublicGamification()
        }
      };
    case 'forums':
      return {
        items: {
          forums: {
            forum: await getPublicForums()
          }
        }
      };
    case 'games':
      return {
        items: {
          games: {
            game: await getPublicGames()
          }
        }
      };
    case 'system':
      return {
        items: {
          system: await getPublicSystemData()
        }
      };
    case 'users':
      return {
        items: {
          users: {
            user: await getPublicUsers()
          }
        }
      };
    default:
      throw new Error(`Unknown category: ${category}`);
  }
}

module.exports = {
  getAllPublicData,
  getPublicDataByCategory,
  getPublicCourses,
  getPublicDocuments,
  getPublicProblems,
  getPublicContests,
  getPublicGamification,
  getPublicForums,
  getPublicGames,
  getPublicSystemData,
  getPublicUsers
};

