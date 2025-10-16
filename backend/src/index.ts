import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@/config';
import { errorHandler, notFoundHandler } from '@/middlewares/errorHandler';
import healthRouter from '@/routes/health';

const app = express();

// Security middleware
app.use(helmet());

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
app.use(config.api.prefix, healthRouter);


// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(8080,() => {
  console.log(`running on port ${config.port}.`)
})


