import { Response } from 'express';
import { User, Project } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Only admins can access this
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { status, role, search } = req.query;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    // Transform users to use 'id' instead of '_id'
    const usersWithId = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.status(200).json({ users: usersWithId });
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Only admins can access this
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { id } = req.params;
    const user = await User.findById(id).select('-passwordHash');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user's projects
    const projects = await Project.find({ members: user._id });

    res.status(200).json({
      user: {
        ...user.toObject(),
        projects: projects.map((p) => ({
          id: p._id,
          name: p.name,
          description: p.description,
        })),
      },
    });
  } catch (error: any) {
    console.error('Get user by ID error:', error);

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Only admins can access this
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'approved', 'rejected', 'inactive'].includes(status)) {
      res.status(400).json({ error: 'Valid status is required' });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.status = status as 'pending' | 'approved' | 'rejected' | 'inactive';
    await user.save();

    res.status(200).json({
      message: 'User status updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Update user status error:', error);

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Only admins can access this
    if (req.user?.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }

    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'member'].includes(role)) {
      res.status(400).json({ error: 'Valid role is required' });
      return;
    }

    const user = await User.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    user.role = role as 'admin' | 'member';
    await user.save();

    res.status(200).json({
      message: 'User role updated successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Update user role error:', error);

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

