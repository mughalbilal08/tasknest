import { Response } from 'express';
import { Project, Department, Task, Comment } from '../models';
import { AuthRequest } from '../middleware/auth';

// Helper function to check if user has access to department
const hasDepartmentAccess = async (userId: string, departmentId: string, isAdmin: boolean): Promise<boolean> => {
  if (isAdmin) return true;

  const department = await Department.findById(departmentId);
  if (!department) return false;

  return department.members.some((memberId) => memberId.toString() === userId.toString());
};

export const getProjects = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    const { departmentId } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const isAdmin = req.user?.role === 'admin';
    const filter: any = {};

    // If departmentId is provided, filter by department
    if (departmentId) {
      filter.department = departmentId;
    }

    const projects = await Project.find(filter)
      .populate('members', 'name email')
      .populate('department', 'name');

    // Add accessible flag based on department membership or admin role
    const projectsWithAccess = await Promise.all(
      projects.map(async (project) => {
        const departmentId = (project.department as any)?._id?.toString() || (project.department as any)?.toString();
        const hasAccess = await hasDepartmentAccess(userId.toString(), departmentId, isAdmin);

        return {
          id: project._id.toString(),
          name: project.name,
          description: project.description,
          department: {
            id: departmentId,
            name: (project.department as any)?.name || '',
          },
          members: project.members.map((member: any) => ({
            id: member._id ? member._id.toString() : member.toString(),
            name: member.name || '',
            email: member.email || '',
          })),
          accessible: hasAccess,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
      })
    );

    res.status(200).json({ projects: projectsWithAccess });
  } catch (error: any) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, departmentId, members } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Project name is required' });
      return;
    }

    if (!departmentId) {
      res.status(400).json({ error: 'Department is required' });
      return;
    }

    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Verify department exists and user has access
    const isAdmin = req.user?.role === 'admin';
    const hasAccess = await hasDepartmentAccess(userId.toString(), departmentId, isAdmin);
    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied to this department' });
      return;
    }

    // Include the creator in members if not already included
    const memberIds = Array.isArray(members) ? members : [];
    if (!memberIds.some((id: string) => id.toString() === userId.toString())) {
      memberIds.push(userId.toString());
    }

    const newProject = new Project({
      name,
      description: description || '',
      department: departmentId,
      members: memberIds,
    });

    await newProject.save();
    await newProject.populate('members', 'name email');
    await newProject.populate('department', 'name');

    res.status(201).json({
      message: 'Project created successfully',
      project: {
        id: newProject._id.toString(),
        name: newProject.name,
        description: newProject.description,
        department: {
          id: (newProject.department as any)?._id?.toString() || (newProject.department as any)?.toString(),
          name: (newProject.department as any)?.name || '',
        },
        members: newProject.members.map((member: any) => ({
          id: member._id.toString(),
          name: member.name,
          email: member.email,
        })),
        createdAt: newProject.createdAt,
        updatedAt: newProject.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Create project error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const project = await Project.findById(id)
      .populate('members', 'name email')
      .populate('department', 'name');

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Check access via department membership
    const departmentId = (project.department as any)?._id?.toString() || (project.department as any)?.toString();
    const isAdmin = req.user?.role === 'admin';
    const hasAccess = await hasDepartmentAccess(userId.toString(), departmentId, isAdmin);

    if (!hasAccess) {
      res.status(403).json({ error: 'Access denied. You are not a member of this department.' });
      return;
    }

    res.status(200).json({
      project: {
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        department: {
          id: departmentId,
          name: (project.department as any)?.name || '',
        },
        members: project.members.map((member: any) => ({
          id: member._id.toString(),
          name: member.name,
          email: member.email,
        })),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Get project by ID error:', error);

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Only admins can delete projects
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Only admins can delete projects' });
      return;
    }

    const project = await Project.findById(id);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Find all tasks in this project
    const tasks = await Task.find({ project: id });
    const taskIds = tasks.map((task) => task._id);

    // Delete all comments associated with tasks in this project
    if (taskIds.length > 0) {
      await Comment.deleteMany({ task: { $in: taskIds } });
    }

    // Delete all tasks in this project
    await Task.deleteMany({ project: id });

    // Delete the project
    await Project.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Project deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete project error:', error);

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid project ID' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};
