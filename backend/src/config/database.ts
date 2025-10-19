// backend/src/config/database.ts
import mongoose from 'mongoose';
import { config } from '@/config';

export async function connectDB() {
  try {
    if (!config.DB_URL) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // Mongoose connection options
    await mongoose.connect(config.DB_URL, {
      // Recommended options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ Database connected successfully');
    console.log(`📊 Connected to: ${mongoose.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.error('Make sure MongoDB is running and DATABASE_URL is correct');
    process.exit(1); // Exit if database connection fails
  }
}

// Graceful shutdown
export async function disconnectDB() {
  try {
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}