const express = require('express');
const { body, query, validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/tasks — Create task (Admin only)
router.post(
  '/',
  auth,
  [
    body('title').trim().isLength({ min: 2, max: 200 }).withMessage('Title must be 2-200 characters'),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('project').notEmpty().withMessage('Project ID is required'),
    body('assignedTo').optional(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      // Verify project exists
      const project = await Project.findById(req.body.project);
      if (!project) {
        return res.status(404).json({ message: 'Project not found.' });
      }

      // Only admins or project owner can create tasks
      if (
        req.user.role !== 'admin' &&
        project.owner.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({ message: 'Only admins can create tasks.' });
      }

      // If assigning to someone, verify they are a project member
      if (req.body.assignedTo) {
        const isMember = project.members.some(
          (m) => m.toString() === req.body.assignedTo
        );
        if (!isMember) {
          return res.status(400).json({ message: 'Assigned user is not a project member.' });
        }
      }

      const task = new Task({
        title: req.body.title,
        description: req.body.description,
        project: req.body.project,
        assignedTo: req.body.assignedTo || null,
        createdBy: req.user._id,
        priority: req.body.priority || 'medium',
        dueDate: req.body.dueDate || null,
      });

      await task.save();
      await task.populate('assignedTo', 'name email');
      await task.populate('createdBy', 'name email');
      await task.populate('project', 'name');

      res.status(201).json({ message: 'Task created.', task });
    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// GET /api/tasks — List tasks (with optional filters)
router.get('/', auth, async (req, res) => {
  try {
    const filter = {};

    // Filter by project
    if (req.query.project) {
      filter.project = req.query.project;
    }

    // Filter by status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    // Filter by assigned user
    if (req.query.assignedTo) {
      filter.assignedTo = req.query.assignedTo;
    }

    // Members can only see tasks from their projects or assigned to them
    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      filter.$or = [
        { project: { $in: projectIds } },
        { assignedTo: req.user._id },
      ];
    }

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.json({ tasks });
  } catch (error) {
    console.error('List tasks error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/tasks/stats — Get task statistics for dashboard
router.get('/stats', auth, async (req, res) => {
  try {
    let matchFilter = {};

    if (req.user.role !== 'admin') {
      const userProjects = await Project.find({ members: req.user._id }).select('_id');
      const projectIds = userProjects.map((p) => p._id);
      matchFilter = {
        $or: [
          { project: { $in: projectIds } },
          { assignedTo: req.user._id },
        ],
      };
    }

    const tasks = await Task.find(matchFilter);

    const stats = {
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
      overdue: tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
      ).length,
      highPriority: tasks.filter((t) => t.priority === 'high' && t.status !== 'done').length,
    };

    res.json({ stats });
  } catch (error) {
    console.error('Task stats error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// GET /api/tasks/:id — Get task detail
router.get('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    res.json({ task });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// PUT /api/tasks/:id — Update task
router.put(
  '/:id',
  auth,
  [
    body('title').optional().trim().isLength({ min: 2, max: 200 }),
    body('description').optional().trim().isLength({ max: 1000 }),
    body('status').optional().isIn(['todo', 'in-progress', 'done']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('assignedTo').optional(),
    body('dueDate').optional(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const task = await Task.findById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: 'Task not found.' });
      }

      // Members can only update status of tasks assigned to them
      if (req.user.role !== 'admin') {
        const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();
        if (!isAssignee) {
          return res.status(403).json({ message: 'You can only update tasks assigned to you.' });
        }
        // Members can only update status
        const allowedFields = ['status'];
        const updateFields = Object.keys(req.body);
        const isValid = updateFields.every((f) => allowedFields.includes(f));
        if (!isValid) {
          return res.status(403).json({ message: 'Members can only update task status.' });
        }
      }

      // Apply updates
      const { title, description, status, priority, assignedTo, dueDate } = req.body;
      if (title) task.title = title;
      if (description !== undefined) task.description = description;
      if (status) task.status = status;
      if (priority) task.priority = priority;
      if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
      if (dueDate !== undefined) task.dueDate = dueDate || null;

      await task.save();
      await task.populate('assignedTo', 'name email');
      await task.populate('createdBy', 'name email');
      await task.populate('project', 'name');

      res.json({ message: 'Task updated.', task });
    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({ message: 'Server error.' });
    }
  }
);

// DELETE /api/tasks/:id — Delete task (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found.' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tasks.' });
    }

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted.' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;
