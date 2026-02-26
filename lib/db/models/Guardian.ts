import mongoose, { Schema, Model } from 'mongoose';

// ─── Guardian Model ─────────────────────────────────────────────────────────

export interface IGuardian {
    _id: string;
    femaleUserId: mongoose.Types.ObjectId;
    maleUserId?: mongoose.Types.ObjectId;
    guardianName: string;
    guardianPhone: string;
    accessCode: string;
    status: 'pending' | 'active' | 'revoked';
    requestedAt: Date;
    linkedAt?: Date;
    revokedAt?: Date;
}

interface IGuardianMethods {
    generateAccessCode(): string;
    isValidCode(code: string): boolean;
}

type GuardianModel = Model<IGuardian, {}, IGuardianMethods>;

// Helper function to generate unique access code
export function generateUniqueCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

const guardianSchema = new Schema<IGuardian, GuardianModel, IGuardianMethods>(
    {
        femaleUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        maleUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        guardianName: {
            type: String,
            required: true,
        },
        guardianPhone: {
            type: String,
            required: true,
        },
        accessCode: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['pending', 'active', 'revoked'],
            default: 'pending',
            index: true,
        },
        requestedAt: {
            type: Date,
            default: Date.now,
        },
        linkedAt: Date,
        revokedAt: Date,
    },
    {
        timestamps: true,
    }
);

// Generate new access code
guardianSchema.methods.generateAccessCode = function (): string {
    this.accessCode = generateUniqueCode();
    this.status = 'pending';
    this.requestedAt = new Date();
    this.maleUserId = undefined;
    this.linkedAt = undefined;
    return this.accessCode;
};

// Validate access code
guardianSchema.methods.isValidCode = function (code: string): boolean {
    return this.accessCode === code && this.status === 'pending';
};

// Pre-validate hook to generate access code (runs before validation)
guardianSchema.pre('validate', function (next) {
    if (this.isNew && !this.accessCode) {
        this.accessCode = generateUniqueCode();
    }
    next();
});

// Keep pre-save for regeneration via method
guardianSchema.pre('save', function (next) {
    next();
});

// Indexes
guardianSchema.index({ femaleUserId: 1, status: 1 });
guardianSchema.index({ maleUserId: 1, status: 1 });

// In development, clear the cached model so schema changes are picked up on hot reload
if (process.env.NODE_ENV !== 'production' && mongoose.models.Guardian) {
    delete (mongoose.models as any).Guardian;
}

export const Guardian = (mongoose.models.Guardian as GuardianModel) ||
    mongoose.model<IGuardian, GuardianModel>('Guardian', guardianSchema);
