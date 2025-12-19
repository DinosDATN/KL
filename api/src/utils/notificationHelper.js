const { Notification } = require('../models');

/**
 * Helper function để tạo và gửi thông báo realtime
 * @param {Object} io - Socket.io instance
 * @param {number} userId - ID của user nhận thông báo
 * @param {string} type - Loại thông báo
 * @param {string} title - Tiêu đề thông báo
 * @param {string} message - Nội dung thông báo
 * @param {Object} data - Dữ liệu bổ sung (optional)
 * @returns {Promise<Object>} - Notification object đã tạo
 */
const createAndEmitNotification = async (io, userId, type, title, message, data = null) => {
  try {
    console.log(`🔔 Creating notification for user ${userId}:`, { type, title, message });
    
    // Tạo notification trong database
    const notification = await Notification.createNotification(userId, type, title, message, data);
    console.log(`💾 Notification created in DB with ID: ${notification.id}`);
    
    // Gửi thông báo realtime qua socket
    if (io) {
      const personalRoom = `user_${userId}`;
      console.log(`📢 Sending notification to room: ${personalRoom}`);
      
      // Kiểm tra xem có socket nào trong room không
      const socketsInRoom = io.sockets.adapter.rooms.get(personalRoom);
      const socketCount = socketsInRoom ? socketsInRoom.size : 0;
      console.log(`👥 Sockets in room ${personalRoom}: ${socketCount}`);
      
      if (socketCount === 0) {
        console.log(`⚠️ No sockets in room ${personalRoom} - user may be offline`);
      }
      
      const notificationPayload = {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        is_read: notification.is_read,
        created_at: notification.created_at,
        timestamp: new Date().toISOString()
      };
      
      console.log(`📤 Emitting notification payload:`, notificationPayload);
      
      io.to(personalRoom).emit('notification', notificationPayload);
      
      console.log(`✅ Notification emitted to room ${personalRoom} (${socketCount} sockets)`);
    } else {
      console.log(`❌ Socket.IO instance not available - notification only saved to DB`);
    }
    
    return notification;
  } catch (error) {
    console.error('❌ Error creating and emitting notification:', error);
    throw error;
  }
};

/**
 * Gửi thông báo khi học viên đăng ký khóa học
 * @param {Object} io - Socket.io instance
 * @param {number} creatorId - ID của creator/instructor
 * @param {Object} course - Thông tin khóa học
 * @param {Object} student - Thông tin học viên
 * @param {string} enrollmentType - Loại đăng ký (free/paid)
 */
const notifyNewEnrollment = async (io, creatorId, course, student, enrollmentType = 'free') => {
  const title = 'Học viên mới đăng ký';
  const message = `${student.name} đã đăng ký khóa học "${course.title}"`;
  
  return await createAndEmitNotification(
    io,
    creatorId,
    'new_enrollment',
    title,
    message,
    {
      course_id: course.id,
      student_id: student.id,
      enrollment_type: enrollmentType,
      course_title: course.title,
      student_name: student.name
    }
  );
};

/**
 * Gửi thông báo khi creator xác nhận thanh toán
 * @param {Object} io - Socket.io instance
 * @param {number} studentId - ID của học viên
 * @param {Object} course - Thông tin khóa học
 * @param {Object} payment - Thông tin thanh toán
 */
const notifyPaymentConfirmed = async (io, studentId, course, payment) => {
  const title = 'Thanh toán đã được xác nhận';
  const message = `Thanh toán cho khóa học "${course.title}" đã được xác nhận. Bạn có thể bắt đầu học ngay!`;
  
  return await createAndEmitNotification(
    io,
    studentId,
    'payment_confirmed',
    title,
    message,
    {
      course_id: course.id,
      payment_id: payment.id,
      course_title: course.title,
      amount: payment.amount
    }
  );
};

/**
 * Gửi thông báo khi có thanh toán mới cần xác nhận
 * @param {Object} io - Socket.io instance
 * @param {number} creatorId - ID của creator/instructor
 * @param {Object} course - Thông tin khóa học
 * @param {Object} student - Thông tin học viên
 * @param {Object} payment - Thông tin thanh toán
 */
const notifyNewPayment = async (io, creatorId, course, student, payment) => {
  const title = 'Thanh toán mới cần xác nhận';
  const message = `${student.name} đã chuyển khoản cho khóa học "${course.title}". Vui lòng kiểm tra và xác nhận.`;
  
  return await createAndEmitNotification(
    io,
    creatorId,
    'new_payment',
    title,
    message,
    {
      course_id: course.id,
      student_id: student.id,
      payment_id: payment.id,
      course_title: course.title,
      student_name: student.name,
      amount: payment.amount
    }
  );
};

module.exports = {
  createAndEmitNotification,
  notifyNewEnrollment,
  notifyPaymentConfirmed,
  notifyNewPayment
};