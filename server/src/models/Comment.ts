import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  task: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
}

const CommentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task is required'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Comment = mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;

