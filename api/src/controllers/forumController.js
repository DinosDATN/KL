const Forum = require('../models/Forum');
const { validationResult } = require('express-validator');

class ForumController {
  // Get all categories
  static async getCategories(req, res) {
    try {
      const categories = await Forum.getCategories();
      
      // Format the response to match frontend expectations
      const formattedCategories = categories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        icon: category.icon,
        color: category.color,
        posts: category.posts_count,
        lastActivity: category.last_activity ? 
          ForumController.formatTimeAgo(category.last_activity) : 'Chưa có hoạt động',
        trending: category.posts_count > 50 // Simple trending logic
      }));

      res.json({
        success: true,
        data: formattedCategories
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách danh mục'
      });
    }
  }

  // Get posts with pagination and filters
  static async getPosts(req, res) {
    try {
      const {
        categoryId,
        page = 1,
        limit = 20,
        sortBy = 'last_reply_at',
        sortOrder = 'DESC',
        search,
        tags
      } = req.query;

      const options = {
        categoryId: categoryId ? parseInt(categoryId) : null,
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        search,
        tags: tags ? tags.split(',') : null
      };

      const result = await Forum.getPosts(options);
      
      // Format posts for frontend
      const formattedPosts = result.posts.map(post => ({
        id: post.id,
        title: post.title,
        author: post.author_name,
        avatar: post.author_avatar,
        category: post.category_name,
        categoryIcon: post.category_icon,
        categoryColor: post.category_color,
        replies: post.replies_count,
        views: post.views_count,
        votes: post.votes_count,
        lastReply: ForumController.formatTimeAgo(post.last_reply_at || post.created_at),
        lastReplyAuthor: post.last_reply_author,
        pinned: post.is_pinned,
        solved: post.is_solved,
        isQuestion: post.is_question,
        tags: post.tags,
        createdAt: post.created_at,
        updatedAt: post.updated_at
      }));

      res.json({
        success: true,
        data: {
          posts: formattedPosts,
          pagination: result.pagination
        }
      });
    } catch (error) {
      console.error('Error getting posts:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách bài viết'
      });
    }
  }

  // Get single post with details
  static async getPost(req, res) {
    try {
      const { id } = req.params;
      
      const post = await Forum.getPostById(id);
      
      if (!post) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy bài viết'
        });
      }

      // Increment view count
      await Forum.incrementViews(id);

      // Format post for frontend
      const formattedPost = {
        id: post.id,
        title: post.title,
        content: post.content,
        author: {
          id: post.author_id,
          name: post.author_name,
          avatar: post.author_avatar
        },
        category: {
          id: post.category_id,
          name: post.category_name,
          icon: post.category_icon,
          color: post.category_color
        },
        replies: post.replies_count,
        views: post.views_count + 1, // Include the new view
        votes: post.votes_count,
        pinned: post.is_pinned,
        solved: post.is_solved,
        isQuestion: post.is_question,
        tags: post.tags,
        createdAt: post.created_at,
        updatedAt: post.updated_at
      };

      res.json({
        success: true,
        data: formattedPost
      });
    } catch (error) {
      console.error('Error getting post:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy bài viết'
      });
    }
  }

  // Create new post
  static async createPost(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { categoryId, title, content, isQuestion = false, tags = [] } = req.body;
      const userId = req.user.id;

      const postData = {
        categoryId: parseInt(categoryId),
        userId,
        title,
        content,
        isQuestion,
        tags
      };

      const postId = await Forum.createPost(postData);

      res.status(201).json({
        success: true,
        message: 'Tạo bài viết thành công',
        data: { id: postId }
      });
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo bài viết'
      });
    }
  }

  // Get replies for a post
  static async getReplies(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await Forum.getReplies(id, parseInt(page), parseInt(limit));
      
      // Format replies for frontend
      const formattedReplies = result.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        author: {
          id: reply.author_id,
          name: reply.author_name,
          avatar: reply.author_avatar
        },
        votes: reply.votes_count,
        isSolution: reply.is_solution,
        parentReply: reply.parent_reply_id ? {
          id: reply.parent_reply_id,
          content: reply.parent_content,
          authorName: reply.parent_author_name
        } : null,
        createdAt: reply.created_at,
        updatedAt: reply.updated_at
      }));

      res.json({
        success: true,
        data: {
          replies: formattedReplies,
          pagination: result.pagination
        }
      });
    } catch (error) {
      console.error('Error getting replies:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách phản hồi'
      });
    }
  }

  // Create reply
  static async createReply(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const { content, parentReplyId = null } = req.body;
      const userId = req.user.id;

      const replyData = {
        postId: parseInt(id),
        userId,
        content,
        parentReplyId: parentReplyId ? parseInt(parentReplyId) : null
      };

      const replyId = await Forum.createReply(replyData);

      res.status(201).json({
        success: true,
        message: 'Tạo phản hồi thành công',
        data: { id: replyId }
      });
    } catch (error) {
      console.error('Error creating reply:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo phản hồi'
      });
    }
  }

  // Vote on post or reply
  static async vote(req, res) {
    try {
      const { type, targetId, voteType } = req.body; // type: 'post' or 'reply'
      const userId = req.user.id;

      if (!['post', 'reply'].includes(type) || !['up', 'down'].includes(voteType)) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ'
        });
      }

      const voteData = {
        userId,
        voteType,
        ...(type === 'post' ? { postId: parseInt(targetId) } : { replyId: parseInt(targetId) })
      };

      const result = await Forum.vote(voteData);

      res.json({
        success: true,
        message: 'Vote thành công',
        data: result
      });
    } catch (error) {
      console.error('Error voting:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi vote'
      });
    }
  }

  // Get forum statistics
  static async getStatistics(req, res) {
    try {
      const stats = await Forum.getStatistics();
      
      res.json({
        success: true,
        data: {
          totalPosts: stats.totalPosts,
          totalMembers: stats.totalMembers,
          todayPosts: stats.todayPosts,
          onlineMembers: stats.onlineMembers
        }
      });
    } catch (error) {
      console.error('Error getting statistics:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thống kê'
      });
    }
  }

  // Get trending tags
  static async getTrendingTags(req, res) {
    try {
      const { limit = 20 } = req.query;
      const tags = await Forum.getTrendingTags(parseInt(limit));
      
      res.json({
        success: true,
        data: tags
      });
    } catch (error) {
      console.error('Error getting trending tags:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy tags phổ biến'
      });
    }
  }

  // Search posts
  static async searchPosts(req, res) {
    try {
      const { q: searchTerm, page = 1, limit = 20 } = req.query;
      
      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự'
        });
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const posts = await Forum.searchPosts(searchTerm.trim(), options);
      
      // Format posts for frontend
      const formattedPosts = posts.map(post => ({
        id: post.id,
        title: post.title,
        content: post.content.substring(0, 200) + '...', // Preview
        author: post.author_name,
        category: post.category_name,
        relevance: post.relevance,
        createdAt: post.created_at
      }));

      res.json({
        success: true,
        data: formattedPosts
      });
    } catch (error) {
      console.error('Error searching posts:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tìm kiếm'
      });
    }
  }

  // Helper method to format time ago
  static formatTimeAgo(date) {
    if (!date) return 'Chưa xác định';
    
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày trước`;
    } else {
      return past.toLocaleDateString('vi-VN');
    }
  }
}

module.exports = ForumController;