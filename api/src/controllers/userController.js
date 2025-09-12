const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const UserStats = require('../models/UserStats');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for avatar upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/avatars');
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

const userController = {
  // Get all users with optional filtering and pagination
  getAllUsers: async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {};
      
      if (status) {
        whereClause.status = status;
      }
      
      if (search) {
        whereClause[Op.or] = [
          { first_name: { [Op.like]: `%${search}%` } },
          { last_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      const totalPages = Math.ceil(count / limit);

      res.status(200).json({
        success: true,
        data: {
          users: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message
      });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user',
        error: error.message
      });
    }
  },

  // Create new user
  createUser: async (req, res) => {
    try {
      const { first_name, last_name, email, phone, date_of_birth, status } = req.body;

      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      const user = await User.create({
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        status: status || 'active'
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      console.error('Error creating user:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create user',
        error: error.message
      });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { first_name, last_name, email, phone, date_of_birth, status } = req.body;

      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if email is being changed and if it already exists
      if (email && email !== user.email) {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: 'User with this email already exists'
          });
        }
      }

      const updatedUser = await user.update({
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name,
        email: email || user.email,
        phone: phone !== undefined ? phone : user.phone,
        date_of_birth: date_of_birth !== undefined ? date_of_birth : user.date_of_birth,
        status: status || user.status
      });

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error updating user:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error.message
      });
    }
  },

  // Delete user
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      await user.destroy();

      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error.message
      });
    }
  },

  // Get current user's profile with full details
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const user = await User.findByPk(userId, {
        include: [
          {
            model: UserProfile,
            as: 'Profile'
          },
          {
            model: UserStats,
            as: 'Stats'
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create profile if it doesn't exist
      if (!user.Profile) {
        const newProfile = await UserProfile.create({
          user_id: userId,
          preferred_language: 'vi',
          theme_mode: 'system',
          layout: 'expanded',
          notifications: true,
          visibility_profile: true,
          visibility_achievements: true,
          visibility_progress: true,
          visibility_activity: true
        });
        user.Profile = newProfile;
      }

      res.status(200).json({
        success: true,
        data: {
          user: user.toAuthJSON(),
          profile: user.Profile,
          stats: user.Stats
        }
      });

    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile',
        error: error.message
      });
    }
  },

  // Update user basic information
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { name, email } = req.body;

      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Validate email uniqueness if email is being changed
      if (email && email !== user.email) {
        const existingUser = await User.findOne({
          where: { 
            email: email.toLowerCase().trim(),
            id: { [Op.ne]: userId } // Exclude current user
          }
        });
        
        if (existingUser) {
          return res.status(409).json({
            success: false,
            message: 'Email already exists',
            errors: { email: 'This email is already registered to another user' }
          });
        }
      }

      // Update user fields
      const updateData = {};
      if (name) updateData.name = name.trim();
      if (email) updateData.email = email.toLowerCase().trim();

      await user.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          user: user.toAuthJSON()
        }
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
          }, {})
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
        error: error.message
      });
    }
  },

  // Update user extended profile information
  updateProfileDetails: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        bio,
        birthday,
        gender,
        phone,
        address,
        website_url,
        github_url,
        linkedin_url
      } = req.body;

      // Find or create profile
      let profile = await UserProfile.findOne({ where: { user_id: userId } });
      
      if (!profile) {
        profile = await UserProfile.create({ user_id: userId });
      }

      // Validate URLs if provided
      const urlPattern = /^https?:\/\/[\w\-]+(\.[\w\-]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?$/;
      
      if (website_url && !urlPattern.test(website_url)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid website URL format',
          errors: { website_url: 'Please provide a valid URL' }
        });
      }

      if (github_url && (!urlPattern.test(github_url) || !github_url.includes('github.com'))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid GitHub URL format',
          errors: { github_url: 'Please provide a valid GitHub URL' }
        });
      }

      if (linkedin_url && (!urlPattern.test(linkedin_url) || !linkedin_url.includes('linkedin.com'))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid LinkedIn URL format',
          errors: { linkedin_url: 'Please provide a valid LinkedIn URL' }
        });
      }

      // Validate birthday
      if (birthday) {
        const birthDate = new Date(birthday);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (birthDate > today || age > 150) {
          return res.status(400).json({
            success: false,
            message: 'Invalid birthday',
            errors: { birthday: 'Please provide a valid birthday' }
          });
        }
      }

      // Validate phone number (basic pattern)
      if (phone && !/^[+]?[1-9]\d{1,14}$/.test(phone.replace(/\s/g, ''))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
          errors: { phone: 'Please provide a valid phone number' }
        });
      }

      // Update profile
      const updateData = {};
      if (bio !== undefined) updateData.bio = bio;
      if (birthday !== undefined) updateData.birthday = birthday;
      if (gender !== undefined) updateData.gender = gender;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;
      if (website_url !== undefined) updateData.website_url = website_url;
      if (github_url !== undefined) updateData.github_url = github_url;
      if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url;

      await profile.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Profile details updated successfully',
        data: { profile }
      });

    } catch (error) {
      console.error('Error updating profile details:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
          }, {})
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update profile details',
        error: error.message
      });
    }
  },

  // Update user settings
  updateSettings: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        preferred_language,
        theme_mode,
        layout,
        notifications,
        visibility_profile,
        visibility_achievements,
        visibility_progress,
        visibility_activity
      } = req.body;

      // Find or create profile
      let profile = await UserProfile.findOne({ where: { user_id: userId } });
      
      if (!profile) {
        profile = await UserProfile.create({ user_id: userId });
      }

      // Validate enum values
      const validLanguages = ['vi', 'en'];
      const validThemeModes = ['light', 'dark', 'system'];
      const validLayouts = ['compact', 'expanded'];

      if (preferred_language && !validLanguages.includes(preferred_language)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid preferred language',
          errors: { preferred_language: `Must be one of: ${validLanguages.join(', ')}` }
        });
      }

      if (theme_mode && !validThemeModes.includes(theme_mode)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid theme mode',
          errors: { theme_mode: `Must be one of: ${validThemeModes.join(', ')}` }
        });
      }

      if (layout && !validLayouts.includes(layout)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid layout',
          errors: { layout: `Must be one of: ${validLayouts.join(', ')}` }
        });
      }

      // Update settings
      const updateData = {};
      if (preferred_language !== undefined) updateData.preferred_language = preferred_language;
      if (theme_mode !== undefined) updateData.theme_mode = theme_mode;
      if (layout !== undefined) updateData.layout = layout;
      if (notifications !== undefined) updateData.notifications = Boolean(notifications);
      if (visibility_profile !== undefined) updateData.visibility_profile = Boolean(visibility_profile);
      if (visibility_achievements !== undefined) updateData.visibility_achievements = Boolean(visibility_achievements);
      if (visibility_progress !== undefined) updateData.visibility_progress = Boolean(visibility_progress);
      if (visibility_activity !== undefined) updateData.visibility_activity = Boolean(visibility_activity);

      await profile.update(updateData);

      res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: { profile }
      });

    } catch (error) {
      console.error('Error updating settings:', error);
      
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors.reduce((acc, err) => {
            acc[err.path] = err.message;
            return acc;
          }, {})
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        error: error.message
      });
    }
  },

  // Upload avatar
  uploadAvatar: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded',
          errors: { file: 'Please select an image file to upload' }
        });
      }

      const userId = req.user.id;
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Delete old avatar file if exists
      if (user.avatar_url) {
        const oldAvatarPath = user.avatar_url.replace('/uploads/', '');
        const fullOldPath = path.join(__dirname, '../../uploads/', oldAvatarPath);
        try {
          await fs.unlink(fullOldPath);
        } catch (error) {
          // Ignore error if file doesn't exist
        }
      }

      // Update user avatar URL
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      await user.update({ avatar_url: avatarUrl });

      res.status(200).json({
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatar_url: avatarUrl,
          user: user.toAuthJSON()
        }
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        try {
          await fs.unlink(req.file.path);
        } catch (cleanupError) {
          console.error('Error cleaning up file:', cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: 'Failed to upload avatar',
        error: error.message
      });
    }
  },

  // Change password
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { current_password, new_password, confirm_password } = req.body;

      // Validation
      if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'All password fields are required',
          errors: {
            current_password: !current_password ? 'Current password is required' : null,
            new_password: !new_password ? 'New password is required' : null,
            confirm_password: !confirm_password ? 'Password confirmation is required' : null
          }
        });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'Password confirmation does not match',
          errors: { confirm_password: 'Passwords do not match' }
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long',
          errors: { new_password: 'Password must be at least 6 characters long' }
        });
      }

      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user has a password (not OAuth user)
      if (!user.password) {
        return res.status(400).json({
          success: false,
          message: 'Cannot change password for social login accounts',
          errors: { auth_method: 'This account uses social login' }
        });
      }

      // Verify current password
      const isValidPassword = await user.validatePassword(current_password);
      
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect',
          errors: { current_password: 'Current password is incorrect' }
        });
      }

      // Update password
      await user.update({ password: new_password });

      res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Error changing password:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to change password',
        error: error.message
      });
    }
  },

  // Multer middleware for avatar upload
  uploadMiddleware: upload.single('avatar')
};

module.exports = userController;
