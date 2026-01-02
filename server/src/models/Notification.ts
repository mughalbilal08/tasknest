import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'task_assigned' | 'status_change' | 'comment_added' | 'department_added' | 'project_added';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: NotificationType;
  message: string;
  read: boolean;
  task?: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  relatedUser?: mongoose.Types.ObjectId;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
        type: {
          type: String,
          enum: ['task_assigned', 'status_change', 'comment_added', 'department_added', 'project_added'],
          required: true,
        },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    read: {
      type: Boolean,
      default: false,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
    },
    relatedUser: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
NotificationSchema.index({ user: 1, read: 1 });

const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;

