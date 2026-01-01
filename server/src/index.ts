import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import routes from './routes';
app.use('/api', routes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Connect to MongoDB (non-blocking)
connectDB().catch(() => {
  // Connection error is already logged in connectDB
});

// Start server regardless of database connection status
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

