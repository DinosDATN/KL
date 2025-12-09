const CreatorBankAccount = require('../models/CreatorBankAccount');
const User = require('../models/User');

class CreatorBankAccountController {
  /**
   * Lấy thông tin tài khoản ngân hàng của creator
   */
  async getMyBankAccount(req, res) {
    try {
      const userId = req.user.id;

      // Kiểm tra user có phải creator không
      const user = await User.findByPk(userId);
      if (!user || user.role !== 'creator') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ creator mới có thể quản lý tài khoản ngân hàng'
        });
      }

      const bankAccount = await CreatorBankAccount.findByUserId(userId);

      if (!bankAccount) {
        return res.status(404).json({
          success: false,
          message: 'Chưa có thông tin tài khoản ngân hàng'
        });
      }

      res.status(200).json({
        success: true,
        data: bankAccount
      });
    } catch (error) {
      console.error('Error in getMyBankAccount:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin tài khoản ngân hàng',
        error: error.message
      });
    }
  }

  /**
   * Tạo hoặc cập nhật thông tin tài khoản ngân hàng
   */
  async upsertBankAccount(req, res) {
    try {
      const userId = req.user.id;
      const { bank_name, account_number, account_name, branch, notes } = req.body;

      // Kiểm tra user có phải creator không
      const user = await User.findByPk(userId);
      if (!user || user.role !== 'creator') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ creator mới có thể quản lý tài khoản ngân hàng'
        });
      }

      // Validate required fields
      if (!bank_name || !account_number || !account_name) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ thông tin: tên ngân hàng, số tài khoản, tên chủ tài khoản'
        });
      }

      // Tìm hoặc tạo mới
      let bankAccount = await CreatorBankAccount.findOne({
        where: { user_id: userId }
      });

      if (bankAccount) {
        // Cập nhật
        await bankAccount.update({
          bank_name,
          account_number,
          account_name,
          branch,
          notes,
          is_verified: false // Reset verification khi cập nhật
        });

        return res.status(200).json({
          success: true,
          message: 'Cập nhật thông tin tài khoản ngân hàng thành công',
          data: bankAccount
        });
      } else {
        // Tạo mới
        bankAccount = await CreatorBankAccount.create({
          user_id: userId,
          bank_name,
          account_number,
          account_name,
          branch,
          notes,
          is_verified: false,
          is_active: true
        });

        return res.status(201).json({
          success: true,
          message: 'Thêm thông tin tài khoản ngân hàng thành công',
          data: bankAccount
        });
      }
    } catch (error) {
      console.error('Error in upsertBankAccount:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lưu thông tin tài khoản ngân hàng',
        error: error.message
      });
    }
  }

  /**
   * Xóa tài khoản ngân hàng (soft delete)
   */
  async deleteBankAccount(req, res) {
    try {
      const userId = req.user.id;

      const bankAccount = await CreatorBankAccount.findOne({
        where: { user_id: userId }
      });

      if (!bankAccount) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin tài khoản ngân hàng'
        });
      }

      // Soft delete
      await bankAccount.update({ is_active: false });

      res.status(200).json({
        success: true,
        message: 'Xóa thông tin tài khoản ngân hàng thành công'
      });
    } catch (error) {
      console.error('Error in deleteBankAccount:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa thông tin tài khoản ngân hàng',
        error: error.message
      });
    }
  }

  /**
   * Admin: Lấy danh sách tài khoản ngân hàng của creators
   */
  async getAllBankAccounts(req, res) {
    try {
      const { is_verified, is_active } = req.query;

      const where = {};
      if (is_verified !== undefined) {
        where.is_verified = is_verified === 'true';
      }
      if (is_active !== undefined) {
        where.is_active = is_active === 'true';
      }

      const bankAccounts = await CreatorBankAccount.findAll({
        where,
        include: [{
          model: User,
          as: 'User',
          attributes: ['id', 'name', 'email', 'role']
        }],
        order: [['created_at', 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: bankAccounts
      });
    } catch (error) {
      console.error('Error in getAllBankAccounts:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách tài khoản ngân hàng',
        error: error.message
      });
    }
  }

  /**
   * Admin: Xác thực tài khoản ngân hàng
   */
  async verifyBankAccount(req, res) {
    try {
      const { accountId } = req.params;
      const { is_verified } = req.body;

      const bankAccount = await CreatorBankAccount.findByPk(accountId);

      if (!bankAccount) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy thông tin tài khoản ngân hàng'
        });
      }

      await bankAccount.update({ is_verified });

      res.status(200).json({
        success: true,
        message: `${is_verified ? 'Xác thực' : 'Hủy xác thực'} tài khoản ngân hàng thành công`,
        data: bankAccount
      });
    } catch (error) {
      console.error('Error in verifyBankAccount:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xác thực tài khoản ngân hàng',
        error: error.message
      });
    }
  }

  /**
   * Lấy thông tin tài khoản ngân hàng của creator theo courseId (cho payment)
   */
  async getBankAccountByCourse(req, res) {
    try {
      const { courseId } = req.params;

      // Lấy thông tin course để biết instructor_id
      const Course = require('../models/Course');
      const course = await Course.findByPk(courseId);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy khóa học'
        });
      }

      // Lấy thông tin tài khoản ngân hàng của instructor
      const bankAccount = await CreatorBankAccount.findOne({
        where: { 
          user_id: course.instructor_id,
          is_active: true
        }
      });

      if (!bankAccount) {
        // Trả về thông tin mặc định nếu creator chưa cập nhật
        return res.status(200).json({
          success: true,
          data: {
            useDefault: true,
            message: 'Creator chưa cập nhật thông tin tài khoản ngân hàng'
          }
        });
      }

      // Chỉ trả về thông tin cần thiết cho thanh toán
      res.status(200).json({
        success: true,
        data: {
          useDefault: false,
          bankInfo: bankAccount.getFullInfo()
        }
      });
    } catch (error) {
      console.error('Error in getBankAccountByCourse:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy thông tin tài khoản ngân hàng',
        error: error.message
      });
    }
  }
}

module.exports = new CreatorBankAccountController();
