import mongoose, { Document, Schema } from 'mongoose';

export interface IFileRecord extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  reportId?: mongoose.Types.ObjectId;
  originalName: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  fileSizeMB: string; // Virtual property
}

const FileRecordSchema = new Schema<IFileRecord>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  reportId: {
    type: Schema.Types.ObjectId,
    ref: 'Report',
    default: null,
  },
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  cloudinaryUrl: {
    type: String,
    required: true,
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
    unique: true,
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0,
  },
  mimeType: {
    type: String,
    required: true,
    enum: ['application/pdf'],
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for performance
FileRecordSchema.index({ userId: 1, uploadedAt: -1 });
FileRecordSchema.index({ cloudinaryPublicId: 1 });
FileRecordSchema.index({ reportId: 1 });

// Virtual for file size in MB
FileRecordSchema.virtual('fileSizeMB').get(function() {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Ensure virtual fields are serialized
FileRecordSchema.set('toJSON', { virtuals: true });

export const FileRecord = mongoose.model<IFileRecord>('FileRecord', FileRecordSchema);