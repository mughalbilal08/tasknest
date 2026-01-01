import { Response } from 'express';
import { Notification, Department } from '../models';
import { AuthRequest } from '../middleware/auth';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { read } = req.query;
    const filter: any = { user: userId };

    if (read !== undefined) {
      filter.read = read === 'true';
    }

    const notifications = await Notification.find(filter)
      .populate('task', 'title')
      .populate('project', 'name') // Populates Project or Department
      .populate('relatedUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);

    // For department_added notifications, populate department separately
    // Since the 'project' field has ref: 'Project', populate won't work for Department IDs
    // So we need to manually fetch Department for department_added notifications
    const notificationsWithDepartments = await Promise.all(
      notifications.map(async (notification: any) => {
        if (notification.type === 'department_added') {
          // Get the department ID (stored in project field as ObjectId)
          const departmentId = notification.project?._id || notification.project;
          if (departmentId) {
            try {
              const department = await Department.findById(departmentId);
              if (department) {
                // Replace with department data
                notification.project = {
                  _id: department._id,
                  id: department._id.toString(),
                  name: department.name,
                };
              }
            } catch (error) {
              // Ignore errors - department might not exist
            }
          }
        }
        return notification;
      })
    );

    const unreadCount = await Notification.countDocuments({ user: userId, read: false });

    res.status(200).json({
      notifications: notificationsWithDepartments,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const notification = await Notification.findOne({ _id: id, user: userId });

    if (!notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      message: 'Notification marked as read',
      notification,
    });
  } catch (error: any) {
    console.error('Mark notification as read error:', error);

    if (error.name === 'CastError') {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    await Notification.updateMany({ user: userId, read: false }, { read: true });

    res.status(200).json({
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

