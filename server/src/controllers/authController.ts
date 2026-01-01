import { Response } from 'express';
import { User } from '../models';
import { generateToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';

interface SignupRequest extends AuthRequest {
  body: {
    name: string;
    email: string;
    password: string;
  };
}

interface LoginRequest extends AuthRequest {
  body: {
    email: string;
    password: string;
  };
}

export const signup = async (req: SignupRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    // Check if this is the first user
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    // Create new user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
      role: isFirstUser ? 'admin' : 'member',
      status: isFirstUser ? 'approved' : 'pending',
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser._id.toString(), newUser.email);

    // Return user data and token (passwordHash is excluded by toJSON)
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
      },
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({ error: messages.join(', ') });
      return;
    }

    // Handle duplicate key error (email unique constraint)
    if (error.code === 11000) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: LoginRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    // Find user by email (include passwordHash for comparison)
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid email or password' });
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

    // Generate JWT token
    const token = generateToken(user._id.toString(), user.email);

    // Return user data and token (passwordHash is excluded by toJSON)
    // Pending users are allowed to login - frontend will handle redirection
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // User is already attached to request by authenticateToken middleware
    if (!req.user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Return user data (passwordHash is excluded by toJSON)
    res.status(200).json({
      user: {
        id: req.user._id.toString(),
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        status: req.user.status,
      },
    });
  } catch (error: any) {
    console.error('Get me error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

