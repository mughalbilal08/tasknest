import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: IUser;
}

interface JWTPayload {
  userId: string;
  email: string;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'JWT secret not configured' });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;

    // Fetch user from database
    const user = await User.findById(decoded.userId).select('-passwordHash');
    
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Block users with rejected or inactive status
    if (user.status === 'rejected' || user.status === 'inactive') {
      res.status(403).json({ 
        error: 'Account access denied',
        reason: `Your account is ${user.status}`
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      res.status(403).json({ error: 'Invalid token' });
      return;
    }
    if (error.name === 'TokenExpiredError') {
      res.status(403).json({ error: 'Token expired' });
      return;
    }
    res.status(500).json({ error: 'Authentication failed' });
  }
};

