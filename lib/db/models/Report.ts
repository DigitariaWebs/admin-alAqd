import mongoose, { Schema, Model } from 'mongoose';

export type ReportReason =
    | 'fake_profile'
    | 'inappropriate_content'
    | 'harassment'
    | 'spam'
    | 'underage'
    | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

export interface IReport {
    _id: string;
    reporterId: mongoose.Types.ObjectId;
    reportedId: mongoose.Types.ObjectId;
    reason: ReportReason;
    details?: string;
    status: ReportStatus;
    createdAt: Date;
    updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
    {
        reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reportedId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        reason:     {
            type: String,
            enum: ['fake_profile', 'inappropriate_content', 'harassment', 'spam', 'underage', 'other'],
            required: true,
        },
        details: { type: String, maxlength: 500 },
        status:  { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
    },
    { timestamps: true }
);

// One report per (reporter, reported) pair — upsert on submit
reportSchema.index({ reporterId: 1, reportedId: 1 }, { unique: true });
reportSchema.index({ reportedId: 1, status: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

export const Report =
    (mongoose.models.Report as Model<IReport>) ||
    mongoose.model<IReport>('Report', reportSchema);
