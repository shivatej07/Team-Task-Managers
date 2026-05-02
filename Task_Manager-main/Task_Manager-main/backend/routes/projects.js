const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// POST /api/projects — Create project (Admin only)
router.post(
  '/',
  auth,
  roleCheck('admin'),
  [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Project name must be 2-100 characters'),
    body('description').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, description } = req.body;

      const project = new Project({
        name,
        description,
        owner: req.user._id,
        members: [req.user._id], // Owner is automatically a member
      });

      await project.save();
      await project.populate('owner', 'name email');
      await project.populate('members', 'name email role');

      res.status(201).json({ message: 'Project created successfully.', project });
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// GET /api/projects — List projects user is part of
router.get('/', auth, async (req, res) => {
  try {
    let query;
    if (req.user.role === 'admin') {
      query = {}; // Admins see all projects
    } else {
      query = { members: req.user._id }; // Members see only their projects
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('members', 'name email role')
      .sort({ createdAt: -1 });

    // Attach task counts for each project
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
        ]);

        const counts = { todo: 0, 'in-progress': 0, done: 0, total: 0 };
        taskCounts.forEach((tc) => {
          counts[tc._id] = tc.count;
          counts.total += tc.count;
        });

        return { ...project.toObject(), taskCounts: counts };
      })
    );

    res.json({ projects: projectsWithCounts });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/projects/:id — Get project detail
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Members can only see projects they belong to
    if (
      req.user.role !== 'admin' &&
      !project.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    // Get tasks for this project
    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ project, tasks });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/projects/:id — Update project (Admin only)
router.put(
  '/:id',
  auth,
  roleCheck('admin'),
  [
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('status').optional().isIn(['active', 'completed', 'archived']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      const { name, description, status } = req.body;
      if (name) project.name = name;
      if (description !== undefined) project.description = description;
      if (status) project.status = status;

      await project.save();
      await project.populate('owner', 'name email');
      await project.populate('members', 'name email role');

      res.json({ message: 'Project updated.', project });
    } catch (error) {
      console.error('Update project error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// DELETE /api/projects/:id — Delete project (Admin only)
router.delete('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: project._id });
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: 'Project and its tasks deleted.' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/projects/:id/members — Add member (Admin only)
router.post(
  '/:id/members',
  auth,
  roleCheck('admin'),
  [body('userId').notEmpty().withMessage('User ID is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      const user = await User.findById(req.body.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Check if already a member
      if (project.members.some((m) => m.toString() === req.body.userId)) {
        return res.status(400).json({ message: 'User is already a member.' });
      }

      project.members.push(req.body.userId);
      await project.save();
      await project.populate('members', 'name email role');

      res.json({ message: 'Member added.', project });
    } catch (error) {
      console.error('Add member error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// DELETE /api/projects/:id/members/:userId — Remove member (Admin only)
router.delete('/:id/members/:userId', auth, roleCheck('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found.' });
    }

    // Cannot remove the owner
    if (project.owner.toString() === req.params.userId) {
      return res.status(400).json({ message: 'Cannot remove the project owner.' });
    }

    project.members = project.members.filter((m) => m.toString() !== req.params.userId);
    await project.save();
    await project.populate('members', 'name email role');

    res.json({ message: 'Member removed.', project });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
