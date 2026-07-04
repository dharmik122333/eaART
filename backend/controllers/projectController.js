const Project = require('../models/Project');
const { isMongoConnected, fallbackDb } = require('../utils/dbFallback');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Recruiter Only)
exports.createProject = async (req, res) => {
  try {
    const { title, description, budget, deadline, requiredSkills, category } = req.body;

    if (!title || !description || !budget || !deadline || !category) {
      return res.status(400).json({ success: false, error: 'Please fill in all required fields' });
    }

    const skillsArray = Array.isArray(requiredSkills)
      ? requiredSkills
      : requiredSkills.split(',').map(s => s.trim()).filter(Boolean);

    if (isMongoConnected()) {
      const project = await Project.create({
        title,
        description,
        budget,
        deadline,
        requiredSkills: skillsArray,
        category,
        recruiterId: req.user.id
      });
      return res.status(201).json({ success: true, project });
    } else {
      const project = fallbackDb.createProject({
        title,
        description,
        budget: Number(budget),
        deadline,
        requiredSkills: skillsArray,
        category,
        recruiterId: req.user.id
      });
      return res.status(201).json({ success: true, project });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all projects (with search & filters)
// @route   GET /api/projects
// @access  Public
exports.getProjects = async (req, res) => {
  try {
    const { category, search, minBudget, maxBudget, skills } = req.query;

    if (isMongoConnected()) {
      const query = { status: 'open' };
      if (category) query.category = category;
      if (minBudget || maxBudget) {
        query.budget = {};
        if (minBudget) query.budget.$gte = Number(minBudget);
        if (maxBudget) query.budget.$lte = Number(maxBudget);
      }
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (skills) {
        const skillsList = skills.split(',').map(s => s.trim()).filter(Boolean);
        if (skillsList.length > 0) {
          query.requiredSkills = { $in: skillsList.map(skill => new RegExp(skill, 'i')) };
        }
      }

      const projects = await Project.find(query)
        .populate('recruiterId', 'name organization profileImage')
        .sort({ createdAt: -1 });

      return res.status(200).json({ success: true, count: projects.length, projects });
    } else {
      const query = { status: 'open' };
      if (category) query.category = category;
      if (minBudget) query.minBudget = Number(minBudget);
      if (maxBudget) query.maxBudget = Number(maxBudget);
      if (search) query.search = search;
      // Filter offline lists
      let projects = fallbackDb.findProjects(query);
      if (skills) {
        const skillsList = skills.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (skillsList.length > 0) {
          projects = projects.filter(p => 
            p.requiredSkills.some(s => skillsList.includes(s.toLowerCase()))
          );
        }
      }
      // Sort desc
      projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: projects.length, projects });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single project details
// @route   GET /api/projects/:id
// @access  Public
exports.getProjectById = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const project = await Project.findById(req.params.id)
        .populate('recruiterId', 'name email organization profileImage bio location');

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      return res.status(200).json({ success: true, project });
    } else {
      const project = fallbackDb.findProjectById(req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }
      return res.status(200).json({ success: true, project });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get projects posted by logged-in recruiter
// @route   GET /api/projects/recruiter/my
// @access  Private (Recruiter Only)
exports.getMyProjects = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const projects = await Project.find({ recruiterId: req.user.id }).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, count: projects.length, projects });
    } else {
      const projects = fallbackDb.findProjects({ recruiterId: req.user.id });
      projects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json({ success: true, count: projects.length, projects });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private (Recruiter Only)
exports.updateProject = async (req, res) => {
  try {
    if (isMongoConnected()) {
      let project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      if (project.recruiterId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to update this project' });
      }

      const { title, description, budget, deadline, requiredSkills, category, status } = req.body;
      const updateData = { title, description, budget, deadline, category, status };

      if (requiredSkills) {
        updateData.requiredSkills = Array.isArray(requiredSkills)
          ? requiredSkills
          : requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      }

      project = await Project.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true
      });
      return res.status(200).json({ success: true, project });
    } else {
      const project = fallbackDb.findProjectById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      // Check ownership
      const recId = project.recruiterId._id || project.recruiterId;
      if (recId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to update this project' });
      }

      const { title, description, budget, deadline, requiredSkills, category, status } = req.body;
      const updateData = { title, description, budget, deadline, category, status };

      if (requiredSkills) {
        updateData.requiredSkills = Array.isArray(requiredSkills)
          ? requiredSkills
          : requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      }

      const updated = fallbackDb.updateProject(req.params.id, updateData);
      return res.status(200).json({ success: true, project: updated });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private (Recruiter Only)
exports.deleteProject = async (req, res) => {
  try {
    if (isMongoConnected()) {
      const project = await Project.findById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      if (project.recruiterId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this project' });
      }

      await project.deleteOne();
      return res.status(200).json({ success: true, data: {} });
    } else {
      const project = fallbackDb.findProjectById(req.params.id);

      if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
      }

      const recId = project.recruiterId._id || project.recruiterId;
      if (recId !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this project' });
      }

      fallbackDb.deleteProject(req.params.id);
      return res.status(200).json({ success: true, data: {} });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
