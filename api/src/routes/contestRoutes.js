const express = require('express');
const contestController = require('../controllers/contestController');
const { authenticateToken, requireRole, optionalAuth } = require('../middleware/authMiddleware');
const {
  validateContestCreation,
  validateContestUpdate,
  validateContestId,
  validateProblemId,
  validateAddProblem,
  validateContestSubmission
} = require('../middleware/contestValidation');

const router = express.Router();

// Public routes (no authentication required)
router.get('/active', contestController.getActiveContests);
router.get('/upcoming', contestController.getUpcomingContests);
router.get('/past', contestController.getPastContests);

// Routes with optional authentication (works with or without token)
router.get('/', optionalAuth, contestController.getAllContests);
router.get('/:id', validateContestId, optionalAuth, contestController.getContestById);

// Contest problems - Anyone can view (no authentication required)
router.get('/:id/problems', validateContestId, optionalAuth, contestController.getContestProblems);

// Routes requiring authentication
router.use(authenticateToken); // All routes below require authentication

// Contest management - User can participate in contests
router.post('/:id/register', validateContestId, contestController.registerForContest);
router.delete('/:id/register', validateContestId, contestController.unregisterFromContest);

// Contest problem submission - Must be registered to submit
router.post('/:id/problems/:problem_id/submit', validateContestId, validateProblemId, validateContestSubmission, contestController.submitToContest);

// User's contest data
router.get('/:id/submissions', validateContestId, contestController.getUserContestSubmissions);

// Contest results - Anyone can view leaderboard and participants
router.get('/:id/leaderboard', validateContestId, contestController.getContestLeaderboard);
router.get('/:id/participants', validateContestId, contestController.getContestParticipants);

// Contest creation and management - Admin/Creator only
router.post('/', requireRole(['admin', 'creator']), validateContestCreation, contestController.createContest);
router.put('/:id', validateContestId, validateContestUpdate, contestController.updateContest); // Permission check is inside controller
router.delete('/:id', validateContestId, contestController.deleteContest); // Permission check is inside controller

// Contest problem management - Creator/Admin only
router.post('/:id/problems', validateContestId, validateAddProblem, contestController.addProblemToContest); // Permission check is inside controller
router.delete('/:id/problems/:problem_id', validateContestId, validateProblemId, contestController.removeProblemFromContest); // Permission check is inside controller

module.exports = router;
