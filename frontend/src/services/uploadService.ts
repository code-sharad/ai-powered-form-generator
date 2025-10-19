import { api } from '@/lib/api';
import type { CloudinarySignature, CloudinaryUploadResponse } from '@/types';

export const uploadService = {
  // Get signature from backend
  async getUploadSignature(options?: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
  }): Promise<CloudinarySignature> {
    const response = await api.post<{ success: boolean; data: CloudinarySignature }>(
      '/upload/generate-signature',
      {
        folder: options?.folder || 'form-uploads',
        resourceType: options?.resourceType || 'auto',
      }
    );
    return response.data.data;
  },

  // Upload file to Cloudinary
  async uploadToCloudinary(
    file: File,
    options?: {
      folder?: string;
      resourceType?: 'image' | 'video' | 'raw' | 'auto';
    }
  ): Promise<CloudinaryUploadResponse> {
    // Step 1: Get signature from backend
    const signatureData = await this.getUploadSignature(options);

    // Step 2: Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('signature', signatureData.signature);
    formData.append('timestamp', signatureData.timestamp.toString());
    formData.append('api_key', signatureData.apiKey);
    formData.append('folder', options?.folder || 'form-uploads');

    const uploadResponse = await fetch(signatureData.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload to Cloudinary failed');
    }

    const uploadResult = await uploadResponse.json();

    return {
      publicId: uploadResult.public_id,
      url: uploadResult.secure_url,
      format: uploadResult.format,
      bytes: uploadResult.bytes,
      width: uploadResult.width,
      height: uploadResult.height,
      resourceType: uploadResult.resource_type,
    };
  },
};
