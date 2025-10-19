import mongoose from 'mongoose';


// Field Schema (supports recursive GRID fields)
const fieldSchema = new mongoose.Schema({
  fieldId: String,
  type: {
    type: String,
    enum: ['NAME', 'EMAIL', 'PHONE', 'ADDRESS', 'DROPDOWN', 'RADIO', 'CHECKBOX', 'DATE', 'SIGNATURE', 'SINGLE_LINE', 'MULTI_LINE', 'MULTIPLE_CHOICE', 'FILE_UPLOAD', 'RATING'],
  },
  displayName: String,
  mand: Boolean,
  choices: [String],
  validation: {
    minLength: Number,
    maxLength: Number,
    pattern: String,
  },
  placeholder: String,
}, { _id: false });

// Form Schema
const formSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  formName: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    unique: true
  },
  description: String,
  category: String,
  fields: [fieldSchema],
  generatedPrompt: String,
  // settings: {
  //   allowMultipleSubmissions: { type: Boolean, default: true },
  //   showProgressBar: { type: Boolean, default: false },
  //   theme: {
  //     primaryColor: String,
  //     backgroundColor: String,
  //   },
  // },
  submissionStats: {
    count: { type: Number, default: 0 },
    lastSubmittedAt: Date,
  },
  sharing: {
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Form = mongoose.model('Form', formSchema);