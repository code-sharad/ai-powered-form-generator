
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { NextFunction, Request, Response  } from 'express';
import {config} from '@/config';

declare module 'express' {
  interface Request {
    userId?: string;
  }
}

const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const decoded = jwt.verify(token, config.jwt.secret as string) as JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};


export default authMiddleware;