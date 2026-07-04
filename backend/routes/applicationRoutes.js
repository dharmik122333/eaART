const express = require('express');
const {
  applyToProject,
  getMyApplications,
  getProjectApplications,
  updateApplicationStatus
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('Creator'), applyToProject);
router.get('/my', protect, authorize('Creator'), getMyApplications);
router.get('/project/:projectId', protect, authorize('Recruiter'), getProjectApplications);
router.put('/:id', protect, authorize('Recruiter'), updateApplicationStatus);

module.exports = router;
