import mongoose, { Document, Schema } from 'mongoose';
import { PatientInfo, AIAnalysisResult, AbnormalValue } from '../types';

export interface IReport extends Document {
  userId: mongoose.Types.ObjectId;
  patientInfo: PatientInfo;
  fileInfo: {
    originalName: string;
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    fileSize: number;
  };
  analysis: AIAnalysisResult;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const abnormalValueSchema = new Schema<AbnormalValue>({
  parameter: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  normalRange: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'high', 'critical']
  }
}, { _id: false });

const patientInfoSchema = new Schema<PatientInfo>({
  name: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    maxlength: [100, 'Patient name cannot exceed 100 characters']
  },
  age: {
    type: Number,
    required: [true, 'Patient age is required'],
    min: [0, 'Age must be a positive number'],
    max: [150, 'Age must be realistic']
  },
  gender: {
    type: String,
    required: [true, 'Patient gender is required'],
    enum: ['male', 'female', 'other']
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  }
}, { _id: false });

const fileInfoSchema = new Schema({
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  cloudinaryUrl: {
    type: String,
    required: true,
    trim: true
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
    trim: true
  },
  fileSize: {
    type: Number,
    required: true,
    min: [0, 'File size must be positive']
  }
}, { _id: false });

const analysisSchema = new Schema<AIAnalysisResult>({
  patientDetails: {
    name: { type: String, trim: true },
    age: { type: String, trim: true },
    gender: { type: String, trim: true },
    phoneNumber: { type: String, trim: true }
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  simpleExplanation: {
    type: String,
    required: true,
    trim: true
  },
  abnormalValues: [abnormalValueSchema],
  detectedDiseases: [{
    type: String,
    trim: true
  }],
  possibleCauses: [{
    type: String,
    trim: true
  }],
  symptoms: [{
    type: String,
    trim: true
  }],
  lifestyleRecommendations: [{
    type: String,
    trim: true
  }],
  medicineRecommendations: [{
    type: String,
    trim: true
  }],
  doctorRecommendations: [{
    type: String,
    trim: true
  }]
}, { _id: false });

const reportSchema = new Schema<IReport>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  patientInfo: {
    type: patientInfoSchema,
    required: [true, 'Patient information is required']
  },
  fileInfo: {
    type: fileInfoSchema,
    required: [true, 'File information is required']
  },
  analysis: {
    type: analysisSchema,
    required: function() {
      return this.status === 'completed';
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Transform _id to id for frontend compatibility
reportSchema.set('toJSON', {
  transform: function(doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

reportSchema.set('toObject', {
  transform: function(doc: any, ret: any) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Indexes for performance optimization
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ 'patientInfo.name': 'text' });
reportSchema.index({ 'patientInfo.age': 1 });
reportSchema.index({ 'patientInfo.gender': 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdAt: -1 });

export const Report = mongoose.model<IReport>('Report', reportSchema);