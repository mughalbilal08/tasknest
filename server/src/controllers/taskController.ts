import { Response } from 'express';
import mongoose from 'mongoose';
import { Task, Project, Department } from '../models';
import { AuthRequest } from '../middleware/auth';
import { notifyTaskAssigned, notifyStatusChange } from '../utils/notifications';

interface TaskQuery {
  project?: string;
  status?: string;
  priority?: string;
  assignedTo?: string;
  search?: string;
  page?: string;
  limit?: string;
}

// Helper function to check if user has access to department
const hasDepartmentAccess = async (userId: string, departmentId: string, isAdmin: boolean): Promise<boolean> => {
  if (isAdmin) return true;

  const department = await Department.findById(departmentId);
  if (!department) return false;

  return department.members.some((memberId) => memberId.toString() === userId.toString());
};

// Helper function to check if user has access to project (through department)
const hasProjectAccess = async (userId: string, projectId: string, isAdmin: boolean): Promise<boolean> => {
  if (isAdmin) return true;

  const project = await Project.findById(projectId).populate('department');
  if (!project) return false;

  const departmentId = (project.department as any)?._id?.toString() || (project.department as any)?.toString();
  return hasDepartmentAccess(userId, departmentId, isAdmin);
};

export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const {
      project,
      status,
      priority,
      assignedTo,
      search,
      page = '1',
      limit = '10',
    } = req.query as TaskQuery;

    const isAdmin = req.user?.role === 'admin';

    // Build filter object
    const filter: any = {};

    // If project filter is provided, verify access
    if (project) {
      const hasAccess = await hasProjectAccess(userId.toString(), project, isAdmin);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access denied to this project' });
        return;
      }
      filter.project = project;
    } else {
      // If no project filter, only show tasks from projects in departments user has access to
      if (isAdmin) {
        // Admins can see all tasks
        // No filter needed
      } else {
        // Get departments user is member of
        const userDepartments = await Department.find({
          members: userId,
        });
        const departmentIds = userDepartments.map((d) => d._id);
        
        // Get projects in those departments
        const userProjects = await Project.find({
          department: { $in: departmentIds },
        });
        const projectIds = userProjects.map((p) => p._id);
        filter.project = { $in: projectIds };
      }
    }

    // Apply filters
    if (status) {
      filter.status = status;
    }
    if (priority) {
      filter.priority = priority;
    }
    if (assignedTo) {
      // Convert string ID to ObjectId for proper matching
      try {
        filter.assignedTo = new mongoose.Types.ObjectId(assignedTo);
      } catch (error) {
        // Invalid ObjectId format
        res.status(400).json({ error: 'Invalid assignedTo ID format' });
        return;
      }
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Task.countDocuments(filter);

    // Fetch tasks with pagination
    const tasks = await Task.find(filter)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, status, priority, project, assignedTo } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!title) {
      res.status(400).json({ error: 'Task title is required' });
      return;
    }

    if (!project) {
      res.status(400).json({ error: 'Project is required' });
      return;
    }

    // Verify project access
    const isAdmin = req.user?.role === 'admin';
    const hasAccess = await hasProjectAccess(userId.toString(), project, isAdmin);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this project' });
      return;
    }

    // Convert assignedTo string to ObjectId if provided
    let assignedToId = null;
    if (assignedTo && assignedTo.trim() !== '') {
      try {
        assignedToId = new mongoose.Types.ObjectId(assignedTo);
      } catch (error) {
        res.status(400).json({ error: 'Invalid assignedTo ID format' });
        return;
      }
    }

    // Convert dueDate string to Date if provided
    let dueDateValue = null;
    if (req.body.dueDate && req.body.dueDate.trim() !== '') {
      dueDateValue = new Date(req.body.dueDate);
    }

    const newTask = new Task({
      title,
      description: description || '',
      status: status || 'todo',
      priority: priority || 'medium',
      project,
      assignedTo: assignedToId,
      createdBy: userId,
      dueDate: dueDateValue,
    });

    await newTask.save();
    await newTask.populate('project', 'name');
    await newTask.populate('assignedTo', 'name email');
    await newTask.populate('createdBy', 'name email');

    // Notify assignee if task is assigned
    if (assignedToId && assignedToId.toString() !== userId.toString()) {
      const userName = req.user?.name || 'Someone';
      await notifyTaskAssigned(
        newTask._id.toString(),
        assignedToId.toString(),
        userName,
        newTask.title
      );
    }

    res.status(201).json({
      message: 'Task created successfully',
      task: newTask,
    });
  } catch (error: any) {
    console.error('Create task error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getTaskById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const task = await Task.findById(id)
      .populate('project', 'name')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Verify project access
    const isAdmin = req.user?.role === 'admin';
    const hasAccess = await hasProjectAccess(userId.toString(), task.project.toString(), isAdmin);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this task' });
      return;
    }

    res.status(200).json({ task });
  } catch (error: any) {
    console.error('Get task by ID error:', error);

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, assignedTo } = req.body;
    const userId = req.user?._id;
    const userName = req.user?.name || 'Someone';

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Verify project access
    const isAdmin = req.user?.role === 'admin';
    const hasAccess = await hasProjectAccess(userId.toString(), task.project.toString(), isAdmin);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this task' });
      return;
    }

    // Check if user can modify this task
    // Admins can modify any task, regular users can only modify tasks assigned to them
    if (!isAdmin) {
      const assignedToId = task.assignedTo ? task.assignedTo.toString() : null;
      if (!assignedToId || assignedToId !== userId.toString()) {
        res.status(403).json({ error: 'You can only modify tasks assigned to you' });
        return;
      }
    }

    const oldStatus = task.status;
    const oldAssignedTo = task.assignedTo?.toString();

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) {
      // Convert string ID to ObjectId or set to null
      if (assignedTo && assignedTo.trim() !== '') {
        try {
          task.assignedTo = new mongoose.Types.ObjectId(assignedTo);
        } catch (error) {
          res.status(400).json({ error: 'Invalid assignedTo ID format' });
          return;
        }
      } else {
        task.assignedTo = null;
      }
    }
    if (req.body.dueDate !== undefined) {
      task.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    }

    await task.save();
    await task.populate('project', 'name');
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    // Trigger notifications
    const newAssignedTo = task.assignedTo ? task.assignedTo.toString() : null;

    // Notify on assignment change
    if (assignedTo !== undefined && newAssignedTo !== oldAssignedTo) {
      if (newAssignedTo) {
        await notifyTaskAssigned(
          task._id.toString(),
          newAssignedTo,
          userName,
          task.title
        );
      }
    }

    // Notify on status change
    if (status !== undefined && status !== oldStatus) {
      await notifyStatusChange(
        task._id.toString(),
        task.title,
        oldStatus,
        status,
        userName,
        newAssignedTo || undefined
      );
    }

    res.status(200).json({
      message: 'Task updated successfully',
      task,
    });
  } catch (error: any) {
    console.error('Update task error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Only admins can delete tasks
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can delete tasks' });
      return;
    }

    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Delete all comments associated with this task
    const { Comment } = await import('../models');
    await Comment.deleteMany({ task: id });

    // Delete the task
    await Task.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Task deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete task error:', error);

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

