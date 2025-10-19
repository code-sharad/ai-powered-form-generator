// User & Auth Types
export interface User {
  id: string;
  name?: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  name?: string;
  email: string;
  password: string;
}

// Form Types
export type FieldType =
  | 'NAME'
  | 'EMAIL'
  | 'PHONE'
  | 'ADDRESS'
  | 'DROPDOWN'
  | 'RADIO'
  | 'CHECKBOX'
  | 'DATE'
  | 'SIGNATURE'
  | 'SINGLE_LINE'
  | 'MULTI_LINE'
  | 'MULTIPLE_CHOICE'
  | 'GRID'
  | 'FILE_UPLOAD'
  | 'RATING';

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface FormField {
  fieldId: string;
  type: FieldType;
  displayName: string;
  mand: boolean;
  choices?: string[];
  gridOptions?: string[];
  validation?: FieldValidation;
  placeholder?: string;
}

export interface Form {
  _id: string;
  userId: string;
  formName: string;
  slug: string;
  description?: string;
  category: 'appointment' | 'registration' | 'order' | 'application' | 'feedback' | 'survey' | 'custom';
  fields: FormField[];
  generatedPrompt?: string;
  submissionStats?: {
    count: number;
    lastSubmittedAt?: string;
  };
  sharing?: {
    isPublic: boolean;
    shareToken?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface GenerateFormRequest {
  query: string;
}

export interface GenerateFormResponse {
  success: boolean;
  message: string;
  data: {
    formName: string;
    description: string;
    category: string;
    fields: FormField[];
  };
}

// Aliases for consistency
export type FormGenerationRequest = GenerateFormRequest;
export type FormGenerationResponse = GenerateFormResponse;

// Submission Types
export interface Submission {
  _id: string;
  formId: string;
  userId?: string;
  submitterEmail?: string;
  responses: Record<string, unknown>;
  uploadedImages?: Array<{
    fieldId: string;
    cloudinaryPublicId: string;
    url: string;
    uploadedAt: string;
  }>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    timeSpent?: number;
  };
  submittedAt: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Upload Types
export interface CloudinarySignature {
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  folder: string;
}

export interface CloudinaryUploadResponse {
  publicId: string;
  url: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  resourceType: string;
}
