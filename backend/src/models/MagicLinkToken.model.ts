import mongoose from 'mongoose';

const magicLinkTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: false,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  consumedAt: {
    type: Date,
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const MagicLinkToken = mongoose.model('MagicLinkToken', magicLinkTokenSchema);
