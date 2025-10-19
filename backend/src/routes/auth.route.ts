import { User } from '@/models/User.model';
import express, { type Request, type Response, Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from "bcrypt"
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { config } from '@/config';

const router = Router();


const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});


const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Signup Route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const parsedData = registerSchema.safeParse(req.body);
    if (!parsedData.success) {
      console.log(parsedData.error.message
      )
      return res.status(400).json({ message: 'Invalid input',error: 'password must have 8 characters , UPPERCASE and lowercase letters.'});
    }
    const { name, email, password } = parsedData.data;
    const isEmailExisted = await User.findOne({ email });
    if (isEmailExisted) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      _id: new mongoose.Types.ObjectId(),
      name,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      'success': true, message: 'User created successfully', 'data': {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
        }
      }
    });
  }
  catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
})



// Login Route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsedData = loginSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ message: 'Invalid input' });
    }
    const { email, password } = parsedData.data;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      config.jwt.secret as string,
      { expiresIn: config.jwt.expiresIn }

    )
    res.status(200).json({
      'success': true, message: 'Login successful', 'data': {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        }
      },
      token: token
    });
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error});
    }

    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
    });

  }
});

router.get('/me', async (req: Request, res: Response) => {
  try{
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const decoded = jwt.verify(token, config.jwt.secret as string) as jwt.JwtPayload;
    const userId = decoded.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        }
      }
    });
  }
  catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
})



export default router;