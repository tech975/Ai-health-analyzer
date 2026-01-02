// Common types and interfaces for the application
import { Request } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

// Extended Request interface with user information
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// User related types
export interface UserPayload {
  id: string;
  email: string;
}

// Patient information
export interface PatientInfo {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phoneNumber: string;
}

// AI Analysis types
export interface AbnormalValue {
  parameter: string;
  value: string;
  normalRange: string;
  severity: 'low' | 'high' | 'critical';
}

export interface ExtractedPatientDetails {
  name: string;
  age: string;
  gender: string;
  phoneNumber: string;
}

export interface AIAnalysisResult {
  patientDetails: ExtractedPatientDetails;
  summary: string;
  simpleExplanation: string;
  abnormalValues: AbnormalValue[];
  detectedDiseases: string[];
  possibleCauses: string[];
  symptoms: string[];
  lifestyleRecommendations: string[];
  medicineRecommendations: string[];
  doctorRecommendations: string[];
}

// File upload types
export interface FileInfo {
  originalName: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  fileSize: number;
  mimeType: string;
}