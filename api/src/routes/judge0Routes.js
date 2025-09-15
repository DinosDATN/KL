const express = require('express');
const judge0Controller = require('../controllers/judge0Controller');

const router = express.Router();

// Code execution routes
router.post('/execute', judge0Controller.executeCode);
router.post('/submit', judge0Controller.submitCode);

// Utility routes
router.get('/languages', judge0Controller.getSupportedLanguages);
router.get('/health', judge0Controller.healthCheck);

module.exports = router;
