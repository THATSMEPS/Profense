# Profense - AI-Powered Educational Platform 🎓

> Transform your learning experience with intelligent, context-aware AI tutoring that adapts to your unique needs.

## 🌟 What is Profense?

**Profense** is a cutting-edge, full-stack educational platform that revolutionizes online learning through artificial intelligence. Whether you're a student looking to master new concepts, an educator seeking innovative teaching tools, or a developer interested in AI-powered education technology, Profense delivers a comprehensive, intelligent learning ecosystem.

### 🎯 Core Philosophy

- **🤖 AI-First Learning**: Every interaction powered by Google's Gemini 2.5 Flash AI model
- **🧠 Context-Aware Tutoring**: Maintains full conversation history and adapts to your learning style
- **🛡️ Safe & Focused**: Advanced content moderation keeps learning on-topic and appropriate
- **📈 Adaptive Difficulty**: Dynamically adjusts to your skill level and progress
- **📊 Comprehensive Tracking**: Real-time analytics, progress monitoring, and performance insights
- **🎨 Beautiful UI**: Modern, responsive design built with React, TypeScript, and Tailwind CSS

---

## ✨ Key Features

### 1️⃣ Intelligent AI Tutoring
- **Real-time Teaching**: Conversational AI that explains concepts like a human tutor
- **Context Memory**: Remembers previous conversations and builds on them
- **Adaptive Responses**: Adjusts explanations based on your understanding level
- **Multi-Subject Support**: Math, Science, Programming, Languages, and more

### 2️⃣ Smart Topic Moderation System
- **Discovery Phase**: First 3 messages allow free exploration to establish your learning topic
- **Focus Enforcement**: Keeps you on-topic after initial discovery (60%+ relevance threshold)
- **Contextual Understanding**: Recognizes follow-up questions using pronouns ("it", "this", "that")
- **Gentle Redirects**: Offers helpful suggestions when you drift off-topic

### 3️⃣ Dynamic Quiz Generation
- **AI-Generated Questions**: Creates custom quizzes based on your conversation topics
- **Multiple Question Types**: Multiple-choice, numerical, and text-based answers
- **Adaptive Difficulty**: Choose from easy, medium, or hard difficulty levels
- **Detailed Feedback**: Get explanations for every question, right or wrong
- **Unlimited Time**: No pressure - take as long as you need

### 4️⃣ Comprehensive Progress Tracking
- **Real Dashboard Stats**: View actual learning time, quiz scores, and course completion
- **Quiz History**: Review all past quizzes with detailed question-by-question breakdowns
- **Course Progress**: Track topic completion percentage and time spent per course
- **Learning Streaks**: Monitor consecutive learning days and earn achievements
- **Performance Analytics**: Subject breakdown, weekly progress charts, and improvement trends

### 5️⃣ Course Library & Management
- **Curated Courses**: Access expertly designed courses across multiple subjects
- **Smart Recommendations**: AI-powered course suggestions based on your preferences
- **Enrollment Tracking**: Automatically tracks which topics you've covered
- **Deduplication System**: Prevents duplicate courses and intelligently merges similar content
- **Progress Sync**: Your chat sessions automatically update course completion

### 6️⃣ Advanced Learning Hub
- **Learning Path Generator**: Get personalized roadmaps for mastering any subject
- **Concept Connections Explorer**: Visualize relationships between topics
- **Practice Problems**: Generate targeted exercises for weak areas
- **Study Resources**: Curated materials, videos, and articles for each topic

---

## 🏗️ Architecture & Technology

### **Tech Stack Overview**


### **Tech Stack Overview**

#### 🎨 Frontend
| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **React 18** | UI Framework | Modern, component-based architecture with hooks |
| **TypeScript** | Type Safety | Catches errors at compile time, improves code quality |
| **Vite** | Build Tool | Lightning-fast HMR and optimized production builds |
| **Tailwind CSS** | Styling | Utility-first CSS for rapid, consistent UI development |
| **Framer Motion** | Animations | Smooth, professional transitions and interactions |
| **React Router v7** | Navigation | Client-side routing with data loading |
| **Socket.IO Client** | Real-time Updates | WebSocket communication for live features |
| **React Markdown** | Content Rendering | Beautiful markdown display for AI responses |
| **Lucide React** | Icons | Modern, customizable icon library |

#### 🔧 Backend
| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **Node.js** | Runtime | JavaScript everywhere, massive ecosystem |
| **Express.js** | Web Framework | Fast, minimalist, battle-tested |
| **TypeScript** | Type Safety | Prevents runtime errors, better IDE support |
| **MongoDB** | Database | Flexible schema for evolving educational data |
| **Mongoose** | ODM | Elegant MongoDB object modeling |
| **Socket.IO** | WebSockets | Real-time bidirectional communication |
| **JWT** | Authentication | Secure, stateless user authentication |
| **bcryptjs** | Password Hashing | Industry-standard password security |
| **Winston** | Logging | Professional logging for debugging and monitoring |

#### 🤖 AI & Integration
| Technology | Purpose | Why We Use It |
|------------|---------|---------------|
| **Google Gemini 2.5 Flash** | AI Model | Fast, intelligent responses with multimodal support |
| **Model Context Protocol (MCP)** | Tool Integration | Structured AI tool calling and context management |
| **Custom Moderation** | Content Filtering | Fast, regex-based filtering (no API calls needed) |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18 or higher
- MongoDB (local or cloud)
- Google Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))
- npm or yarn package manager

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/THATSMEPS/Profense.git
cd Profense
```

#### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

#### 3. Environment Configuration

**Frontend `.env` (already configured)**
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

**Backend `.env` (⚠️ UPDATE THESE VALUES)**
```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/profense
# Or use MongoDB Atlas cloud connection

# JWT Secret (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AI API Keys
GEMINI_API_KEY=your-gemini-api-key-here
OPENAI_API_KEY=your-openai-key-optional

# Server Configuration
PORT=3001
NODE_ENV=development
```

#### 4. Start the Application

**Option 1: Run Everything (Recommended)**
```bash
npm run start
```

**Option 2: Run Separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

#### 5. Access the Platform
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

---

## 📚 How It Works - System Overview

### 🔄 The Learning Flow

```
┌─────────────────────────────────────────────────────────────┐
│  USER JOURNEY                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. SIGN UP / LOGIN                                         │
│     ↓                                                        │
│  2. BROWSE COURSE LIBRARY                                   │
│     ↓                                                        │
│  3. SELECT TOPIC OR START CHATTING                          │
│     ↓                                                        │
│  4. DISCOVERY PHASE (First 3 Messages)                      │
│     • Ask anything educational                              │
│     • System learns your topic                              │
│     • No restrictions yet                                   │
│     ↓                                                        │
│  5. FOCUS PHASE (Message 4+)                               │
│     • Topic established                                     │
│     • Moderation active                                     │
│     • Stay on-topic for effective learning                 │
│     ↓                                                        │
│  6. GENERATE QUIZ                                           │
│     • Based on conversation                                 │
│     • Custom difficulty                                     │
│     • Instant feedback                                      │
│     ↓                                                        │
│  7. TRACK PROGRESS                                          │
│     • View dashboard stats                                  │
│     • Review quiz history                                   │
│     • See course completion                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 🧠 AI Moderation System

#### Discovery Phase (Messages 1-3)
```javascript
User enters Learn section → No topic selected
Message 1: "What is quantum physics?"
  ✅ Allowed (Discovery phase)
  → System learns: topic = "quantum physics"
  
Message 2: "Tell me about wave functions"
  ✅ Allowed (Still in discovery)
  → Building context...
  
Message 3: "How does it relate to energy?"
  ✅ Allowed (Discovery complete)
  → Topic established!
```

#### Focus Phase (Message 4+)
```javascript
Message 4: "What is Schrödinger's equation?"
  → Topic check: quantum physics ✅ (85% relevance)
  ✅ Allowed - On topic
  
Message 5: "Tell me about biology"
  → Topic check: quantum physics ❌ (5% relevance)
  🚫 Blocked - Off topic
  → Redirect: "Let's stay focused on quantum physics!"
```

### 📊 Relevance Scoring Algorithm

```javascript
// Score calculation
relevanceScore = (topicMatch × 60%) + (subjectMatch × 30%) + (questionBoost × 10%)

// Example: "What is the derivative of x²?" while studying Calculus
topicKeywords = ['calculus', 'derivative', 'function', 'limit']
messageKeywords = ['what', 'derivative', 'squared']
intersection = ['derivative']

topicMatch = 1/5 = 0.20
subjectMatch = 2/6 = 0.33
questionBoost = 0.20 (has "what")

finalScore = (0.20 × 0.6) + (0.33 × 0.3) + 0.20 = 0.42 (42%)

// Result thresholds:
// ≥ 60%: ✅ Allow
// 30-60%: ⚠️ Allow with reminder
// < 30%: 🚫 Block and redirect
```

### 🎯 Quiz Generation Process

```
User clicks "Generate Quiz"
  ↓
Extract conversation topics
  ↓
Build prompt for Gemini AI:
  • Subject: Mathematics
  • Topic: Calculus
  • Difficulty: Hard
  • Question types: Mixed
  • Number of questions: 10
  ↓
Gemini generates JSON quiz:
  • Questions with options
  • Correct answers
  • Detailed explanations
  • Point values
  ↓
Quiz saved to database
  ↓
User takes quiz
  ↓
Answers evaluated by AI
  ↓
Results with feedback saved
  ↓
Display detailed performance breakdown
```

---

## 🎨 User Interface Preview

### Landing Page
- Modern hero section with CTA
- Feature highlights
- Testimonials (when available)
- Quick start guide

### Dashboard
- Real-time statistics cards
  - Courses Completed
  - Hours Learned
  - Quiz Score Average
  - Learning Streak
- Weekly progress chart
- Recent courses
- Subject breakdown

### Chat Interface
- Clean, distraction-free design
- Markdown-rendered AI responses
- Typing indicators
- Message history
- Course outline sidebar
- Quick actions (Generate Quiz, Switch Topic)

### Quiz Interface
- Progress bar
- Question counter
- Multiple question types support
- No time pressure (removed timer)
- Clear submit button

### Quiz History
- List of all past quizzes
- Statistics overview
- Grade badges (A, B, C, D, F)
- "View Details" for question breakdown
- Retake option

---

## 🔐 Security & Privacy

### Authentication
- JWT-based stateless authentication
- Bcrypt password hashing (10 rounds)
- HTTP-only cookies for token storage
- Password strength requirements

### Data Protection
- MongoDB user data encryption at rest
- Secure environment variables
- CORS protection
- Rate limiting on API endpoints

### Content Safety
- Dual-layer moderation (topic + content)
- Regex-based inappropriate content blocking
- Educational focus enforcement
- No sensitive data logging

---

## 📈 Performance Features

### Speed Optimizations
- **Frontend**:
  - Vite's lightning-fast HMR
  - Code splitting by route
  - Lazy loading for components
  - Optimized bundle size

- **Backend**:
  - Connection pooling for MongoDB
  - Response caching where appropriate
  - Efficient database queries with indexes
  - Async/await for non-blocking operations

### Efficiency Wins
- **Custom moderation vs AI calls**: 
  - Topic check: ~10ms (vs 1-3 seconds with AI)
  - Content check: <1ms (vs 1-2 seconds with AI)
  - **Result**: 100-300x faster, $0 API costs

- **Direct MongoDB storage**:
  - Full conversation history retained
  - No data loss from summarization
  - Fast query performance with indexes

---

## 🚧 System Status & Known Issues

### ✅ Fully Working Features
- User authentication (signup, login, JWT)
- AI chat with context memory
- Topic moderation with discovery phase
- Content moderation
- Quiz generation (all question types)
- Quiz submission and grading
- Quiz history with detailed results
- Dashboard statistics (real data)
- Course library and enrollment
- Course progress tracking
- Course deduplication system
- Real-time WebSocket updates
- Learning Hub features

### ⚠️ Known Limitations
- **Progress tracking**: Based on chat topics, not explicit completion markers
- **Time estimation**: Calculated from message timestamps (may be inaccurate if tab left open)
- **Course completion**: Requires 100% topic coverage via chat (no manual "mark complete")

### 🔮 Planned Enhancements
- [ ] Explicit "Mark Topic Complete" button
- [ ] Active tab detection for accurate time tracking
- [ ] Course completion certificates
- [ ] Achievement badges system
- [ ] Leaderboards
- [ ] Study time recommendations
- [ ] Progress notifications
- [ ] Export quiz results to PDF
- [ ] Peer comparison features
- [ ] Voice input support
- [ ] Multi-language support

---

## 🧪 Testing the Platform

### Manual Testing Checklist

#### Authentication
- [ ] Sign up with new account
- [ ] Login with credentials
- [ ] Logout and verify session cleared
- [ ] Invalid credentials handled properly

#### Chat & Learning
- [ ] Start new chat session
- [ ] Ask 3 questions (discovery phase)
- [ ] Verify no blocking during discovery
- [ ] Ask on-topic question (message 4+)
- [ ] Ask off-topic question and verify redirect
- [ ] Use pronouns ("it", "this") and verify context understanding

#### Quiz System
- [ ] Generate quiz from chat
- [ ] Answer all questions
- [ ] Submit quiz
- [ ] Verify redirect to quiz history
- [ ] View detailed results
- [ ] Check correct/incorrect marking
- [ ] Verify explanations displayed
- [ ] Retake quiz and verify attempt count increases

#### Dashboard
- [ ] Check statistics update after quiz
- [ ] Verify learning time increases after chat
- [ ] Check course completion percentage
- [ ] Verify weekly progress chart

#### Course Library
- [ ] Browse courses
- [ ] Enroll in a course
- [ ] Verify enrollment reflected in dashboard
- [ ] Check recommended courses

---

## 📁 Project Structure

```
Profense/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── mcp/              # Model Context Protocol integration
│   │   │   ├── client.ts     # MCP client (tool execution)
│   │   │   └── server.ts     # MCP server (tool definitions)
│   │   ├── middleware/       # Express middleware
│   │   │   ├── auth.ts       # JWT authentication
│   │   │   └── errorHandler.ts
│   │   ├── models/           # MongoDB schemas
│   │   │   ├── User.ts
│   │   │   ├── Course.ts
│   │   │   ├── Quiz.ts
│   │   │   └── ChatSession.ts
│   │   ├── routes/           # API endpoints
│   │   │   ├── auth.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   ├── course.routes.ts
│   │   │   ├── quiz.routes.ts
│   │   │   ├── learning.routes.ts
│   │   │   └── user.routes.ts
│   │   ├── services/         # Business logic
│   │   │   ├── ai.service.ts              # Gemini AI integration
│   │   │   ├── enhanced-ai.service.ts     # Advanced AI features
│   │   │   ├── topicModeration.service.ts # Smart topic checking
│   │   │   └── courseDeduplication.service.ts
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Helper functions
│   │   └── index.ts          # Server entry point
│   ├── logs/                 # Application logs
│   └── package.json
├── src/                      # Frontend source
│   ├── components/
│   │   ├── auth/            # Authentication components
│   │   ├── chat/            # Chat interface
│   │   ├── courses/         # Course library
│   │   ├── dashboard/       # Dashboard
│   │   ├── landing/         # Landing page
│   │   ├── learning/        # Learning Hub features
│   │   ├── profile/         # User profile
│   │   ├── quiz/            # Quiz components
│   │   └── ui/              # Reusable UI components
│   ├── context/             # React Context API
│   ├── services/            # API service layer
│   │   ├── api.ts           # Base API client
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   ├── courseService.ts
│   │   ├── quizService.ts
│   │   └── learningService.ts
│   ├── types/               # TypeScript types
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── Documentation/            # Detailed feature docs
│   ├── ADAPTIVE_TOPIC_LEARNING.md
│   ├── CONTENT_MODERATION_ANALYSIS.md
│   ├── CONTEXT_AWARE_MODERATION.md
│   ├── COURSE_DATABASE_DEDUPLICATION.md
│   ├── DASHBOARD_STATS_UPDATE.md
│   ├── DISCOVERY_PHASE_FIX.md
│   ├── MCP_PERFORMANCE_ANALYSIS.md
│   ├── QUIZ_GENERATION_FIX.md
│   ├── QUIZ_SYSTEM_COMPLETE.md
│   ├── STRICT_TOPIC_ENFORCEMENT.md
│   └── TOPIC_MODERATION_FIX.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🤝 Contributing

We welcome contributions! Whether you're fixing bugs, adding features, or improving documentation, your help is appreciated.

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/AmazingFeature`
3. **Commit your changes**: `git commit -m 'Add some AmazingFeature'`
4. **Push to the branch**: `git push origin feature/AmazingFeature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini AI**: For powering our intelligent tutoring system
- **MongoDB**: For flexible, scalable data storage
- **React & Vite**: For modern, fast frontend development
- **Express.js**: For robust backend architecture
- **Tailwind CSS**: For beautiful, responsive design
- **All open-source contributors**: This project stands on the shoulders of giants

---

## 📞 Support & Contact

- **Developer**: THATSMEPS
- **GitHub**: [https://github.com/THATSMEPS](https://github.com/THATSMEPS)
- **Repository**: [https://github.com/THATSMEPS/Profense](https://github.com/THATSMEPS/Profense)
- **Issues**: [Report a bug or request a feature](https://github.com/THATSMEPS/Profense/issues)

---

## 🌟 Star Us!

If you find Profense useful, please consider giving us a ⭐ on GitHub! It helps others discover the project and motivates us to keep improving.

---

## 🎓 Built for Education, Powered by AI

**Profense** - Where intelligent technology meets effective learning.

---

*Last Updated: October 27, 2025*
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
