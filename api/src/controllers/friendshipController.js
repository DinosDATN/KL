const { Friendship, UserBlock, User } = require('../models');
const { Op } = require('sequelize');

// Send a friend request
const sendFriendRequest = async (req, res) => {
  try {
    const requesterId = req.user.id;
    const { addressee_id } = req.body;

    // Validate addressee_id
    if (!addressee_id) {
      return res.status(400).json({
        success: false,
        message: 'Addressee ID is required'
      });
    }

    if (requesterId === parseInt(addressee_id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send friend request to yourself'
      });
    }

    // Check if addressee exists and is active
    const addressee = await User.findByPk(addressee_id);
    if (!addressee || !addressee.is_active) {
      return res.status(404).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Check if users are blocked
    const areBlocked = await UserBlock.areBlocked(requesterId, addressee_id);
    if (areBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot send friend request to this user'
      });
    }

    // Check if friendship already exists
    const existingFriendship = await Friendship.findFriendship(requesterId, addressee_id);
    if (existingFriendship) {
      let message = '';
      switch (existingFriendship.status) {
        case 'accepted':
          message = 'You are already friends with this user';
          break;
        case 'pending':
          message = existingFriendship.requester_id === requesterId 
            ? 'Friend request already sent' 
            : 'This user has already sent you a friend request';
          break;
        case 'declined':
          message = 'Friend request was previously declined';
          break;
        case 'blocked':
          message = 'Cannot send friend request to this user';
          break;
        default:
          message = 'Friendship already exists';
      }
      
      return res.status(400).json({
        success: false,
        message
      });
    }

    // Create new friend request
    const friendship = await Friendship.create({
      requester_id: requesterId,
      addressee_id: addressee_id,
      status: 'pending'
    });

    // Fetch complete friendship data
    const completeFriendship = await Friendship.findByPk(friendship.id, {
      include: [
        {
          model: User,
          as: 'Requester',
          attributes: ['id', 'name', 'email', 'avatar_url']
        },
        {
          model: User,
          as: 'Addressee',
          attributes: ['id', 'name', 'email', 'avatar_url']
        }
      ]
    });

    // Emit socket notification to addressee (receiver of friend request)
    if (req.io) {
      req.io.to(`user_${addressee_id}`).emit('friend_request_received', {
        friendship: completeFriendship,
        requester: completeFriendship.Requester,
        timestamp: new Date().toISOString()
      });
      console.log(`📬 Friend request notification sent to user ${addressee_id}`);
    }

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully',
      data: completeFriendship
    });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending friend request'
    });
  }
};

// Respond to a friend request (accept/decline)
const respondToFriendRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendshipId } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "accept" or "decline"'
      });
    }

    // Find the friendship
    const friendship = await Friendship.findByPk(friendshipId);
    if (!friendship) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    // Check if user is the addressee and request is pending
    if (friendship.addressee_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to respond to this request'
      });
    }

    if (friendship.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This friend request has already been responded to'
      });
    }

    // Update the friendship status
    if (action === 'accept') {
      await friendship.accept();
    } else {
      await friendship.decline();
    }

    // Fetch updated friendship with user data
    const updatedFriendship = await Friendship.findByPk(friendship.id, {
      include: [
        {
          model: User,
          as: 'Requester',
          attributes: ['id', 'name', 'email', 'avatar_url']
        },
        {
          model: User,
          as: 'Addressee',
          attributes: ['id', 'name', 'email', 'avatar_url']
        }
      ]
    });

    // Emit socket notification to requester when request is accepted/declined
    if (req.io) {
      if (action === 'accept') {
        req.io.to(`user_${friendship.requester_id}`).emit('friend_request_accepted', {
          friendship: updatedFriendship,
          addressee: updatedFriendship.Addressee,
          timestamp: new Date().toISOString()
        });
        console.log(`✅ Friend request accepted notification sent to user ${friendship.requester_id}`);
      } else {
        req.io.to(`user_${friendship.requester_id}`).emit('friend_request_declined', {
          friendship: updatedFriendship,
          addressee: updatedFriendship.Addressee,
          timestamp: new Date().toISOString()
        });
        console.log(`❌ Friend request declined notification sent to user ${friendship.requester_id}`);
      }
    }

    res.json({
      success: true,
      message: `Friend request ${action}ed successfully`,
      data: updatedFriendship
    });
  } catch (error) {
    console.error('Error responding to friend request:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to friend request'
    });
  }
};

// Get user's friends list
const getFriends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause for friendship search
    const friendshipWhere = {
      [Op.or]: [
        { requester_id: userId, status: 'accepted' },
        { addressee_id: userId, status: 'accepted' }
      ]
    };

    // Build include for user search
    const userInclude = [
      {
        model: User,
        as: 'Requester',
        attributes: ['id', 'name', 'email', 'avatar_url', 'is_online', 'last_seen_at']
      },
      {
        model: User,
        as: 'Addressee',
        attributes: ['id', 'name', 'email', 'avatar_url', 'is_online', 'last_seen_at']
      }
    ];

    // If search term provided, add search conditions
    if (search.trim()) {
      const searchCondition = {
        [Op.like]: `%${search.trim()}%`
      };
      
      userInclude[0].where = {
        [Op.or]: [
          { name: searchCondition },
          { email: searchCondition }
        ]
      };
      userInclude[1].where = {
        [Op.or]: [
          { name: searchCondition },
          { email: searchCondition }
        ]
      };
    }

    const friendships = await Friendship.findAndCountAll({
      where: friendshipWhere,
      include: userInclude,
      limit: parseInt(limit),
      offset: offset,
      order: [['updated_at', 'DESC']]
    });

    // Transform data to get friend information
    const friends = friendships.rows.map(friendship => {
      const friend = friendship.requester_id === userId ? 
        friendship.Addressee : friendship.Requester;
      
      return {
        friendship_id: friendship.id,
        friend: friend,
        friendship_date: friendship.updated_at,
        is_online: friend.is_online,
        last_seen_at: friend.last_seen_at
      };
    });

    res.json({
      success: true,
      data: {
        friends,
        totalCount: friendships.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(friendships.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching friends:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching friends list'
    });
  }
};

// Get pending friend requests (received)
const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const requests = await Friendship.findAndCountAll({
      where: {
        addressee_id: userId,
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'Requester',
          attributes: ['id', 'name', 'email', 'avatar_url', 'is_online', 'last_seen_at']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['requested_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        requests: requests.rows,
        totalCount: requests.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(requests.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending friend requests'
    });
  }
};

// Get sent friend requests
const getSentRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const requests = await Friendship.findAndCountAll({
      where: {
        requester_id: userId,
        status: 'pending'
      },
      include: [
        {
          model: User,
          as: 'Addressee',
          attributes: ['id', 'name', 'email', 'avatar_url', 'is_online', 'last_seen_at']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['requested_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        requests: requests.rows,
        totalCount: requests.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(requests.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sent friend requests'
    });
  }
};

// Remove a friend (unfriend)
const removeFriend = async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    const friendship = await Friendship.findFriendship(userId, friendId);
    if (!friendship || friendship.status !== 'accepted') {
      return res.status(404).json({
        success: false,
        message: 'Friendship not found'
      });
    }

    await friendship.destroy();

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing friend'
    });
  }
};

// Block a user
const blockUser = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const { userId } = req.params;
    const { reason } = req.body;

    if (blockerId === parseInt(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot block yourself'
      });
    }

    // Check if user exists
    const userToBlock = await User.findByPk(userId);
    if (!userToBlock) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already blocked
    const existingBlock = await UserBlock.findOne({
      where: {
        blocker_id: blockerId,
        blocked_id: userId
      }
    });

    if (existingBlock) {
      return res.status(400).json({
        success: false,
        message: 'User is already blocked'
      });
    }

    // Create block
    const block = await UserBlock.create({
      blocker_id: blockerId,
      blocked_id: userId,
      reason: reason?.trim() || null
    });

    // Remove any existing friendship
    const friendship = await Friendship.findFriendship(blockerId, userId);
    if (friendship) {
      await friendship.destroy();
    }

    res.status(201).json({
      success: true,
      message: 'User blocked successfully',
      data: block
    });
  } catch (error) {
    console.error('Error blocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking user'
    });
  }
};

// Unblock a user
const unblockUser = async (req, res) => {
  try {
    const blockerId = req.user.id;
    const { userId } = req.params;

    const block = await UserBlock.findOne({
      where: {
        blocker_id: blockerId,
        blocked_id: userId
      }
    });

    if (!block) {
      return res.status(404).json({
        success: false,
        message: 'Block not found'
      });
    }

    await block.destroy();

    res.json({
      success: true,
      message: 'User unblocked successfully'
    });
  } catch (error) {
    console.error('Error unblocking user:', error);
    res.status(500).json({
      success: false,
      message: 'Error unblocking user'
    });
  }
};

// Get blocked users list
const getBlockedUsers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const blockedUsers = await UserBlock.findAndCountAll({
      where: {
        blocker_id: userId
      },
      include: [
        {
          model: User,
          as: 'BlockedUser',
          attributes: ['id', 'name', 'email', 'avatar_url']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['blocked_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        blockedUsers: blockedUsers.rows,
        totalCount: blockedUsers.count,
        currentPage: parseInt(page),
        totalPages: Math.ceil(blockedUsers.count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blocked users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blocked users'
    });
  }
};

// Check friendship status between two users
const getFriendshipStatus = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    if (currentUserId === parseInt(userId)) {
      return res.json({
        success: true,
        data: {
          status: 'self',
          message: 'This is your own profile'
        }
      });
    }

    // Check if blocked
    const isBlocked = await UserBlock.areBlocked(currentUserId, userId);
    if (isBlocked) {
      return res.json({
        success: true,
        data: {
          status: 'blocked',
          message: 'One or both users have blocked each other'
        }
      });
    }

    // Check friendship status
    const friendshipStatus = await Friendship.getFriendshipStatus(currentUserId, userId);
    
    if (!friendshipStatus) {
      return res.json({
        success: true,
        data: {
          status: 'none',
          message: 'No friendship exists'
        }
      });
    }

    res.json({
      success: true,
      data: friendshipStatus
    });
  } catch (error) {
    console.error('Error checking friendship status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking friendship status'
    });
  }
};

module.exports = {
  sendFriendRequest,
  respondToFriendRequest,
  getFriends,
  getPendingRequests,
  getSentRequests,
  removeFriend,
  blockUser,
  unblockUser,
  getBlockedUsers,
  getFriendshipStatus
};
