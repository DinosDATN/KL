const express = require('express');
const userController = require('../controllers/userController');

const router = express.Router();

// User routes
router.get('/', userController.getAllUsers);        // GET /api/v1/users
router.get('/:id', userController.getUserById);     // GET /api/v1/users/:id
router.post('/', userController.createUser);        // POST /api/v1/users
router.put('/:id', userController.updateUser);      // PUT /api/v1/users/:id
router.delete('/:id', userController.deleteUser);   // DELETE /api/v1/users/:id

module.exports = router;
