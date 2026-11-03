import { User } from '@/models/User.model';
import { MagicLinkToken } from '@/models/MagicLinkToken.model';
import express, { type Request, type Response, Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from "bcrypt"
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { buildMagicLinkUrl, generateMagicLinkToken, hashMagicLinkToken, resolveFrontendBaseUrl } from '@/utils/magicLink';
import { createRateLimiter } from '@/utils/rateLimit';
import { sendMagicLinkEmail } from '@/services/mailer';

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

const magicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
});

const verifyMagicLinkSchema = z.object({
  token: z.string().min(10, 'Invalid token'),
});

function signToken(user: { _id?: unknown; email?: unknown }): string {
  return jwt.sign(
    { userId: user._id, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  );
}

const emailLimiter = createRateLimiter({
  limit: config.magicLink.requestLimitPerEmail,
  windowMs: config.magicLink.requestWindowMs,
});

const ipLimiter = createRateLimiter({
  limit: config.magicLink.requestLimitPerIp,
  windowMs: config.magicLink.requestWindowMs,
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
          createdAt: newUser.createdAt,
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
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = signToken(user);
    res.status(200).json({
      'success': true, message: 'Login successful', 'data': {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
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

router.post('/magic-link', async (req: Request, res: Response) => {
  try {
    const parsedData = magicLinkSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ success: false, error: 'Invalid input' });
    }
    const { email, name } = parsedData.data;
    const normalizedEmail = email.toLowerCase();

    const emailCheck = emailLimiter.check(`email:${normalizedEmail}`);
    if (!emailCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many requests. Try again in ${Math.ceil(emailCheck.retryAfterMs / 60000)} minutes.`,
      });
    }

    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const ipCheck = ipLimiter.check(`ip:${ip}`);
    if (!ipCheck.allowed) {
      return res.status(429).json({
        success: false,
        error: `Too many requests. Try again in ${Math.ceil(ipCheck.retryAfterMs / 60000)} minutes.`,
      });
    }

    const rawToken = generateMagicLinkToken();
    const tokenHash = hashMagicLinkToken(rawToken);
    const expiresAt = new Date(Date.now() + config.magicLink.ttlMinutes * 60 * 1000);

    await MagicLinkToken.create({
      tokenHash,
      email: normalizedEmail,
      name,
      expiresAt,
    });

    const baseUrl = resolveFrontendBaseUrl({ frontendUrl: config.frontendUrl, nodeEnv: config.nodeEnv });
    const url = buildMagicLinkUrl(baseUrl, rawToken);

    await sendMagicLinkEmail({ to: normalizedEmail, url, expiresInMinutes: config.magicLink.ttlMinutes });

    return res.status(200).json({
      success: true,
      message: 'If that address can sign in, a link is on its way.',
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return res.status(500).json({ success: false, error: 'Failed to send magic link' });
  }
});

router.post('/magic-link/verify', async (req: Request, res: Response) => {
  try {
    const parsedData = verifyMagicLinkSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ success: false, error: 'This link is invalid or has expired. Request a new one.' });
    }
    const rawToken = parsedData.data.token;
    const tokenHash = hashMagicLinkToken(rawToken);

    const tokenDoc = await MagicLinkToken.findOneAndUpdate(
      { tokenHash, consumedAt: null, expiresAt: { $gt: new Date() } },
      { $set: { consumedAt: new Date() } },
      { new: true },
    );
    if (!tokenDoc) {
      return res.status(400).json({ success: false, error: 'This link is invalid or has expired. Request a new one.' });
    }

    const email = String(tokenDoc.email ?? '').toLowerCase();
    const carriedName = typeof tokenDoc.name === 'string' ? tokenDoc.name : undefined;
    const localPart = email.split('@')[0] ?? email;
    const fallbackName = localPart.charAt(0).toUpperCase() + localPart.slice(1);

    // Upsert rather than create, so two links for the same new address cannot
    // race on the unique email index and fail the second sign-in.
    const user = await User.findOneAndUpdate(
      { email },
      { $setOnInsert: { name: carriedName || fallbackName } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const token = signToken(user);
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      token,
    });
  } catch (error) {
    console.error('Magic link verify error:', error);
    return res.status(500).json({ success: false, error: 'Failed to sign in' });
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
          createdAt: user.createdAt,
        }
      }
    });
  }
  catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
})



export default router;