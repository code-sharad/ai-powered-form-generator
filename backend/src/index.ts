import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@/config';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';
import healthRouter from '@/routes/health';
import FormRouter from '@/routes/form.route';
import uploadRouter from '@/routes/upload';
import SubmissionRouter from "@/routes/submission.route"
import AuthRouter from "@/routes/auth.route"
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './config/database';
import morgan from 'morgan';

const app = express();

// Security middleware
app.use(helmet());
app.use(morgan('dev'));
// CORS configuration
app.use(
  cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use(config.api.prefix + '/form', FormRouter);
app.use(config.api.prefix + '/submission', SubmissionRouter);
app.use(config.api.prefix + '/auth', AuthRouter);

app.use(config.api.prefix, healthRouter);
app.use(config.api.prefix, uploadRouter);
// app.use(config.api.prefix, analyticsRouter);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);


async function startServer() {
  try {
    await connectDB();

    app.listen(8080, () => {
      console.log(`Server running on port 8080`)
    })
  } catch (error) {
    console.log('Failed to start server');
    process.exit(1);
  }
}


// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  await disconnectDB();
  process.exit(0);
});

// Start the server
startServer();