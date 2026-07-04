const express = require('express');
const {
  createProject,
  getProjects,
  getProjectById,
  getMyProjects,
  updateProject,
  deleteProject
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, authorize('Recruiter'), createProject);
router.get('/', getProjects);
router.get('/recruiter/my', protect, authorize('Recruiter'), getMyProjects);
router.get('/:id', getProjectById);
router.put('/:id', protect, authorize('Recruiter'), updateProject);
router.delete('/:id', protect, authorize('Recruiter'), deleteProject);

module.exports = router;
