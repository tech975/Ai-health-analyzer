# AI Health Analyzer

A full-stack web application that provides AI-powered analysis of patient health reports using the MERN stack.

## Features

- 🤖 AI-powered health report analysis using Google Gemini
- 📄 PDF health report upload and processing
- 📊 Intelligent interpretation of medical data
- 📱 Responsive design for all devices
- 🔍 Search and filter report history
- 📥 Download reports in PDF/Word formats
- 🔗 Share reports with secure links

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- React Hook Form for form handling
- Axios for API calls

### Backend
- Node.js with Express.js
- TypeScript
- MongoDB with Mongoose
- JWT authentication
- Cloudinary for file storage
- Google Gemini AI integration

## Project Structure

```
ai-health-analyzer/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Utility functions
│   └── package.json
├── server/                 # Express backend
│   ├── src/
│   │   ├── controllers/    # Route controllers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   ├── config/         # Configuration files
│   │   └── utils/          # Utility functions
│   └── package.json
└── package.json           # Root package.json
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or Atlas)
- Cloudinary account
- Google Gemini API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-health-analyzer
```

2. Install dependencies for all packages:
```bash
npm run install:all
```

3. Set up environment variables:

Copy `server/.env.example` to `server/.env` and fill in your values:
```bash
cp server/.env.example server/.env
```

Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `GEMINI_API_KEY`: Google Gemini API key

### Development

Start both frontend and backend in development mode:
```bash
npm run dev
```

Or start them separately:
```bash
# Backend (runs on port 5000)
npm run server:dev

# Frontend (runs on port 3000)
npm run client:dev
```

### Building for Production

Build both frontend and backend:
```bash
npm run build
```

Start production server:
```bash
npm start
```

### Testing

Run tests for both frontend and backend:
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health check

### Authentication (Coming Soon)
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Reports (Coming Soon)
- `POST /api/reports/upload` - Upload health report
- `POST /api/reports/analyze` - Generate AI analysis
- `GET /api/reports/:id` - Get specific report
- `GET /api/reports/user/:userId` - Get user's reports
- `DELETE /api/reports/:id` - Delete report

### Files (Coming Soon)
- `POST /api/files/upload` - Upload file to Cloudinary
- `GET /api/files/:id` - Get file metadata
- `DELETE /api/files/:id` - Delete file

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.