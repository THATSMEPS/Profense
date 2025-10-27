# Profense - AI-Powered Educational Platform

> An intelligent, adaptive learning platform that combines cutting-edge AI technology with comprehensive educational tools to deliver personalized learning experiences.

## 📖 About Profense

Profense is a full-stack educational platform designed to revolutionize online learning through artificial intelligence. Built with modern web technologies, it provides real-time AI tutoring, dynamic course generation, adaptive quizzes, and comprehensive progress tracking. The platform leverages Google's Gemini 2.5 Flash AI model integrated with the Model Context Protocol (MCP) to deliver contextually aware, educationally focused responses.

### 🎯 Core Philosophy

- **AI-First Learning**: Every interaction is powered by advanced AI that adapts to student understanding
- **Context-Aware Tutoring**: The system maintains conversation history and learning context across sessions
- **Safe & Educational**: Built-in content moderation ensures all interactions remain educationally relevant
- **Progressive Difficulty**: Adaptive difficulty system that adjusts based on student performance
- **Comprehensive Tracking**: Detailed analytics and progress monitoring for continuous improvement

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (local instance or cloud connection)
- **Google Gemini API Key** (required for AI features)
- **npm** or **yarn** package manager

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
   ```env
   VITE_API_BASE_URL=http://localhost:3001/api
   VITE_WS_URL=http://localhost:3001
   ```

   **Backend (.env):** Update these values
   ```env
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

---

## 🏗️ Technology Stack

### Frontend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **React 18** | UI Framework | Latest |
| **TypeScript** | Type Safety | 5.5.3 |
| **Vite** | Build Tool & Dev Server | 5.4.2 |
| **Tailwind CSS** | Styling Framework | 3.4.1 |
| **Framer Motion** | Animations & Transitions | 12.23.12 |
| **React Router** | Client-side Routing | 7.8.2 |
| **Socket.IO Client** | Real-time Communication | 4.8.1 |
| **React Markdown** | Markdown Rendering | 10.1.0 |
| **Lucide React** | Icon Library | 0.344.0 |

### Backend Technologies

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime Environment | 18+ |
| **Express.js** | Web Framework | 4.18.2 |
| **TypeScript** | Type Safety | Latest |
| **MongoDB** | Database | Latest |
| **Mongoose** | ODM | 8.0.3 |
| **Socket.IO** | WebSocket Server | 4.7.4 |
| **Google Gemini AI** | AI Model | 2.5 Flash |
| **FastMCP** | Model Context Protocol | 3.19.0 |
| **JWT** | Authentication | 9.0.2 |
| **bcryptjs** | Password Hashing | 2.4.3 |
| **Winston** | Logging | 3.11.0 |
| **Helmet** | Security Headers | 7.1.0 |
| **Joi** | Validation | 17.11.0 |
| **Zod** | Schema Validation | 3.25.76 |

---

## 🎓 Features Implemented

### ✅ 1. AI-Powered Chat Interface
- **Real-time Conversations**: WebSocket-based instant messaging with AI tutor
- **Context Management**: MCP server maintains conversation history and generates summaries
- **Adaptive Teaching Modes**:
  - **Normal Mode**: Standard explanations
  - **Socratic Mode**: Question-based learning
  - **Simplified Mode**: Easy-to-understand explanations
  - **Detailed Mode**: Comprehensive deep dives
- **Markdown Support**: Rich text responses with code highlighting
- **Typing Animation**: Natural conversation flow with animated responses
- **Chat History Sidebar**: Access previous conversations and context

### ✅ 2. Dynamic Course Generation
- **AI-Generated Course Outlines**: Complete course structures created from simple prompts
- **Hierarchical Topics**: Organized modules with subtopics and learning objectives
- **Difficulty Levels**: Easy, Medium, Hard content adaptation
- **Course Library**: Browse and select from generated courses
- **Progress Tracking**: Monitor completion status across all courses

### ✅ 3. Intelligent Quiz System
- **AI-Generated Quizzes**: Context-aware quiz creation from chat conversations
- **Multiple Question Types**:
  - Multiple Choice (with 4 options)
  - Numerical (with acceptable ranges)
  - Text-based (with keyword matching)
- **Flexible Difficulty**: Easy, Medium, Hard quiz generation
- **MCP-Based Evaluation**: AI evaluates answers with detailed explanations
- **Quiz History**: Complete history of all attempts with statistics
- **Detailed Results View**: Question-by-question breakdown with:
  - Correct/incorrect indicators
  - Your answer vs. correct answer
  - AI-generated explanations
  - Points earned per question
- **Performance Analytics**:
  - Total quizzes taken
  - Average score tracking
  - Subjects covered
  - Pass/fail rates
  - Best score per quiz
  - Attempt tracking

### ✅ 4. Content Moderation & Safety
- **Educational Focus Enforcement**: Ensures conversations stay on-topic
- **Subject Whitelisting**: Only allows educational subjects
- **Basic Moderation**: Filters inappropriate content
- **MCP Content Validation**: AI-powered relevance checking
- **Moderation Alerts**: Visual warnings for off-topic queries

### ✅ 5. User Authentication & Authorization
- **JWT-Based Authentication**: Secure token-based auth
- **Refresh Token Support**: Long-lived sessions with automatic refresh
- **Password Security**: bcrypt hashing with salt rounds
- **Protected Routes**: Middleware-based authorization
- **User Profiles**: Customizable user information

### ✅ 6. Progress Tracking & Analytics
- **Learning Streaks**: Daily engagement tracking
- **Achievement System**: Gamification elements
- **Course Progress**: Module and topic completion tracking
- **Quiz Performance**: Detailed analytics on quiz attempts
- **Time Tracking**: Monitor time spent on questions and courses

### ✅ 7. Real-time Features
- **WebSocket Communication**: Socket.IO for instant updates
- **Live AI Responses**: Real-time streaming of AI messages
- **Connection Status**: Online/offline indicators
- **Session Management**: Persistent sessions across page reloads

### ✅ 8. Model Context Protocol (MCP) Integration
- **MCP Server**: FastMCP server with custom tools
- **Chat Context Management**: Maintains conversation history with automatic summarization
- **Content Moderation Tool**: Validates educational relevance
- **Quiz Evaluation Tool**: AI-powered answer assessment
- **Context-Aware Responses**: Uses chat history for better answers

---

## 📁 Project Structure

```
Profense/
├── src/                          # Frontend React application
│   ├── components/              # React components
│   │   ├── auth/               # Authentication (Login/Signup)
│   │   ├── chat/               # Chat interface, history, typing animations
│   │   ├── courses/            # Course library and selection
│   │   ├── dashboard/          # Main dashboard with stats
│   │   ├── landing/            # Landing page
│   │   ├── layout/             # Header and layout components
│   │   ├── profile/            # User profile management
│   │   ├── quiz/               # Quiz interface, history, results, analytics
│   │   └── ui/                 # Reusable UI components (Button, Card, etc.)
│   ├── context/                # React Context API
│   │   └── AppContext.tsx      # Global app state management
│   ├── data/                   # Mock data for development
│   ├── services/               # API service layers
│   │   ├── api.ts              # HTTP client wrapper
│   │   ├── authService.ts      # Authentication API calls
│   │   ├── chatService.ts      # Chat API calls
│   │   ├── courseService.ts    # Course API calls
│   │   ├── enhancedChatService.ts  # Enhanced chat with moderation
│   │   ├── quizService.ts      # Quiz API calls
│   │   ├── userService.ts      # User profile API calls
│   │   └── webSocketService.ts # Socket.IO client
│   ├── types/                  # TypeScript type definitions
│   └── App.tsx                 # Main application component
│
├── backend/                     # Backend Node.js application
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   ├── mcp/                # Model Context Protocol
│   │   │   ├── client.ts       # MCP client for AI integration
│   │   │   └── server.ts       # MCP server with tools
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.ts         # JWT authentication middleware
│   │   │   └── errorHandler.ts # Global error handling
│   │   ├── models/             # Mongoose models
│   │   │   ├── ChatSession.ts  # Chat history model
│   │   │   ├── Course.ts       # Course structure model
│   │   │   ├── Quiz.ts         # Quiz and attempts model
│   │   │   └── User.ts         # User model
│   │   ├── routes/             # Express routes
│   │   │   ├── ai.routes.ts    # AI/chat endpoints
│   │   │   ├── analytics.routes.ts  # Analytics endpoints
│   │   │   ├── auth.routes.ts  # Authentication endpoints
│   │   │   ├── chat.routes.ts  # Chat management endpoints
│   │   │   ├── course.routes.ts # Course CRUD endpoints
│   │   │   ├── quiz.routes.ts  # Quiz generation and submission
│   │   │   └── user.routes.ts  # User profile endpoints
│   │   ├── services/           # Business logic services
│   │   │   ├── ai.service.ts   # Core AI service (Gemini)
│   │   │   ├── enhanced-ai.service.ts  # AI with moderation
│   │   │   └── index.ts        # Service exports
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   │   ├── logger.ts       # Winston logging
│   │   │   └── seedData.ts     # Database seeding
│   │   └── index.ts            # Application entry point
│   ├── logs/                   # Application logs
│   ├── package.json            # Backend dependencies
│   └── tsconfig.json           # TypeScript configuration
│
├── docs/                        # Documentation files
│   ├── QUIZ_SYSTEM_COMPLETE.md          # Quiz system implementation
│   ├── QUIZ_GENERATION_FIX.md           # Quiz generation fixes
│   ├── QUIZ_HISTORY_RESULTS_FIX.md      # Quiz history implementation
│   ├── TIME_FEATURE_REMOVED.md          # Timer removal documentation
│   └── typescript-fixes.md              # TypeScript fixes applied
│
├── package.json                # Frontend dependencies
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

---

## 🔧 Available Scripts

### Root Level Scripts
```bash
npm run start        # Start both frontend and backend concurrently
npm run dev          # Start frontend development server only
npm run dev:backend  # Start backend development server only
npm run dev:full     # Start both with colored output (concurrently)
npm run build        # Build frontend for production
npm run build:backend # Build backend for production
npm run build:full   # Build both frontend and backend
npm run lint         # Run ESLint on frontend code
npm run preview      # Preview production build
```

### Backend-Specific Scripts
```bash
cd backend
npm run dev          # Start development server with nodemon
npm run build        # Compile TypeScript to JavaScript
npm run start        # Start production server
npm run lint         # Run ESLint on backend code
npm run format       # Format code with Prettier
```

---

## 🎯 Key Implementation Details

### Quiz System Evolution

The quiz system has undergone several major improvements:

#### **1. Quiz Generation Fix**
- **Problem**: AI responses were being blocked or truncated
- **Solution**: Increased `maxOutputTokens` from 2048 to 8192
- **Safety Settings**: Disabled overly restrictive content filters for educational content
- **Improved Prompts**: Added clear examples for all question types
- **Better Error Logging**: Enhanced debugging capabilities

#### **2. Quiz Submission & Evaluation**
- **Frontend**: `App.tsx` now properly submits answers to backend
- **Backend**: MCP client evaluates each answer with AI
- **Scoring**: Points calculated based on question difficulty
- **Grading**: Automatic grade assignment (A-F) based on percentage

#### **3. Quiz History & Results**
- **Aggregated Data**: Shows best score and total attempts per quiz
- **Statistics Dashboard**: Total quizzes, average score, subjects covered, pass rate
- **Detailed Results Modal**: Question-by-question breakdown with:
  - Correct/incorrect visual indicators (green checkmark/red X)
  - Your answer vs. correct answer comparison
  - AI-generated explanations for each question
  - Points earned per question
  - Time spent per question

#### **4. Timer Feature Removal**
- **Removed**: Countdown timer that auto-submitted quizzes
- **Reason**: Allow students to learn at their own pace
- **Result**: Unlimited time to complete quizzes, submit manually

### MCP (Model Context Protocol) Implementation

The platform uses a custom MCP server with three main tools:

#### **Tool 1: Chat Context Management**
```typescript
manage_chat_context(sessionId, newMessage, userId)
```
- Maintains conversation history
- Auto-summarizes when >20 messages
- Keeps last 10 messages + summary for efficiency

#### **Tool 2: Content Moderation**
```typescript
moderate_content(userInput, courseId)
```
- Validates queries against course topics
- Prevents off-topic conversations
- Suggests relevant topics when user goes off-track

#### **Tool 3: Quiz Evaluation**
```typescript
evaluate_quiz(quizId, userId, answers)
```
- AI evaluates each answer
- Provides explanations and feedback
- Calculates scores and generates grades

### AI Service Architecture

The platform uses a layered AI architecture:

1. **Core AI Service** (`ai.service.ts`)
   - Direct integration with Google Gemini 2.5 Flash
   - Handles course generation, quiz creation, teaching responses
   - Configurable safety settings and token limits

2. **Enhanced AI Service** (`enhanced-ai.service.ts`)
   - Wraps core AI service with moderation layer
   - Validates educational relevance
   - Enforces subject whitelisting
   - Falls back to basic AI if MCP fails

3. **MCP Client** (`mcp/client.ts`)
   - Connects to MCP server for advanced capabilities
   - Manages tool invocations
   - Handles context and state management

---

## 🐛 Bug Fixes & Improvements

### TypeScript Compilation Fixes
- Fixed route handler type signatures across all backend routes
- Corrected `AuthRequest` vs `Request` usage
- Added proper type annotations for callbacks and arrow functions
- Resolved Mongoose model type issues

### API Improvements
- Implemented proper error handling and logging
- Added request validation with Joi schemas
- Structured error responses with consistent format
- Rate limiting on sensitive endpoints

### Frontend Enhancements
- Loading states for all async operations
- Error boundaries for graceful failure handling
- Optimistic UI updates for better UX
- Responsive design for mobile compatibility

---

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication with refresh tokens
- **Password Hashing**: bcrypt with configurable salt rounds
- **CORS Configuration**: Controlled cross-origin resource sharing
- **Helmet.js**: Security headers (CSP, XSS protection, etc.)
- **Rate Limiting**: Prevents brute force and DDoS attacks
- **Input Validation**: Joi schemas validate all user inputs
- **MongoDB Injection Protection**: Mongoose sanitization
- **Environment Variables**: Sensitive data kept in .env files

---

## � Data Models

### User Model
```typescript
{
  name: string
  email: string (unique, indexed)
  password: string (hashed)
  role: 'student' | 'teacher' | 'admin'
  courses: Course[]
  progress: { courseId, completion, streak }
  achievements: Achievement[]
  preferences: { theme, notifications, language }
}
```

### Course Model
```typescript
{
  title: string
  description: string
  subject: string
  difficulty: 'easy' | 'medium' | 'hard'
  topics: [{
    title: string
    content: string
    subtopics: string[]
    completed: boolean
  }]
  createdBy: User
  aiGenerated: boolean
}
```

### Quiz Model
```typescript
{
  title: string
  subject: string
  topic: string
  difficulty: 'easy' | 'medium' | 'hard'
  questions: [{
    question: string
    type: 'multiple-choice' | 'numerical' | 'text'
    options?: string[]           // for multiple-choice
    correctAnswer: string
    acceptableRange?: number     // for numerical
    keywords?: string[]          // for text
    explanation: string
    points: number
  }]
  attempts: [{
    userId: User
    answers: any[]
    score: number
    grade: string
    feedback: string
    completedAt: Date
  }]
}
```

### Chat Session Model
```typescript
{
  userId: User
  messages: [{
    content: string
    isUser: boolean
    timestamp: Date
  }]
  summary: string
  context: any
  createdAt: Date
  updatedAt: Date
}
```

---

## 🚦 API Endpoints

### Authentication
```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
POST   /api/auth/refresh        - Refresh access token
POST   /api/auth/logout         - Logout user
```

### AI & Chat
```
POST   /api/ai/chat             - Send message to AI tutor
POST   /api/ai/generate-course  - Generate course outline
POST   /api/ai/generate-quiz    - Generate quiz from context
GET    /api/chat/history        - Get chat history
DELETE /api/chat/:sessionId     - Delete chat session
```

### Courses
```
GET    /api/courses             - Get all courses
GET    /api/courses/:id         - Get course by ID
POST   /api/courses             - Create new course
PUT    /api/courses/:id         - Update course
DELETE /api/courses/:id         - Delete course
PATCH  /api/courses/:id/progress - Update course progress
```

### Quizzes
```
POST   /api/quiz/generate       - Generate quiz from chat context
POST   /api/quiz/:id/submit     - Submit quiz answers
GET    /api/quiz/history        - Get quiz attempt history
GET    /api/quiz/:quizId/attempt/:attemptId - Get detailed results
POST   /api/quiz/:id/retake     - Retake a quiz
```

### User & Analytics
```
GET    /api/user/profile        - Get user profile
PUT    /api/user/profile        - Update user profile
GET    /api/analytics/overview  - Get learning analytics
GET    /api/analytics/progress  - Get progress metrics
```

---

## 🎨 UI/UX Features

- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Smooth Animations**: Framer Motion for delightful interactions
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Dark Mode Ready**: Theme system prepared for dark mode
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: User-friendly error messages
- **Toast Notifications**: Non-intrusive feedback
- **Progress Indicators**: Visual progress bars and rings
- **Icon System**: Lucide icons for consistent design

---

## 📚 Documentation

Additional documentation files in the repository:

- **QUIZ_SYSTEM_COMPLETE.md**: Complete guide to quiz system features
- **QUIZ_GENERATION_FIX.md**: Details on quiz generation improvements
- **QUIZ_HISTORY_RESULTS_FIX.md**: Implementation of quiz history and results
- **TIME_FEATURE_REMOVED.md**: Explanation of timer removal
- **typescript-fixes.md**: TypeScript compilation fixes applied

---

## 🤝 Contributing

This is a personal educational project. However, suggestions and feedback are welcome!

---

## 📄 License

This project is for educational purposes.

---

## 🙏 Acknowledgments

- **Google Gemini AI**: Powering the intelligent tutoring system
- **Model Context Protocol**: Enabling advanced AI context management
- **React & TypeScript Communities**: Excellent documentation and support
- **Tailwind CSS**: Making styling effortless
- **MongoDB & Mongoose**: Flexible database solution

---

## 📞 Support

For issues, questions, or suggestions, please open an issue in the repository.

---

**Built with ❤️ using React, TypeScript, Node.js, and Google Gemini AI**
