import { Notification, Task, Project, User } from '../models';
import { Types } from 'mongoose';

interface CreateNotificationParams {
  userId: string;
  type: 'task_assigned' | 'status_change' | 'comment_added' | 'department_added' | 'project_added';
  message: string;
  taskId?: string;
  projectId?: string;
  relatedUserId?: string;
}

export const createNotification = async (params: CreateNotificationParams): Promise<void> => {
  try {
    const notification = new Notification({
      user: params.userId,
      type: params.type,
      message: params.message,
      task: params.taskId,
      project: params.projectId,
      relatedUser: params.relatedUserId,
    });

    await notification.save();
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - notifications are non-critical
  }
};

export const notifyTaskAssigned = async (
  taskId: string,
  assignedToUserId: string,
  assignedByName: string,
  taskTitle: string
): Promise<void> => {
  await createNotification({
    userId: assignedToUserId,
    type: 'task_assigned',
    message: `${assignedByName} assigned you to task: ${taskTitle}`,
    taskId,
    relatedUserId: assignedToUserId,
  });
};

export const notifyStatusChange = async (
  taskId: string,
  taskTitle: string,
  oldStatus: string,
  newStatus: string,
  changedByName: string,
  assignedToUserId?: string
): Promise<void> => {
  // Notify the assignee if task is assigned
  if (assignedToUserId) {
    await createNotification({
      userId: assignedToUserId,
      type: 'status_change',
      message: `${changedByName} changed status of "${taskTitle}" from ${oldStatus} to ${newStatus}`,
      taskId,
      relatedUserId: assignedToUserId,
    });
  }
};

export const notifyCommentAdded = async (
  taskId: string,
  taskTitle: string,
  commentAuthorName: string,
  commentAuthorId: string,
  assignedToUserId?: string,
  projectMembers?: Types.ObjectId[]
): Promise<void> => {
  const usersToNotify = new Set<string>();

  // Add assignee if task is assigned (and not the comment author)
  if (assignedToUserId && assignedToUserId !== commentAuthorId) {
    usersToNotify.add(assignedToUserId);
  }

  // Add project members (excluding the comment author to avoid duplicates)
  if (projectMembers && projectMembers.length > 0) {
    projectMembers.forEach((memberId) => {
      const memberIdStr = memberId.toString();
      if (memberIdStr !== commentAuthorId) {
        usersToNotify.add(memberIdStr);
      }
    });
  }

  // Create notifications for all users
  const notifications = Array.from(usersToNotify).map((userId) =>
    createNotification({
      userId,
      type: 'comment_added',
      message: `${commentAuthorName} commented on task: ${taskTitle}`,
      taskId,
      relatedUserId: commentAuthorId,
    })
  );

  await Promise.all(notifications);
};

export const notifyDepartmentAdded = async (
  departmentId: string,
  departmentName: string,
  userId: string,
  addedByName: string
): Promise<void> => {
  await createNotification({
    userId,
    type: 'department_added',
    message: `${addedByName} added you to department: ${departmentName}`,
    projectId: departmentId,
    relatedUserId: userId,
  });
};

export const notifyProjectAdded = async (
  projectId: string,
  projectName: string,
  userId: string,
  addedByName: string
): Promise<void> => {
  await createNotification({
    userId,
    type: 'project_added',
    message: `${addedByName} added you to project: ${projectName}`,
    projectId: projectId,
    relatedUserId: userId,
  });
};

