// API Response types
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

// Report types
export interface Report {
  id: string;
  _id?: string; // MongoDB ObjectId
  userId: string;
  patientInfo: PatientInfo;
  fileInfo: {
    originalName: string;
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    fileSize: number;
  };
  analysis: AIAnalysisResult;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

// Authentication types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

// Form types
export interface PatientFormData {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  phoneNumber: string;
}

// Pagination types
export interface PaginatedResponse<T> {
  reports: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage?: boolean;
    hasPrevPage?: boolean;
  };
  filters?: {
    search?: string | null;
    age?: number | null;
    gender?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  };
}

// Search and filter types
export interface ReportFilters {
  search?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  page?: number;
  limit?: number;
}