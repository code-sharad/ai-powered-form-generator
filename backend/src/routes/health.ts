import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ApiResponse } from '@/types';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  };

  res.json(response);
});

export default router;
