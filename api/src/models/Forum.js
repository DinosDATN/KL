const mysql = require('mysql2/promise');
require('dotenv').config();

// Create database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'api_user',
  password: process.env.DB_PASSWORD || 'api_password',
  database: process.env.DB_NAME || 'lfysdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

class Forum {
  // Get all categories with post counts
  static async getCategories() {
    const query = `
      SELECT 
        fc.*,
        COUNT(fp.id) as posts_count,
        MAX(fp.last_reply_at) as last_activity
      FROM forum_categories fc
      LEFT JOIN forum_posts fp ON fc.id = fp.category_id
      WHERE fc.is_active = TRUE
      GROUP BY fc.id
      ORDER BY fc.sort_order ASC
    `;
    
    const [rows] = await pool.execute(query);
    return rows;
  }

  // Get posts with pagination and filters
  static async getPosts(options = {}) {
    const {
      categoryId,
      page = 1,
      limit = 20,
      sortBy = 'last_reply_at',
      sortOrder = 'DESC',
      search,
      tags
    } = options;

    let whereConditions = ['fp.id IS NOT NULL'];
    let queryParams = [];

    if (categoryId) {
      whereConditions.push('fp.category_id = ?');
      queryParams.push(categoryId);
    }

    if (search) {
      whereConditions.push('(fp.title LIKE ? OR fp.content LIKE ?)');
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (tags && tags.length > 0) {
      const tagPlaceholders = tags.map(() => '?').join(',');
      whereConditions.push(`fp.id IN (
        SELECT DISTINCT fpt.post_id 
        FROM forum_post_tags fpt 
        JOIN forum_tags ft ON fpt.tag_id = ft.id 
        WHERE ft.name IN (${tagPlaceholders})
      )`);
      queryParams.push(...tags);
    }

    const whereClause = whereConditions.join(' AND ');
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        fp.*,
        fc.name as category_name,
        fc.icon as category_icon,
        fc.color as category_color,
        u.username as author_name,
        u.avatar as author_avatar,
        lr.username as last_reply_author,
        GROUP_CONCAT(ft.name) as tags
      FROM forum_posts fp
      JOIN forum_categories fc ON fp.category_id = fc.id
      JOIN users u ON fp.user_id = u.id
      LEFT JOIN users lr ON fp.last_reply_user_id = lr.id
      LEFT JOIN forum_post_tags fpt ON fp.id = fpt.post_id
      LEFT JOIN forum_tags ft ON fpt.tag_id = ft.id
      WHERE ${whereClause}
      GROUP BY fp.id
      ORDER BY fp.is_pinned DESC, ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    queryParams.push(limit, offset);
    const [rows] = await pool.execute(query, queryParams);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT fp.id) as total
      FROM forum_posts fp
      JOIN forum_categories fc ON fp.category_id = fc.id
      WHERE ${whereConditions.join(' AND ')}
    `;
    
    const [countResult] = await pool.execute(countQuery, queryParams.slice(0, -2));
    const total = countResult[0].total;

    return {
      posts: rows.map(post => ({
        ...post,
        tags: post.tags ? post.tags.split(',') : []
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get single post with details
  static async getPostById(postId) {
    const query = `
      SELECT 
        fp.*,
        fc.name as category_name,
        fc.icon as category_icon,
        fc.color as category_color,
        u.username as author_name,
        u.avatar as author_avatar,
        u.id as author_id,
        GROUP_CONCAT(ft.name) as tags
      FROM forum_posts fp
      JOIN forum_categories fc ON fp.category_id = fc.id
      JOIN users u ON fp.user_id = u.id
      LEFT JOIN forum_post_tags fpt ON fp.id = fpt.post_id
      LEFT JOIN forum_tags ft ON fpt.tag_id = ft.id
      WHERE fp.id = ?
      GROUP BY fp.id
    `;

    const [rows] = await pool.execute(query, [postId]);
    
    if (rows.length === 0) {
      return null;
    }

    const post = {
      ...rows[0],
      tags: rows[0].tags ? rows[0].tags.split(',') : []
    };

    return post;
  }

  // Create new post
  static async createPost(postData) {
    const {
      categoryId,
      userId,
      title,
      content,
      isQuestion = false,
      tags = []
    } = postData;

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert post
      const [result] = await connection.execute(
        `INSERT INTO forum_posts (category_id, user_id, title, content, is_question)
         VALUES (?, ?, ?, ?, ?)`,
        [categoryId, userId, title, content, isQuestion]
      );

      const postId = result.insertId;

      // Handle tags
      if (tags.length > 0) {
        for (const tagName of tags) {
          // Insert or get tag
          await connection.execute(
            `INSERT INTO forum_tags (name) VALUES (?) 
             ON DUPLICATE KEY UPDATE usage_count = usage_count + 1`,
            [tagName]
          );

          // Get tag ID
          const [tagResult] = await connection.execute(
            'SELECT id FROM forum_tags WHERE name = ?',
            [tagName]
          );

          // Link post to tag
          await connection.execute(
            'INSERT INTO forum_post_tags (post_id, tag_id) VALUES (?, ?)',
            [postId, tagResult[0].id]
          );
        }
      }

      await connection.commit();
      return postId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get replies for a post
  static async getReplies(postId, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        fr.*,
        u.username as author_name,
        u.avatar as author_avatar,
        u.id as author_id,
        parent.content as parent_content,
        parent_user.username as parent_author_name
      FROM forum_replies fr
      JOIN users u ON fr.user_id = u.id
      LEFT JOIN forum_replies parent ON fr.parent_reply_id = parent.id
      LEFT JOIN users parent_user ON parent.user_id = parent_user.id
      WHERE fr.post_id = ?
      ORDER BY fr.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [postId, limit, offset]);

    // Get total count
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM forum_replies WHERE post_id = ?',
      [postId]
    );

    return {
      replies: rows,
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    };
  }

  // Create reply
  static async createReply(replyData) {
    const { postId, userId, content, parentReplyId = null } = replyData;

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insert reply
      const [result] = await connection.execute(
        `INSERT INTO forum_replies (post_id, user_id, content, parent_reply_id)
         VALUES (?, ?, ?, ?)`,
        [postId, userId, content, parentReplyId]
      );

      // Update post reply count and last reply info
      await connection.execute(
        `UPDATE forum_posts 
         SET replies_count = replies_count + 1,
             last_reply_at = CURRENT_TIMESTAMP,
             last_reply_user_id = ?
         WHERE id = ?`,
        [userId, postId]
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Vote on post or reply
  static async vote(voteData) {
    const { userId, postId = null, replyId = null, voteType } = voteData;

    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if user already voted
      const existingVoteQuery = postId 
        ? 'SELECT * FROM forum_votes WHERE user_id = ? AND post_id = ?'
        : 'SELECT * FROM forum_votes WHERE user_id = ? AND reply_id = ?';
      
      const [existingVote] = await connection.execute(
        existingVoteQuery,
        [userId, postId || replyId]
      );

      let voteChange = 0;

      if (existingVote.length > 0) {
        const currentVote = existingVote[0];
        
        if (currentVote.vote_type === voteType) {
          // Remove vote (toggle off)
          await connection.execute(
            'DELETE FROM forum_votes WHERE id = ?',
            [currentVote.id]
          );
          voteChange = voteType === 'up' ? -1 : 1;
        } else {
          // Change vote
          await connection.execute(
            'UPDATE forum_votes SET vote_type = ? WHERE id = ?',
            [voteType, currentVote.id]
          );
          voteChange = voteType === 'up' ? 2 : -2;
        }
      } else {
        // New vote
        await connection.execute(
          `INSERT INTO forum_votes (user_id, post_id, reply_id, vote_type)
           VALUES (?, ?, ?, ?)`,
          [userId, postId, replyId, voteType]
        );
        voteChange = voteType === 'up' ? 1 : -1;
      }

      // Update vote count
      if (postId) {
        await connection.execute(
          'UPDATE forum_posts SET votes_count = votes_count + ? WHERE id = ?',
          [voteChange, postId]
        );
      } else {
        await connection.execute(
          'UPDATE forum_replies SET votes_count = votes_count + ? WHERE id = ?',
          [voteChange, replyId]
        );
      }

      await connection.commit();
      return { success: true, voteChange };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Increment view count
  static async incrementViews(postId) {
    await pool.execute(
      'UPDATE forum_posts SET views_count = views_count + 1 WHERE id = ?',
      [postId]
    );
  }

  // Get forum statistics
  static async getStatistics() {
    const queries = [
      'SELECT COUNT(*) as total_posts FROM forum_posts',
      'SELECT COUNT(DISTINCT user_id) as total_members FROM forum_posts',
      'SELECT COUNT(*) as today_posts FROM forum_posts WHERE DATE(created_at) = CURDATE()',
      `SELECT COUNT(DISTINCT u.id) as online_members 
       FROM users u 
       WHERE u.last_activity > DATE_SUB(NOW(), INTERVAL 15 MINUTE)`
    ];

    const results = await Promise.all(
      queries.map(query => pool.execute(query))
    );

    return {
      totalPosts: results[0][0][0].total_posts,
      totalMembers: results[1][0][0].total_members,
      todayPosts: results[2][0][0].today_posts,
      onlineMembers: results[3][0][0].online_members
    };
  }

  // Get trending tags
  static async getTrendingTags(limit = 20) {
    const query = `
      SELECT ft.*, COUNT(fpt.post_id) as recent_usage
      FROM forum_tags ft
      LEFT JOIN forum_post_tags fpt ON ft.id = fpt.tag_id
      LEFT JOIN forum_posts fp ON fpt.post_id = fp.id AND fp.created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY ft.id
      ORDER BY recent_usage DESC, ft.usage_count DESC
      LIMIT ?
    `;

    const [rows] = await pool.execute(query, [limit]);
    return rows;
  }

  // Search posts
  static async searchPosts(searchTerm, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const query = `
      SELECT 
        fp.*,
        fc.name as category_name,
        u.username as author_name,
        MATCH(fp.title, fp.content) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
      FROM forum_posts fp
      JOIN forum_categories fc ON fp.category_id = fc.id
      JOIN users u ON fp.user_id = u.id
      WHERE MATCH(fp.title, fp.content) AGAINST(? IN NATURAL LANGUAGE MODE)
      ORDER BY relevance DESC, fp.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute(query, [searchTerm, searchTerm, limit, offset]);
    return rows;
  }
}

module.exports = Forum;