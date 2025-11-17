const RewardTransaction = require('../models/RewardTransaction');
const RewardConfig = require('../models/RewardConfig');
const UserStats = require('../models/UserStats');
const { sequelize } = require('../config/sequelize');

class RewardService {
  /**
   * Tính điểm thưởng cho bài tập theo độ khó
   * @param {string} difficulty - Độ khó (Easy, Medium, Hard)
   * @returns {number} Số điểm thưởng
   */
  async calculateProblemReward(difficulty) {
    const configs = await RewardConfig.getAllConfigs();
    const key = `problem_${difficulty.toLowerCase()}`;
    return configs[key] || 0;
  }

  /**
   * Tính điểm thưởng cho Sudoku dựa trên độ khó và thời gian
   * @param {string} difficulty - Độ khó (easy, medium, hard)
   * @param {number} timeSpent - Thời gian hoàn thành (giây)
   * @returns {Object} { points, breakdown }
   */
  async calculateSudokuReward(difficulty, timeSpent) {
    const configs = await RewardConfig.getAllConfigs();
    
    // Điểm cơ bản theo độ khó
    const baseKey = `sudoku_${difficulty.toLowerCase()}_base`;
    const basePoints = configs[baseKey] || 0;

    // Tính bonus theo thời gian
    let bonusPercent = 0;
    const timeInMinutes = timeSpent / 60;

    if (timeInMinutes < 5) {
      bonusPercent = configs['sudoku_time_bonus_fast'] || 0;
    } else if (timeInMinutes <= 10) {
      bonusPercent = configs['sudoku_time_bonus_normal'] || 0;
    } else {
      bonusPercent = configs['sudoku_time_bonus_slow'] || 0;
    }

    const bonusPoints = Math.floor(basePoints * bonusPercent / 100);
    const totalPoints = basePoints + bonusPoints;

    return {
      points: totalPoints,
      breakdown: {
        base: basePoints,
        bonus: bonusPoints,
        bonusPercent: bonusPercent,
        timeSpent: timeSpent,
        timeInMinutes: Math.round(timeInMinutes * 10) / 10
      }
    };
  }

  /**
   * Thêm điểm thưởng cho người dùng
   * @param {number} userId - ID người dùng
   * @param {number} points - Số điểm (dương = nhận, âm = tiêu)
   * @param {string} transactionType - Loại giao dịch
   * @param {Object} options - Tùy chọn bổ sung
   * @returns {Object} Transaction và user stats mới
   */
  async addRewardPoints(userId, points, transactionType, options = {}) {
    const {
      referenceType = null,
      referenceId = null,
      metadata = null,
      description = null
    } = options;

    const transaction = await sequelize.transaction();

    try {
      // Tạo giao dịch điểm thưởng
      const rewardTransaction = await RewardTransaction.create({
        user_id: userId,
        points: points,
        transaction_type: transactionType,
        reference_type: referenceType,
        reference_id: referenceId,
        metadata: metadata,
        description: description
      }, { transaction });

      // Cập nhật điểm thưởng trong user_stats
      let userStats = await UserStats.findOne({
        where: { user_id: userId },
        transaction
      });

      if (!userStats) {
        // Tạo user_stats nếu chưa có
        userStats = await UserStats.create({
          user_id: userId,
          reward_points: points
        }, { transaction });
      } else {
        // Cập nhật điểm thưởng
        const newPoints = Math.max(0, (userStats.reward_points || 0) + points);
        await userStats.update({
          reward_points: newPoints
        }, { transaction });
      }

      await transaction.commit();

      return {
        transaction: rewardTransaction,
        userStats: userStats,
        newBalance: userStats.reward_points
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Thưởng điểm khi giải bài tập thành công
   * @param {number} userId - ID người dùng
   * @param {number} problemId - ID bài tập
   * @param {string} difficulty - Độ khó
   * @param {Object} metadata - Thông tin bổ sung
   * @returns {Object} Kết quả thưởng điểm
   */
  async rewardProblemSolved(userId, problemId, difficulty, metadata = {}) {
    const points = await this.calculateProblemReward(difficulty);
    
    if (points <= 0) {
      return null;
    }

    const description = `Giải bài tập ${difficulty} thành công`;

    return await this.addRewardPoints(
      userId,
      points,
      'problem_solved',
      {
        referenceType: 'problem',
        referenceId: problemId,
        metadata: {
          difficulty: difficulty,
          ...metadata
        },
        description: description
      }
    );
  }

  /**
   * Thưởng điểm khi hoàn thành Sudoku
   * @param {number} userId - ID người dùng
   * @param {number} gameId - ID game
   * @param {number} levelId - ID level
   * @param {string} difficulty - Độ khó
   * @param {number} timeSpent - Thời gian hoàn thành (giây)
   * @returns {Object} Kết quả thưởng điểm
   */
  async rewardSudokuCompleted(userId, gameId, levelId, difficulty, timeSpent) {
    const rewardCalc = await this.calculateSudokuReward(difficulty, timeSpent);
    
    if (rewardCalc.points <= 0) {
      return null;
    }

    const description = `Hoàn thành Sudoku ${difficulty} trong ${rewardCalc.breakdown.timeInMinutes} phút`;

    return await this.addRewardPoints(
      userId,
      rewardCalc.points,
      'sudoku_completed',
      {
        referenceType: 'game',
        referenceId: gameId,
        metadata: {
          levelId: levelId,
          difficulty: difficulty,
          timeSpent: timeSpent,
          breakdown: rewardCalc.breakdown
        },
        description: description
      }
    );
  }

  /**
   * Lấy lịch sử giao dịch điểm thưởng của người dùng
   * @param {number} userId - ID người dùng
   * @param {Object} options - Tùy chọn phân trang và lọc
   * @returns {Object} Danh sách giao dịch và thống kê
   */
  async getUserRewardHistory(userId, options = {}) {
    const { page = 1, limit = 20, type = null } = options;
    const offset = (page - 1) * limit;

    const transactions = await RewardTransaction.getUserTransactions(userId, {
      limit,
      offset,
      type
    });

    const userStats = await UserStats.findOne({
      where: { user_id: userId }
    });

    const stats = await RewardTransaction.getUserStats(userId);

    return {
      transactions: transactions,
      currentBalance: userStats ? userStats.reward_points : 0,
      stats: stats,
      pagination: {
        page: page,
        limit: limit,
        total: transactions.length
      }
    };
  }

  /**
   * Lấy số điểm thưởng hiện tại của người dùng
   * @param {number} userId - ID người dùng
   * @returns {number} Số điểm thưởng
   */
  async getUserRewardPoints(userId) {
    const userStats = await UserStats.findOne({
      where: { user_id: userId }
    });

    return userStats ? (userStats.reward_points || 0) : 0;
  }

  /**
   * Kiểm tra xem người dùng đã nhận điểm cho một tham chiếu cụ thể chưa
   * @param {number} userId - ID người dùng
   * @param {string} referenceType - Loại tham chiếu
   * @param {number} referenceId - ID tham chiếu
   * @param {string} transactionType - Loại giao dịch
   * @returns {boolean} True nếu đã nhận điểm
   */
  async hasReceivedReward(userId, referenceType, referenceId, transactionType) {
    const existing = await RewardTransaction.findOne({
      where: {
        user_id: userId,
        reference_type: referenceType,
        reference_id: referenceId,
        transaction_type: transactionType
      }
    });

    return existing !== null;
  }
}

module.exports = new RewardService();
