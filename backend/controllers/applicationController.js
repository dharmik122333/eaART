const Application = require('../models/Application');
const Project = require('../models/Project');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

// @desc    Apply to a project
// @route   POST /api/applications
// @access  Private (Creator Only)
exports.applyToProject = async (req, res) => {
  try {
    const { projectId, proposal } = req.body;

    if (!projectId || !proposal) {
      return res.status(400).json({ success: false, error: 'Please provide project ID and proposal description' });
    }

    if (isMongoConnected()) {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      if (project.status !== 'open') {
        return res.status(400).json({ success: false, error: 'This project is no longer accepting applications' });
      }

      const alreadyApplied = await Application.findOne({ projectId, creatorId: req.user.id });
      if (alreadyApplied) {
        return res.status(400).json({ success: false, error: 'You have already applied to this project' });
      }

      const application = await Application.create({
        projectId,
        creatorId: req.user.id,
        proposal,
        status: 'pending'
      });

      return res.status(201).json({ success: true, application });
    } else {
      const project = fallbackDb.findProjectById(projectId);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      if (project.status !== 'open') {
        return res.status(400).json({ success: false, error: 'This project is no longer accepting applications' });
      }

      const alreadyApplied = fallbackDb.findApplicationByUnique(projectId, req.user.id);
      if (alreadyApplied) {
        return res.status(400).json({ success: false, error: 'You have already applied to this project' });
      }

      const application = fallbackDb.createApplication({
        projectId,
        creatorId: req.user.id,
        proposal,
        status: 'pending'
      });

      return res.status(201).json({ success: true, application });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get applications submitted by logged-in creator
// @route   GET /api/applications/my
// @access  Private (Creator Only)
exports.getMyApplications = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const applications = await Application.find({ creatorId: req.user.id })
        .populate({
          path: 'projectId',
          select: 'title budget status deadline category recruiterId',
          populate: {
            path: 'recruiterId',
            select: 'name organization profileImage'
          }
        })
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, count: applications.length, applications });
    } else {
      const applications = fallbackDb.findApplications({ creatorId: req.user.id });
      applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: applications.length, applications });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get applications for a recruiter's project
// @route   GET /api/applications/project/:projectId
// @access  Private (Recruiter Only)
exports.getProjectApplications = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const project = await Project.findById(req.params.projectId);

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      if (project.recruiterId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to view applications for this project' });
      }

      const applications = await Application.find({ projectId: req.params.projectId })
        .populate('creatorId', 'name email profileImage bio skills category availability location')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, count: applications.length, applications });
    } else {
      const project = fallbackDb.findProjectById(req.params.projectId);

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const recId = project.recruiterId._id || project.recruiterId;
      if (recId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to view applications for this project' });
      }

      const applications = fallbackDb.findApplications({ projectId: req.params.projectId });
      applications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: applications.length, applications });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update application status (accept/reject/hire)
// @route   PUT /api/applications/:id
// @access  Private (Recruiter Only)
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['pending', 'accepted', 'rejected', 'hired'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid application status value' });
    }

    if (isMongoConnected()) {
      const application = await Application.findById(req.params.id).populate('projectId');

      if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      if (application.projectId.recruiterId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to change this application status' });
      }

      application.status = status;
      await application.save();

      if (status === 'hired') {
        await Project.findByIdAndUpdate(application.projectId._id, { status: 'in-progress' });
      }

      return res.status(200).json({ success: true, application });
    } else {
      const application = fallbackDb.findApplicationById(req.params.id);

      if (!application) {
        return res.status(404).json({ success: false, error: 'Application not found' });
      }

      const recId = application.projectId.recruiterId._id || application.projectId.recruiterId;
      if (recId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to change this application status' });
      }

      const updated = fallbackDb.updateApplication(req.params.id, { status });

      if (status === 'hired') {
        fallbackDb.updateProject(application.projectId._id, { status: 'in-progress' });
      }

      return res.status(200).json({ success: true, application: updated });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
