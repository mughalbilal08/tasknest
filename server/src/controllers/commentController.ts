import { Response } from 'express';
import { Comment, Task, Project, Department } from '../models';
import { AuthRequest } from '../middleware/auth';
import { notifyCommentAdded } from '../utils/notifications';

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

export const getComments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify task exists and user has access
    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const isAdmin = req.user?.role === 'admin';
    const hasAccess = await hasProjectAccess(
      userId.toString(),
      task.project.toString(),
      isAdmin
    );
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this task' });
      return;
    }

    const comments = await Comment.find({ task: taskId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: 1 });

    res.status(200).json({ comments });
  } catch (error: any) {
    console.error('Get comments error:', error);

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid task ID' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;
    const userName = req.user?.name || 'Someone';

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!content || !content.trim()) {
      res.status(400).json({ error: 'Comment content is required' });
      return;
    }

    // Verify task exists and user has access
    const task = await Task.findById(taskId).populate('project').populate('assignedTo');
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const isAdmin = req.user?.role === 'admin';
    const project = task.project as any;
    const hasAccess = await hasProjectAccess(userId.toString(), project._id.toString(), isAdmin);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this task' });
      return;
    }

    const newComment = new Comment({
      content: content.trim(),
      task: taskId,
      createdBy: userId,
    });

    await newComment.save();
    await newComment.populate('createdBy', 'name email');

    // Trigger notification
    const assignedToId = task.assignedTo ? (task.assignedTo as any)._id.toString() : undefined;
    await notifyCommentAdded(
      taskId,
      task.title,
      userName,
      userId.toString(),
      assignedToId,
      project.members
    );

    res.status(201).json({
      message: 'Comment created successfully',
      comment: newComment,
    });
  } catch (error: any) {
    console.error('Create comment error:', error);

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

