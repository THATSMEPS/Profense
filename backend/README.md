# Profense Backend

AI-Powered Educational Platform Backend built with Node.js, Express, TypeScript, and Gemini 2.5 Flash.

## Features

- 🤖 **AI-Powered Learning**: Integration with Google's Gemini 2.5 Flash for intelligent tutoring
- 📚 **Dynamic Course Generation**: AI generates comprehensive course outlines and content
- 🎯 **Adaptive Learning**: AI switches teaching modes based on student understanding
- 💬 **Real-time Chat**: WebSocket support for instant AI responses
- 📊 **Analytics & Progress Tracking**: Detailed learning analytics and progress monitoring
- 🎤 **Voice Support**: Speech-to-text integration for voice-based learning
- 🏆 **Gamification**: Achievements, streaks, and progress tracking
- 🔐 **Authentication & Security**: JWT-based authentication with refresh tokens
- 🚀 **Production Ready**: Comprehensive error handling, logging, and rate limiting

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini 2.5 Flash
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Google Gemini API key

### Installation

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/profense
   
   # JWT Secrets (generate strong secrets for production)
   JWT_SECRET=your-super-secret-jwt-key
   JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key
   
   # Google Gemini API
   GEMINI_API_KEY=your-gemini-api-key-here
   
   # CORS Origin (your frontend URL)
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3001`

### Production Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Start production server:**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/verify` - Verify token

### AI Services
- `POST /api/ai/generate-course` - Generate course with AI
- `POST /api/ai/chat` - Chat with AI tutor
- `POST /api/ai/generate-quiz` - Generate quiz questions
- `POST /api/ai/evaluate-quiz` - Evaluate quiz answers
- `POST /api/ai/analyze-learning-path` - Get learning recommendations

### Courses
- `GET /api/courses` - Get all courses (with filtering)
- `GET /api/courses/:id` - Get specific course
- `GET /api/courses/:id/progress` - Get course progress
- `POST /api/courses/:id/enroll` - Enroll in course
- `POST /api/courses/:id/topics/:topicId/complete` - Mark topic complete

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/stats` - Get learning statistics
- `POST /api/users/update-learning-time` - Update learning time
- `POST /api/users/update-streak` - Update learning streak

## Socket.IO Events

### Client to Server
- `join-session` - Join a learning session
- `chat-message` - Send message to AI tutor
- `voice-data` - Send voice input for processing

### Server to Client
- `ai-response` - AI tutor response
- `voice-response` - Voice processing result
- `adaptive-mode-switch` - Teaching mode change notification

## AI Integration

### Gemini 2.5 Flash Features

1. **Course Generation**: AI creates comprehensive course outlines with topics, subtopics, and learning objectives
2. **Adaptive Teaching**: AI adjusts teaching style based on student responses and confusion level
3. **Quiz Generation**: Creates various types of questions (MCQ, numerical, subjective)
4. **Answer Evaluation**: Provides detailed feedback and identifies learning gaps
5. **Sentiment Analysis**: Detects student confusion and switches to "toddler mode" if needed

### Teaching Modes
- **Beginner**: Simple language with lots of examples
- **Normal**: Balanced explanations with practical examples
- **Advanced**: Technical language with complex concepts
- **Toddler**: Extremely simple with real-life analogies (activated when student is confused)

## Development

### Project Structure
```
backend/
├── src/
│   ├── controllers/     # Route handlers (optional, using routes directly)
│   ├── middleware/      # Express middleware
│   ├── models/         # MongoDB/Mongoose models
│   ├── routes/         # API route definitions
│   ├── services/       # Business logic and AI services
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   └── index.ts        # Main application entry point
├── dist/               # Compiled JavaScript (auto-generated)
├── logs/               # Application logs
└── uploads/            # File uploads (if needed)
```

### Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm test` - Run tests

### Key Services

#### AI Service (`services/ai.service.ts`)
- Course outline generation
- Teaching response generation
- Quiz question creation
- Answer evaluation
- Sentiment analysis
- Adaptive mode switching

#### Authentication (`middleware/auth.ts`)
- JWT token generation and verification
- Route protection
- User role management

#### Error Handling (`middleware/errorHandler.ts`)
- Centralized error handling
- API error responses
- Development vs production error details

## Database Models

### User
- Profile information and preferences
- Learning statistics and achievements
- Authentication credentials

### Course
- Course information and structure
- Topics and subtopics
- Learning objectives and prerequisites

### Learning Sessions (Future)
- User learning sessions
- Progress tracking
- Time spent on topics

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/profense` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_REFRESH_SECRET` | Refresh token secret | Required |
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:5173` |

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation with Joi
- Password hashing with bcrypt
- JWT token expiration
- Environment variable protection

## Logging

Winston logger with:
- Console logging for development
- File logging for production
- Error-specific log files
- Request/response logging with Morgan

## Error Handling

Comprehensive error handling with:
- Custom error classes
- Validation error parsing
- Database error handling
- JWT error handling
- Development vs production error responses

## Future Enhancements

1. **Advanced Analytics**: Machine learning for learning pattern analysis
2. **Multimedia Content**: Support for images, videos, and interactive content
3. **Collaboration**: Study groups and peer learning features
4. **Mobile API**: Enhanced API for mobile app integration
5. **Advanced Voice**: Real-time voice conversations with AI
6. **Offline Support**: Downloadable content for offline learning
7. **Multi-language**: Support for multiple languages
8. **Advanced Gamification**: Leaderboards, competitions, and rewards

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
