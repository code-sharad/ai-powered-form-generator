
import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
  },
  userId: mongoose.Schema.Types.ObjectId,
  submitterEmail: String,
  responses: mongoose.Schema.Types.Mixed,
  uploadedImages: [
    {
      fieldId: String,
      cloudinaryPublicId: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  metadata: {
    ipAddress: String,
    userAgent: String,
    timeSpent: Number,
  },
  submittedAt: { type: Date, default: Date.now },
});

export const Submission = mongoose.model('Submission', submissionSchema);