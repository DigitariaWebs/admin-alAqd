import mongoose, { Schema, Document } from 'mongoose';

export type VerificationStatus = 'pending' | 'processing' | 'verified' | 'rejected' | 'manual_review';

export interface IVerification extends Document {
  userId: mongoose.Types.ObjectId;
  selfieUrl: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  // Face comparison results
  faceMatch: boolean | null;
  faceScore: number | null; // 0-1, higher = more similar
  faceDetectedInSelfie: boolean | null;
  faceDetectedInId: boolean | null;
  // OCR
  nameMatch: boolean | null;
  dobMatch: boolean | null;
  extractedText: string;
  // Decision
  status: VerificationStatus;
  rejectionReason: string;
  reviewedBy: mongoose.Types.ObjectId | null;
  reviewedAt: Date | null;
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const verificationSchema = new Schema<IVerification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    selfieUrl: {
      type: String,
      required: true,
    },
    idCardFrontUrl: {
      type: String,
      required: true,
    },
    idCardBackUrl: {
      type: String,
      required: true,
    },
    faceMatch: {
      type: Boolean,
      default: null,
    },
    faceScore: {
      type: Number,
      default: null,
    },
    faceDetectedInSelfie: {
      type: Boolean,
      default: null,
    },
    faceDetectedInId: {
      type: Boolean,
      default: null,
    },
    nameMatch: {
      type: Boolean,
      default: null,
    },
    dobMatch: {
      type: Boolean,
      default: null,
    },
    extractedText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'verified', 'rejected', 'manual_review'],
      default: 'pending',
    },
    rejectionReason: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Verification = mongoose.models.Verification || mongoose.model<IVerification>('Verification', verificationSchema);
