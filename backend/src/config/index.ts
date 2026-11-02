// Configuration management
export const config = {
  frontendUrl: process.env.FRONTEND_URL,
  DB_URL:process.env.DATABASE_URL,
  port: process.env.PORT || '3000',
  nodeEnv: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',

  cors: {
    origins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  },

  api: {
    prefix: '/api/v1',
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },

  // Add your API keys and secrets here
  secrets: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
    openaiKey: process.env.OPENAI_API_KEY,
    anthropicKey: process.env.ANTHROPIC_API_KEY,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'your_cloud_name',
    apiKey: process.env.CLOUDINARY_API_KEY || 'your_api',
    apiSecret: process.env.CLOUDINARY_API_SECRET || 'your_api_secret',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'hi',
    expiresIn: '7d',
  },
  mail: {
    resendApiKey: process.env.RESEND_API_KEY,
    from: process.env.MAIL_FROM?.trim() || 'Formora <onboarding@resend.dev>',
  },
  magicLink: {
    ttlMinutes: 15,
    requestLimitPerEmail: 3,
    requestLimitPerIp: 10,
    requestWindowMs: 15 * 60 * 1000,
  },
} as const;

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';
