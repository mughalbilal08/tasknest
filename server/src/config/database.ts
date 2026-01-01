import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      console.warn('⚠️  MONGODB_URI is not defined in environment variables');
      return;
    }

    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connected successfully');
  } catch (error: any) {
    console.warn('⚠️  MongoDB connection failed:', error.message);
    console.warn('   Server will continue running, but database features will be unavailable.');
    console.warn('   To fix: Whitelist your IP in MongoDB Atlas Network Access settings.');
  }
};

