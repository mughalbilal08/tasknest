import { Response } from 'express';
import { Department } from '../models';
import { AuthRequest } from '../middleware/auth';
import { notifyDepartmentAdded } from '../utils/notifications';

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const departments = await Department.find().populate('members', 'name email');

    // Add accessible flag based on user's membership or admin role
    const departmentsWithAccess = departments.map((department) => {
      const isMember = department.members.some((member: any) => {
        const memberId = member._id ? member._id.toString() : member.toString();
        return memberId === userId.toString();
      });
      const isAdmin = req.user?.role === 'admin';
      const accessible = isMember || isAdmin;

      return {
        id: department._id.toString(),
        name: department.name,
        description: department.description,
        members: department.members.map((member: any) => ({
          id: member._id ? member._id.toString() : member.toString(),
          name: member.name || '',
          email: member.email || '',
        })),
        accessible,
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
      };
    });

    res.status(200).json({ departments: departmentsWithAccess });
  } catch (error: any) {
    console.error('Get departments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, members } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Department name is required' });
      return;
    }

    const userId = req.user?._id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Include the creator in members if not already included
    const memberIds = Array.isArray(members) ? members : [];
    if (!memberIds.some((id: string) => id.toString() === userId.toString())) {
      memberIds.push(userId.toString());
    }

    const newDepartment = new Department({
      name,
      description: description || '',
      members: memberIds,
    });

    await newDepartment.save();
    await newDepartment.populate('members', 'name email');

    // Notify all members (except the creator) that they were added to the department
    const userName = req.user?.name || 'Admin';
    const notifications = newDepartment.members
      .filter((member: any) => {
        const memberId = member._id ? member._id.toString() : member.toString();
        return memberId !== userId.toString();
      })
      .map((member: any) => {
        const memberId = member._id ? member._id.toString() : member.toString();
        return notifyDepartmentAdded(
          newDepartment._id.toString(),
          newDepartment.name,
          memberId,
          userName
        );
      });

    await Promise.all(notifications);

    res.status(201).json({
      message: 'Department created successfully',
      department: {
        id: newDepartment._id.toString(),
        name: newDepartment.name,
        description: newDepartment.description,
        members: newDepartment.members.map((member: any) => ({
          id: member._id.toString(),
          name: member.name,
          email: member.email,
        })),
        createdAt: newDepartment.createdAt,
        updatedAt: newDepartment.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Create department error:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDepartmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const department = await Department.findById(id).populate('members', 'name email');

    if (!department) {
      res.status(404).json({ error: 'Department not found' });
      return;
    }

    // Check if user is a member or admin
    const isMember = department.members.some((member: any) => {
      const memberId = member._id ? member._id.toString() : member.toString();
      return memberId === userId.toString();
    });
    const isAdmin = req.user?.role === 'admin';

    if (!isMember && !isAdmin) {
      res.status(403).json({ error: 'Access denied. You are not a member of this department.' });
      return;
    }

    res.status(200).json({
      department: {
        id: department._id.toString(),
        name: department.name,
        description: department.description,
        members: department.members.map((member: any) => ({
          id: member._id.toString(),
          name: member.name,
          email: member.email,
        })),
        createdAt: department.createdAt,
        updatedAt: department.updatedAt,
      },
    });
  } catch (error: any) {
    console.error('Get department by ID error:', error);

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid department ID' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

