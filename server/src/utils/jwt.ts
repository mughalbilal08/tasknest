import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
}

export const generateToken = (userId: string, email: string): string => {
  const jwtSecret = process.env.JWT_SECRET;
  
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  const payload: JWTPayload = {
    userId,
    email,
  };

  return jwt.sign(payload, jwtSecret, {
    expiresIn: '7d', // Token expires in 7 days
  });
};

