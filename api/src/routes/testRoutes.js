const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { createAndEmitNotification } = require('../utils/notificationHelper');

/**
 * Test endpoint để gửi notification trực tiếp
 * Chỉ sử dụng cho development/testing
 */
router.post('/send-notification', authenticateToken, async (req, res) => {
  try {
    const { userId, type = 'system', title, message, data } = req.body;
    
    if (!userId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'userId, title, and message are required'
      });
    }

    console.log(`🧪 Test endpoint: Sending notification to user ${userId}`);
    
    const notification = await createAndEmitNotification(
      req.io,
      userId,
      type,
      title,
      message,
      data
    );

    res.status(200).json({
      success: true,
      message: 'Test notification sent successfully',
      data: {
        notificationId: notification.id,
        userId,
        type,
        title,
        message
      }
    });

  } catch (error) {
    console.error('❌ Test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
});

/**
 * Test endpoint để kiểm tra Socket.IO connections
 */
router.get('/socket-info', authenticateToken, (req, res) => {
  try {
    const io = req.io;
    
    if (!io) {
      return res.status(500).json({
        success: false,
        message: 'Socket.IO instance not available'
      });
    }

    const personalRoom = `user_${req.user.id}`;
    const socketsInRoom = io.sockets.adapter.rooms.get(personalRoom);
    const socketCount = socketsInRoom ? socketsInRoom.size : 0;
    
    // Get all connected sockets count
    const totalSockets = io.sockets.sockets.size;
    
    // Get all rooms
    const allRooms = Array.from(io.sockets.adapter.rooms.keys());
    const userRooms = allRooms.filter(room => room.startsWith('user_'));

    res.status(200).json({
      success: true,
      data: {
        userId: req.user.id,
        personalRoom,
        socketsInPersonalRoom: socketCount,
        totalConnectedSockets: totalSockets,
        totalUserRooms: userRooms.length,
        userRooms: userRooms.slice(0, 10), // Show first 10 user rooms
        isUserOnline: socketCount > 0
      }
    });

  } catch (error) {
    console.error('❌ Socket info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get socket info',
      error: error.message
    });
  }
});

/**
 * Test endpoint để trigger enrollment notification
 */
router.post('/trigger-enrollment-notification', authenticateToken, async (req, res) => {
  try {
    const { courseId, creatorId } = req.body;
    
    if (!courseId || !creatorId) {
      return res.status(400).json({
        success: false,
        message: 'courseId and creatorId are required'
      });
    }

    const { notifyNewEnrollment } = require('../utils/notificationHelper');
    const Course = require('../models/Course');
    const User = require('../models/User');

    // Get course and student info
    const course = await Course.findByPk(courseId, {
      attributes: ['id', 'title', 'instructor_id']
    });
    
    const student = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email']
    });

    if (!course || !student) {
      return res.status(404).json({
        success: false,
        message: 'Course or student not found'
      });
    }

    console.log(`🧪 Test: Triggering enrollment notification for course ${courseId}`);
    
    const notification = await notifyNewEnrollment(
      req.io,
      creatorId,
      course,
      student,
      'free'
    );

    res.status(200).json({
      success: true,
      message: 'Enrollment notification triggered successfully',
      data: {
        notificationId: notification.id,
        courseTitle: course.title,
        studentName: student.name,
        creatorId
      }
    });

  } catch (error) {
    console.error('❌ Trigger enrollment notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger enrollment notification',
      error: error.message
    });
  }
});

module.exports = router;