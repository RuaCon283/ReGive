const mongoose = require('mongoose');
const {
  AI_ASSESSMENT_STATUS,
  PRODUCT_CONDITION,
  PRODUCT_QUALITY,
} = require('../constants/enums');

const suggestionSchema = new mongoose.Schema(
  {
    category: { type: String, default: 'other' },
    condition: { type: String, enum: Object.values(PRODUCT_CONDITION), default: null },
    quality: { type: String, enum: Object.values(PRODUCT_QUALITY), default: null },
    suggestedPrice: { type: Number, default: 0, min: 0 },
    suitableForMarketplace: { type: Boolean, default: false },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
    rationale: { type: String, default: '' },
  },
  { _id: false }
);

const aiAssessmentSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: Object.values(AI_ASSESSMENT_STATUS),
      default: AI_ASSESSMENT_STATUS.SUGGESTED,
    },
    provider: { type: String, default: 'heuristic' },
    input: {
      name: { type: String, default: '' },
      description: { type: String, default: '' },
      category: { type: String, default: '' },
      images: [{ type: String }],
      extraNote: { type: String, default: '' },
    },
    suggestion: { type: suggestionSchema, default: () => ({}) },
    finalDecision: { type: suggestionSchema, default: null },
    rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    errorMessage: { type: String, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    appliedToProduct: { type: Boolean, default: false },
  },
  { timestamps: true }
);

aiAssessmentSchema.index({ product: 1, createdAt: -1 });
aiAssessmentSchema.index({ status: 1 });

module.exports = mongoose.model('AiAssessment', aiAssessmentSchema);
