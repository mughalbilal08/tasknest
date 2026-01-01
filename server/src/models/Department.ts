import mongoose, { Schema, Document } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description: string;
  members: mongoose.Types.ObjectId[];
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);

export default Department;

