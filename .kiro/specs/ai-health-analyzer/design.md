# AI Health Analyzer Design Document

## Overview

The AI Health Analyzer is a full-stack web application built using the MERN stack (MongoDB, Express.js, React.js, Node.js) that provides intelligent analysis of patient health reports. The system integrates with AI services to interpret medical documents and present findings in user-friendly formats.

## Architecture

### Complete System Design Flow

#### 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Frontend]
        Mobile[Mobile Browser]
        Desktop[Desktop Browser]
    end
    
    subgraph "API Gateway Layer"
        Gateway[Express.js API Gateway]
        Auth[JWT Authentication]
        RateLimit[Rate Limiting]
        CORS[CORS Middleware]
    end
    
    subgraph "Business Logic Layer"
        AuthController[Auth Controller]
        ReportController[Report Controller]
        FileController[File Controller]
        AIService[AI Analysis Service]
        FileService[File Processing Service]
    end
    
    subgraph "External Services"
        GeminiAI[Google Gemini AI API]
        Cloudinary[Cloudinary Storage]
        PDFParser[PDF-Parse Library]
    end
    
    subgraph "Data Layer"
        MongoDB[(MongoDB Database)]
        UsersDB[(Users Collection)]
        ReportsDB[(Reports Collection)]
        FilesDB[(Files Collection)]
    end
    
    UI --> Gateway
    Mobile --> Gateway
    Desktop --> Gateway
    
    Gateway --> Auth
    Gateway --> RateLimit
    Gateway --> CORS
    
    Gateway --> AuthController
    Gateway --> ReportController
    Gateway --> FileController
    
    ReportController --> AIService
    FileController --> FileService
    
    AIService --> GeminiAI
    AIService --> PDFParser
    FileService --> Cloudinary
    
    AuthController --> UsersDB
    ReportController --> ReportsDB
    FileController --> FilesDB
    
    UsersDB --> MongoDB
    ReportsDB --> MongoDB
    FilesDB --> MongoDB
```

#### 2. Complete User Flow Diagram

```mermaid
flowchart TD
    Start([User Opens Application]) --> Landing[Landing Page]
    
    Landing --> Login{User Logged In?}
    Login -->|No| AuthPage[Login/Register Page]
    Login -->|Yes| HomePage[Home Page - Upload Form]
    
    AuthPage --> Register[Register New Account]
    AuthPage --> LoginForm[Login with Credentials]
    Register --> HomePage
    LoginForm --> HomePage
    
    HomePage --> FillForm[Fill Patient Information]
    FillForm --> UploadPDF[Upload PDF Health Report]
    UploadPDF --> ValidatePDF{PDF Valid?}
    
    ValidatePDF -->|No| ErrorMsg[Show Error Message]
    ErrorMsg --> UploadPDF
    ValidatePDF -->|Yes| SubmitForm[Submit Analysis Request]
    
    SubmitForm --> ProcessingPage[Show Processing Status]
    ProcessingPage --> AIAnalysis[AI Processing in Background]
    AIAnalysis --> AnalysisComplete{Analysis Complete?}
    
    AnalysisComplete -->|Success| ReportPage[Display Analysis Results]
    AnalysisComplete -->|Error| ErrorPage[Show Error & Retry Option]
    ErrorPage --> HomePage
    
    ReportPage --> ViewReport[View Detailed Analysis]
    ViewReport --> DownloadReport[Download PDF/Word]
    ViewReport --> ShareReport[Generate Share Link]
    ViewReport --> SaveToHistory[Save to User History]
    
    ReportPage --> HistoryPage[Go to History Page]
    HomePage --> HistoryPage
    
    HistoryPage --> ViewHistory[View All Reports]
    ViewHistory --> SearchFilter[Search & Filter Reports]
    SearchFilter --> SelectReports[Select Multiple Reports]
    SelectReports --> BulkDelete[Bulk Delete Reports]
    SelectReports --> ViewOldReport[View Individual Report]
    
    ViewOldReport --> ReportPage
    SaveToHistory --> HistoryPage
    
    DownloadReport --> ReportPage
    ShareReport --> ReportPage
    BulkDelete --> HistoryPage
```

#### 3. AI Health Analyzer Processing Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant FileService
    participant Cloudinary
    participant AIService
    participant PDFParser
    participant GeminiAI
    participant Database
    
    User->>Frontend: Upload PDF + Patient Info
    Frontend->>API: POST /api/reports/upload
    
    API->>FileService: Validate PDF File
    FileService->>FileService: Check file type & size
    FileService->>Cloudinary: Upload PDF to cloud storage
    Cloudinary-->>FileService: Return file URL & ID
    FileService-->>API: File upload success
    
    API->>Database: Save initial report record
    Database-->>API: Report ID created
    API-->>Frontend: Upload successful, return report ID
    
    Frontend->>API: POST /api/reports/analyze/{reportId}
    API->>AIService: Start analysis process
    
    AIService->>Cloudinary: Download PDF file
    Cloudinary-->>AIService: PDF buffer data
    
    AIService->>PDFParser: Extract text from PDF
    PDFParser->>PDFParser: Parse PDF structure
    PDFParser->>PDFParser: Extract readable text
    PDFParser-->>AIService: Return extracted text
    
    AIService->>AIService: Create structured prompt
    AIService->>GeminiAI: Send analysis request
    GeminiAI->>GeminiAI: Process medical data
    GeminiAI->>GeminiAI: Generate structured analysis
    GeminiAI-->>AIService: Return JSON analysis
    
    AIService->>AIService: Parse & validate response
    AIService->>AIService: Extract patient details
    AIService->>AIService: Identify abnormal values
    AIService-->>API: Return complete analysis
    
    API->>Database: Update report with analysis
    Database-->>API: Analysis saved
    API-->>Frontend: Analysis complete
    
    Frontend->>Frontend: Display results to user
    Frontend->>User: Show analysis report
```

#### 4. Database Flow and Data Relationships

```mermaid
erDiagram
    USERS {
        ObjectId _id PK
        string email UK
        string password
        string firstName
        string lastName
        Date createdAt
        Date updatedAt
    }
    
    REPORTS {
        ObjectId _id PK
        ObjectId userId FK
        object patientInfo
        object fileInfo
        object analysis
        string status
        Date createdAt
        Date updatedAt
    }
    
    FILES {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId reportId FK
        string originalName
        string cloudinaryUrl
        string cloudinaryPublicId
        number fileSize
        string mimeType
        Date uploadedAt
    }
    
    USERS ||--o{ REPORTS : "creates"
    USERS ||--o{ FILES : "uploads"
    REPORTS ||--|| FILES : "contains"
```

#### 5. Detailed Database Operations Flow

```mermaid
flowchart TD
    UserReg[User Registration] --> HashPass[Hash Password with bcrypt]
    HashPass --> SaveUser[Save User to MongoDB]
    SaveUser --> GenJWT[Generate JWT Token]
    
    UserLogin[User Login] --> ValidatePass[Validate Password]
    ValidatePass --> GenJWT
    
    FileUpload[File Upload Request] --> ValidateFile[Validate PDF File]
    ValidateFile --> CloudUpload[Upload to Cloudinary]
    CloudUpload --> SaveFileRecord[Save File Record to MongoDB]
    SaveFileRecord --> CreateReport[Create Initial Report Record]
    
    CreateReport --> ReportAnalysis[Start AI Analysis]
    ReportAnalysis --> ExtractText[Extract PDF Text]
    ExtractText --> AIProcess[Process with Gemini AI]
    AIProcess --> ParseResponse[Parse AI Response]
    ParseResponse --> UpdateReport[Update Report with Analysis]
    UpdateReport --> IndexReport[Index for Search]
    
    HistoryQuery[History Page Request] --> QueryReports[Query User Reports]
    QueryReports --> ApplyFilters[Apply Search Filters]
    ApplyFilters --> Paginate[Apply Pagination]
    Paginate --> ReturnResults[Return Paginated Results]
    
    SearchReports[Search Reports] --> TextSearch[MongoDB Text Search]
    TextSearch --> FilterByDate[Filter by Date Range]
    FilterByDate --> FilterByGender[Filter by Gender/Age]
    FilterByGender --> SortResults[Sort by Creation Date]
    SortResults --> ReturnResults
    
    DeleteReport[Delete Report Request] --> ValidateOwnership[Validate User Ownership]
    ValidateOwnership --> DeleteFromDB[Delete from MongoDB]
    DeleteFromDB --> DeleteFromCloud[Delete from Cloudinary]
    DeleteFromCloud --> UpdateIndexes[Update Search Indexes]
```

#### 6. Error Handling and Fallback Flow

```mermaid
flowchart TD
    ProcessStart[Start Processing] --> PDFExtract[PDF Text Extraction]
    
    PDFExtract --> PDFSuccess{PDF Extraction Success?}
    PDFSuccess -->|Yes| AIAnalysis[Send to AI Service]
    PDFSuccess -->|No| PDFError[PDF Extraction Error]
    
    PDFError --> FallbackAnalysis[Generate Fallback Analysis]
    FallbackAnalysis --> SaveFallback[Save Basic Analysis]
    
    AIAnalysis --> AITimeout{AI Response Timeout?}
    AITimeout -->|Yes| AIError[AI Service Error]
    AITimeout -->|No| AISuccess[AI Analysis Success]
    
    AIError --> RetryAI{Retry Attempts < 3?}
    RetryAI -->|Yes| AIAnalysis
    RetryAI -->|No| FallbackAnalysis
    
    AISuccess --> ParseResponse[Parse AI Response]
    ParseResponse --> ParseSuccess{Parse Success?}
    ParseSuccess -->|Yes| SaveAnalysis[Save Complete Analysis]
    ParseSuccess -->|No| FallbackAnalysis
    
    SaveAnalysis --> NotifyUser[Notify User - Success]
    SaveFallback --> NotifyUser[Notify User - Partial Success]
    
    NotifyUser --> End[Process Complete]
```

#### 7. Security and Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant AuthMiddleware
    participant Database
    participant JWTService
    
    User->>Frontend: Login Request
    Frontend->>API: POST /api/auth/login
    API->>Database: Validate user credentials
    Database-->>API: User found & password valid
    API->>JWTService: Generate JWT token
    JWTService-->>API: Return signed token
    API-->>Frontend: Return token + user info
    Frontend->>Frontend: Store token in localStorage
    
    User->>Frontend: Access protected resource
    Frontend->>API: Request with Authorization header
    API->>AuthMiddleware: Verify JWT token
    AuthMiddleware->>JWTService: Validate token signature
    JWTService-->>AuthMiddleware: Token valid
    AuthMiddleware->>Database: Get user by ID from token
    Database-->>AuthMiddleware: Return user data
    AuthMiddleware-->>API: User authenticated
    API->>API: Process protected request
    API-->>Frontend: Return protected data
```

### Technology Stack

- **Frontend**: React.js 18+ with TypeScript, Tailwind CSS, React Router
- **Backend**: Node.js with Express.js, TypeScript
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Cloudinary for PDF storage and management
- **AI Integration**: Google Gemini API for document analysis
- **Authentication**: JWT tokens with bcrypt for password hashing
- **File Processing**: Multer for file uploads, PDF-parse for text extraction

#### 8. File Processing and Storage Flow

```mermaid
flowchart TD
    UserUpload[User Selects PDF File] --> ClientValidation[Client-side Validation]
    ClientValidation --> SizeCheck{File Size < 10MB?}
    SizeCheck -->|No| SizeError[Show Size Error]
    SizeCheck -->|Yes| TypeCheck{File Type = PDF?}
    TypeCheck -->|No| TypeError[Show Type Error]
    TypeCheck -->|Yes| StartUpload[Start File Upload]
    
    StartUpload --> MulterMiddleware[Multer Middleware Processing]
    MulterMiddleware --> ServerValidation[Server-side Validation]
    ServerValidation --> PDFHeaderCheck[Check PDF Header]
    PDFHeaderCheck --> VirusCheck[Virus Scanning]
    VirusCheck --> CloudinaryUpload[Upload to Cloudinary]
    
    CloudinaryUpload --> CloudinarySuccess{Upload Success?}
    CloudinarySuccess -->|No| CloudinaryError[Cloudinary Error]
    CloudinarySuccess -->|Yes| SaveMetadata[Save File Metadata]
    
    SaveMetadata --> GenerateURL[Generate Secure URL]
    GenerateURL --> ReturnFileInfo[Return File Information]
    ReturnFileInfo --> StartAnalysis[Trigger AI Analysis]
    
    CloudinaryError --> RetryUpload{Retry Count < 3?}
    RetryUpload -->|Yes| CloudinaryUpload
    RetryUpload -->|No| UploadFailed[Upload Failed]
    
    SizeError --> UserUpload
    TypeError --> UserUpload
    UploadFailed --> UserUpload
```

#### 9. Real-time Processing Status Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant WebSocket
    participant AIService
    participant Database
    
    User->>Frontend: Submit Analysis Request
    Frontend->>API: POST /api/reports/analyze
    API->>Database: Create processing record
    API->>WebSocket: Initialize status channel
    API-->>Frontend: Return processing ID
    
    Frontend->>WebSocket: Subscribe to status updates
    
    API->>AIService: Start background processing
    AIService->>WebSocket: Status: "Extracting PDF text..."
    WebSocket-->>Frontend: Update progress (25%)
    
    AIService->>AIService: Extract text from PDF
    AIService->>WebSocket: Status: "Analyzing with AI..."
    WebSocket-->>Frontend: Update progress (50%)
    
    AIService->>AIService: Process with Gemini AI
    AIService->>WebSocket: Status: "Parsing results..."
    WebSocket-->>Frontend: Update progress (75%)
    
    AIService->>Database: Save analysis results
    AIService->>WebSocket: Status: "Analysis complete!"
    WebSocket-->>Frontend: Update progress (100%)
    
    Frontend->>API: GET /api/reports/{id}
    API-->>Frontend: Return complete analysis
    Frontend->>User: Display results
```

#### 10. Search and Filter System Flow

```mermaid
flowchart TD
    HistoryPage[User Opens History Page] --> LoadReports[Load Initial Reports]
    LoadReports --> DisplayList[Display Paginated List]
    
    DisplayList --> UserAction{User Action}
    
    UserAction -->|Search| SearchInput[Enter Search Term]
    UserAction -->|Filter| FilterSelect[Select Filter Options]
    UserAction -->|Sort| SortSelect[Select Sort Option]
    UserAction -->|Paginate| PageSelect[Select Page Number]
    
    SearchInput --> BuildQuery[Build Search Query]
    FilterSelect --> BuildQuery
    SortSelect --> BuildQuery
    PageSelect --> BuildQuery
    
    BuildQuery --> MongoQuery[Execute MongoDB Query]
    MongoQuery --> TextSearch[MongoDB Text Search]
    TextSearch --> DateFilter[Apply Date Range Filter]
    DateFilter --> GenderFilter[Apply Gender Filter]
    GenderFilter --> AgeFilter[Apply Age Range Filter]
    AgeFilter --> SortResults[Sort by Selected Criteria]
    SortResults --> ApplyPagination[Apply Pagination]
    ApplyPagination --> ReturnResults[Return Filtered Results]
    
    ReturnResults --> UpdateUI[Update Frontend UI]
    UpdateUI --> DisplayList
    
    UserAction -->|Select| SelectReports[Select Multiple Reports]
    SelectReports --> BulkActions[Show Bulk Action Options]
    BulkActions --> BulkDelete[Bulk Delete Selected]
    BulkDelete --> ConfirmDialog[Show Confirmation Dialog]
    ConfirmDialog --> DeleteFromDB[Delete from Database]
    DeleteFromDB --> DeleteFromCloud[Delete from Cloudinary]
    DeleteFromCloud --> RefreshList[Refresh Report List]
    RefreshList --> DisplayList
```

## Components and Interfaces

### Frontend Components

#### 1. Layout Components
- **Header Component**: Navigation bar with logo and menu items
- **Footer Component**: Consistent footer across all pages
- **Layout Wrapper**: Common layout structure for all pages

#### 2. Page Components
- **HomePage**: Main landing page with upload form
- **ReportPage**: Displays AI analysis results with download options
- **HistoryPage**: Lists previous reports with search and filter capabilities

#### 3. Feature Components
- **FileUpload**: Drag-and-drop PDF upload with validation
- **PatientForm**: Form for patient demographic information
- **ReportViewer**: Displays formatted AI analysis results
- **ReportList**: Paginated list of historical reports
- **SearchFilter**: Search and filter controls for report history

### Backend API Endpoints

#### Authentication Routes
```
POST /api/auth/register - User registration
POST /api/auth/login - User authentication
GET /api/auth/profile - Get user profile
```

#### Report Routes
```
POST /api/reports/upload - Upload health report file
POST /api/reports/analyze - Generate AI analysis
GET /api/reports/:id - Get specific report
GET /api/reports/user/:userId - Get user's report history
DELETE /api/reports/:id - Delete report
POST /api/reports/:id/download - Generate downloadable report
POST /api/reports/:id/share - Generate shareable link
```

#### File Routes
```
POST /api/files/upload - Upload file to Cloudinary
GET /api/files/:id - Get file metadata
DELETE /api/files/:id - Delete file from storage
```

### AI Service Integration

#### Gemini API Integration
```typescript
interface AIAnalysisRequest {
  fileContent: string;
  patientInfo: PatientInfo;
}

interface AIAnalysisResponse {
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
```

## Data Models

### User Model
```typescript
interface User {
  _id: ObjectId;
  email: string;
  password: string; // hashed
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Report Model
```typescript
interface Report {
  _id: ObjectId;
  userId: ObjectId;
  patientInfo: {
    name: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    phoneNumber: string;
  };
  fileInfo: {
    originalName: string;
    cloudinaryUrl: string;
    cloudinaryPublicId: string;
    fileSize: number;
  };
  analysis: {
    summary: string;
    simpleExplanation: string;
    abnormalValues: AbnormalValue[];
    detectedDiseases: string[];
    possibleCauses: string[];
    symptoms: string[];
    lifestyleRecommendations: string[];
    medicineRecommendations: string[];
    doctorRecommendations: string[];
  };
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

interface AbnormalValue {
  parameter: string;
  value: string;
  normalRange: string;
  severity: 'low' | 'high' | 'critical';
}
```

### File Model
```typescript
interface FileRecord {
  _id: ObjectId;
  userId: ObjectId;
  reportId: ObjectId;
  originalName: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}
```

## Error Handling

### Frontend Error Handling
- **Network Errors**: Display user-friendly messages for connection issues
- **Validation Errors**: Real-time form validation with clear error messages
- **File Upload Errors**: Specific messages for file type, size, and format issues
- **AI Processing Errors**: Informative messages when analysis fails

### Backend Error Handling
- **Input Validation**: Joi schema validation for all API endpoints
- **File Processing Errors**: Proper error responses for invalid or corrupted files
- **AI Service Errors**: Fallback mechanisms and retry logic for AI API failures
- **Database Errors**: Graceful handling of connection and query failures

### Error Response Format
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

## Testing Strategy

### Frontend Testing
- **Unit Tests**: Jest and React Testing Library for component testing
- **Integration Tests**: Testing user workflows and API integration
- **E2E Tests**: Cypress for critical user journeys
- **Accessibility Tests**: Automated accessibility testing with axe-core

### Backend Testing
- **Unit Tests**: Jest for service and utility function testing
- **Integration Tests**: Supertest for API endpoint testing
- **Database Tests**: MongoDB Memory Server for isolated database testing
- **AI Integration Tests**: Mock AI service responses for consistent testing

### Test Coverage Goals
- Minimum 80% code coverage for critical business logic
- 100% coverage for authentication and security-related functions
- Integration tests for all API endpoints
- E2E tests for complete user workflows

## Security Considerations

### Data Protection
- **File Security**: Secure upload validation and virus scanning
- **Data Encryption**: Encrypt sensitive patient data at rest
- **Access Control**: JWT-based authentication with role-based permissions
- **HIPAA Compliance**: Implement necessary safeguards for health data

### API Security
- **Rate Limiting**: Prevent abuse with request rate limiting
- **Input Sanitization**: Validate and sanitize all user inputs
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Security Headers**: Implement security headers (helmet.js)

## Performance Optimization

### Frontend Performance
- **Code Splitting**: Lazy loading for route-based components
- **Image Optimization**: Optimized images and lazy loading
- **Caching**: Browser caching for static assets
- **Bundle Optimization**: Webpack optimization for smaller bundles

### Backend Performance
- **Database Indexing**: Proper indexing for query optimization
- **Caching**: Redis caching for frequently accessed data
- **File Processing**: Asynchronous file processing with queues
- **API Response Optimization**: Pagination and field selection

#### 11. Complete System Integration Flow

```mermaid
graph TB
    subgraph "User Interface Layer"
        WebApp[Web Application]
        MobileApp[Mobile Interface]
        ProgressUI[Progress Indicators]
        ErrorUI[Error Handling UI]
    end
    
    subgraph "API Layer"
        Gateway[API Gateway]
        AuthAPI[Authentication API]
        ReportAPI[Report Management API]
        FileAPI[File Management API]
        AnalysisAPI[Analysis API]
    end
    
    subgraph "Business Logic Layer"
        AuthService[Authentication Service]
        ReportService[Report Management Service]
        FileService[File Processing Service]
        AIService[AI Analysis Service]
        NotificationService[Notification Service]
    end
    
    subgraph "Integration Layer"
        PDFProcessor[PDF Processing Engine]
        AIConnector[AI Service Connector]
        CloudConnector[Cloud Storage Connector]
        DatabaseConnector[Database Connector]
    end
    
    subgraph "External Services"
        GeminiAI[Google Gemini AI]
        Cloudinary[Cloudinary Storage]
        MongoDB[MongoDB Atlas]
        EmailService[Email Notifications]
    end
    
    subgraph "Data Processing Pipeline"
        Queue[Processing Queue]
        Worker[Background Workers]
        Cache[Redis Cache]
        Logger[Logging System]
    end
    
    WebApp --> Gateway
    MobileApp --> Gateway
    
    Gateway --> AuthAPI
    Gateway --> ReportAPI
    Gateway --> FileAPI
    Gateway --> AnalysisAPI
    
    AuthAPI --> AuthService
    ReportAPI --> ReportService
    FileAPI --> FileService
    AnalysisAPI --> AIService
    
    AuthService --> DatabaseConnector
    ReportService --> DatabaseConnector
    FileService --> CloudConnector
    AIService --> AIConnector
    AIService --> PDFProcessor
    
    AIConnector --> GeminiAI
    CloudConnector --> Cloudinary
    DatabaseConnector --> MongoDB
    NotificationService --> EmailService
    
    AIService --> Queue
    Queue --> Worker
    Worker --> Cache
    Worker --> Logger
    
    ProgressUI -.-> NotificationService
    ErrorUI -.-> Logger
```

#### 12. Data Transformation and Processing Pipeline

```mermaid
flowchart LR
    subgraph "Input Stage"
        PDFFile[PDF Health Report]
        PatientData[Patient Information]
        UserAuth[User Authentication]
    end
    
    subgraph "Validation Stage"
        FileValidation[File Format Validation]
        DataValidation[Data Schema Validation]
        AuthValidation[Authentication Validation]
    end
    
    subgraph "Processing Stage"
        TextExtraction[PDF Text Extraction]
        DataCleaning[Text Cleaning & Preprocessing]
        AIAnalysis[AI Medical Analysis]
        ResultParsing[Response Parsing & Validation]
    end
    
    subgraph "Storage Stage"
        FileStorage[Cloud File Storage]
        MetadataStorage[Database Metadata Storage]
        AnalysisStorage[Analysis Results Storage]
        IndexingStorage[Search Index Storage]
    end
    
    subgraph "Output Stage"
        StructuredReport[Structured Medical Report]
        DownloadableFiles[PDF/Word Downloads]
        ShareableLinks[Shareable Report Links]
        HistoryRecords[User History Records]
    end
    
    PDFFile --> FileValidation
    PatientData --> DataValidation
    UserAuth --> AuthValidation
    
    FileValidation --> TextExtraction
    DataValidation --> DataCleaning
    AuthValidation --> AIAnalysis
    
    TextExtraction --> DataCleaning
    DataCleaning --> AIAnalysis
    AIAnalysis --> ResultParsing
    
    ResultParsing --> FileStorage
    ResultParsing --> MetadataStorage
    ResultParsing --> AnalysisStorage
    ResultParsing --> IndexingStorage
    
    FileStorage --> DownloadableFiles
    MetadataStorage --> HistoryRecords
    AnalysisStorage --> StructuredReport
    IndexingStorage --> ShareableLinks
```

#### 13. Monitoring and Analytics Flow

```mermaid
flowchart TD
    UserActions[User Actions] --> EventTracking[Event Tracking]
    APIRequests[API Requests] --> RequestLogging[Request Logging]
    SystemErrors[System Errors] --> ErrorLogging[Error Logging]
    
    EventTracking --> Analytics[Analytics Dashboard]
    RequestLogging --> Performance[Performance Monitoring]
    ErrorLogging --> AlertSystem[Alert System]
    
    Analytics --> UserMetrics[User Engagement Metrics]
    Performance --> ResponseTime[Response Time Analysis]
    AlertSystem --> NotificationSystem[Admin Notifications]
    
    UserMetrics --> BusinessIntelligence[Business Intelligence]
    ResponseTime --> SystemOptimization[System Optimization]
    NotificationSystem --> IncidentResponse[Incident Response]
    
    BusinessIntelligence --> ProductDecisions[Product Decisions]
    SystemOptimization --> PerformanceImprovements[Performance Improvements]
    IncidentResponse --> SystemReliability[System Reliability]
```

## Deployment Architecture

### Production Environment
- **Frontend**: Deployed on Vercel or Netlify with CDN
- **Backend**: Deployed on Railway, Render, or AWS EC2
- **Database**: MongoDB Atlas for managed database service
- **File Storage**: Cloudinary for reliable file storage and CDN
- **Monitoring**: Application monitoring with logging and error tracking