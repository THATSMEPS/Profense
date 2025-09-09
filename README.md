# Profense - AI-Powered Educational Platform

A full-stack educational platform with real-time AI tutoring, course management, and interactive quizzes.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation & Setup

1. **Clone and install dependencies:**
   ```bash
   cd Profense
   npm install
   cd backend && npm install
   cd ..
   ```

2. **Environment Configuration:**
   
   **Frontend (.env):** Already configured
   ```
   VITE_API_BASE_URL=http://localhost:3001/api
   VITE_WS_URL=http://localhost:3001
   ```

   **Backend (.env):** Update these values
   ```
   # Database - Update with your MongoDB connection
   MONGODB_URI=mongodb://localhost:27017/profense
   # or use the existing cloud connection
   
   # JWT Secret - Change in production
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   
   # AI Services - Add your API keys
   GEMINI_API_KEY=your-gemini-api-key
   OPENAI_API_KEY=your-openai-api-key (optional)
   ```

3. **Start the application:**
   ```bash
   # Option 1: Run both frontend and backend together (recommended)
   npm run start
   
   # Option 2: Run separately
   # Terminal 1 - Backend
   npm run dev:backend
   
   # Terminal 2 - Frontend  
   npm run dev
   ```

4. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - API Health Check: http://localhost:3001/health

## 🏗️ Architecture

### Frontend (React + TypeScript + Vite)
- **Framework:** React 18 with TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **State Management:** React Context
- **Real-time:** Socket.IO Client
- **HTTP Client:** Fetch API with custom wrapper

### Backend (Node.js + TypeScript + Express)
- **Framework:** Express.js with TypeScript
- **Database:** MongoDB with Mongoose
- **Authentication:** JWT tokens
- **Real-time:** Socket.IO
- **AI Services:** Google Gemini AI
- **Security:** Helmet, CORS, Rate limiting
- **Logging:** Winston

## 📁 Project Structure

```
Profense/
├── src/                          # Frontend React app
│   ├── components/              # React components
│   │   ├── auth/               # Authentication components
│   │   ├── chat/               # Chat interface
│   │   ├── courses/            # Course management
│   │   ├── dashboard/          # Main dashboard
│   │   ├── layout/             # Layout components
│   │   ├── profile/            # User profile
│   │   ├── quiz/               # Quiz interface
│   │   └── ui/                 # Reusable UI components
│   ├── context/                # React context providers
│   ├── services/               # API and service layers
│   │   ├── api.ts              # HTTP client
│   │   ├── authService.ts      # Authentication
│   │   ├── chatService.ts      # Chat functionality
│   │   ├── courseService.ts    # Course management
│   │   ├── quizService.ts      # Quiz functionality
│   │   ├── userService.ts      # User management
│   │   └── webSocketService.ts # Real-time communication
│   └── types/                  # TypeScript type definitions
│
├── backend/                     # Backend Node.js app
│   ├── src/
│   │   ├── middleware/         # Express middleware
│   │   ├── models/             # MongoDB models
│   │   ├── routes/             # API route handlers
│   │   ├── services/           # Business logic services
│   │   ├── types/              # TypeScript types
│   │   └── utils/              # Utility functions
│   └── logs/                   # Application logs
│
├── .env                        # Frontend environment
├── backend/.env               # Backend environment
└── package.json              # Root package.json with scripts
```

## 🔧 Available Scripts

### Root Level Scripts
- `npm run start` - Start both frontend and backend concurrently
- `npm run dev` - Start frontend development server
- `npm run dev:backend` - Start backend development server
- `npm run dev:full` - Start both with colored output
- `npm run build` - Build frontend for production
- `npm run build:backend` - Build backend for production
- `npm run build:full` - Build both frontend and backend

### Backend Scripts
- `npm run dev` - Start development server with nodemon
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🌟 Features

### ✅ Implemented & Integrated
- **User Authentication** - Registration, login, logout with JWT
- **Real-time Chat** - AI-powered tutoring with WebSocket support
- **Course Management** - Browse, enroll, track progress
- **Interactive Quizzes** - AI-generated quizzes with real-time feedback
- **User Dashboard** - Progress tracking, statistics, recommendations
- **Profile Management** - User settings and preferences
- **Responsive Design** - Mobile-first approach
- **Error Handling** - Comprehensive error management
- **Loading States** - User-friendly loading indicators
- **Offline Detection** - Network status awareness

### 🔌 API Integration
- All frontend services connected to backend APIs
- WebSocket integration for real-time features
- Automatic token management and refresh
- Error handling and retry mechanisms
- Loading states and user feedback

### 🎯 Real-time Features
- Live chat with AI tutor
- Real-time quiz updates
- Instant notifications
- Course progress synchronization

## 🔒 Security Features

- JWT authentication with secure token storage
- CORS protection
- Rate limiting
- Input validation and sanitization
- Helmet.js for security headers
- Environment variable protection

## 📊 Monitoring & Logging

- Winston logging with file rotation
- Error tracking and debugging
- Performance monitoring
- Health check endpoints

## 🚀 Production Deployment

### Environment Variables for Production
```bash
# Backend
NODE_ENV=production
PORT=3001
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
CORS_ORIGIN=your-production-frontend-url

# Frontend
VITE_API_BASE_URL=your-production-api-url
```

### Build Commands
```bash
# Build both frontend and backend
npm run build:full

# Start production server
cd backend && npm start
```

## 🧪 Testing the Integration

1. **Start the application** using `npm run start`
2. **Open browser** to http://localhost:5173
3. **Create account** or sign in
4. **Test features:**
   - Browse courses and enroll
   - Start a chat session with AI tutor
   - Take interactive quizzes
   - Check dashboard for progress
   - Update profile settings

## 🛠️ Development Workflow

1. **Backend Development:** Make changes in `backend/src/`
2. **Frontend Development:** Make changes in `src/`
3. **Live Reload:** Both servers support hot reload
4. **API Testing:** Use the health endpoint or browser network tab
5. **WebSocket Testing:** Check browser console for connection logs

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Course Endpoints
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses/:id/enroll` - Enroll in course
- `GET /api/courses/enrolled` - Get user's enrolled courses

### Chat Endpoints
- `POST /api/chat/message` - Send chat message
- `POST /api/chat/session` - Create chat session
- `GET /api/chat/sessions` - Get user's chat sessions

### Quiz Endpoints
- `GET /api/quiz` - Get available quizzes
- `POST /api/quiz/generate` - Generate AI quiz
- `POST /api/quiz/:id/start` - Start quiz attempt
- `POST /api/quiz/attempt/:id/submit` - Submit quiz

## 🔄 Real-time Events (WebSocket)

### Client Events
- `join-session` - Join chat session
- `chat-message` - Send chat message
- `typing` - Indicate typing status

### Server Events
- `chat-message` - Receive chat message
- `typing` - User typing indicator
- `notification` - System notifications

## 🐛 Troubleshooting

### Common Issues

1. **Backend not starting:**
   - Check MongoDB connection
   - Verify environment variables
   - Check port 3001 availability

2. **Frontend API errors:**
   - Ensure backend is running on port 3001
   - Check CORS configuration
   - Verify API base URL

3. **WebSocket connection issues:**
   - Check browser console for errors
   - Verify Socket.IO configuration
   - Ensure both servers are running

4. **Authentication problems:**
   - Clear browser localStorage
   - Check JWT token validity
   - Verify API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

This project is licensed under the MIT License.

## 🎉 Success!

Your Profense application is now fully integrated with:
- ✅ Real backend API integration
- ✅ WebSocket real-time features  
- ✅ User authentication system
- ✅ Course and quiz management
- ✅ Professional error handling
- ✅ Production-ready architecture

Start developing and testing your educational platform! 🚀
