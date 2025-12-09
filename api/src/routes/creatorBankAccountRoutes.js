const express = require('express');
const router = express.Router();
const creatorBankAccountController = require('../controllers/creatorBankAccountController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Creator routes (cần authenticate và role creator)
router.get('/my-bank-account', 
  authenticateToken, 
  creatorBankAccountController.getMyBankAccount
);

router.post('/my-bank-account', 
  authenticateToken, 
  creatorBankAccountController.upsertBankAccount
);

router.put('/my-bank-account', 
  authenticateToken, 
  creatorBankAccountController.upsertBankAccount
);

router.delete('/my-bank-account', 
  authenticateToken, 
  creatorBankAccountController.deleteBankAccount
);

// Public route - lấy thông tin bank account theo courseId (cho payment)
router.get('/courses/:courseId/bank-account', 
  creatorBankAccountController.getBankAccountByCourse
);

// Admin routes
router.get('/admin/bank-accounts', 
  authenticateToken, 
  requireRole('admin'), 
  creatorBankAccountController.getAllBankAccounts
);

router.patch('/admin/bank-accounts/:accountId/verify', 
  authenticateToken, 
  requireRole('admin'), 
  creatorBankAccountController.verifyBankAccount
);

module.exports = router;
