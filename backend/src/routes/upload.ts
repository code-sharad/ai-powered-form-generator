import { Router } from "express";
import type { Request, Response } from "express";
import { v2 as cloudinary } from 'cloudinary';
import { config } from "@/config";


cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret
});

const router = Router();

router.post('/upload/generate-signature', async(req: Request, res: Response) => {
  try {
    const { resourceType, folder='form-uploads'} = req.body;
    const timestamp = Math.floor(Date.now() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        folder: folder,
        // resource_type: resourceType || 'auto',
      },
      config.cloudinary.apiSecret
    );

    res.json({
      success: true,
      data: {
        signature,
        timestamp,
        cloudName: config.cloudinary.cloudName,
        apiKey: config.cloudinary.apiKey,
        uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudinary.cloudName}/${resourceType || 'auto'}/upload`
      }
    });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate signature',
    })
  }
})

export default router;