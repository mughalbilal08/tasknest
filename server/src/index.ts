import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      'http://localhost:5173', // Vite default dev server
      'http://localhost:3000', // Alternative dev port
    ];

    // Add CLIENT_URL from environment if set (supports comma-separated multiple URLs)
    if (process.env.CLIENT_URL) {
      const clientUrls = process.env.CLIENT_URL.split(',').map(url => url.trim());
      allowedOrigins.push(...clientUrls);
    }

    // In development, allow all origins for easier testing
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Allow requests with no origin (like mobile apps, Postman, or same-origin requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments (any *.vercel.app domain)
    if (origin.includes('.vercel.app')) {
      return callback(null, true);
    }

    // Reject all other origins
    console.warn(`⚠️  CORS blocked origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
import routes from './routes';
app.use('/api', routes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the Vite build directory
  app.use(express.static(path.join(__dirname, '../../client/dist')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Connect to MongoDB (non-blocking)
connectDB().catch(() => {
  // Connection error is already logged in connectDB
});

// Start server regardless of database connection status
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

