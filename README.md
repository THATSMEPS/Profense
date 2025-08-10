## SynapSense – The AI Professor That Feels Your Mind

An emotionally and cognitively adaptive AI tutor. In real time, SynapSense senses your learning state via webcam micro-expressions and voice intensity, estimates a Learning Pulse, and adapts lessons instantly using GPT.

### Features
- Emotion sensing with face-api.js (on-device)
- Voice intensity metering and Whisper transcription
- Learning Pulse engine to classify states: lost, unfocused, confident, frustrated, neutral
- Adaptive lesson generation with GPT-4o-mini
- Instant UI adaptations (dim screen when overloaded), quick quizzes

### Requirements
- Node 18+
- A `GEMINI_API_KEY`

### Setup
1. Create `.env.local` in the project root with:
   ```ini
   GEMINI_API_KEY=YOUR_KEY
   ```
2. Install deps and download models:
   ```bash
   npm install
   npm run setup
   ```
3. Run:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` and allow camera/microphone.

# Profense – The AI Professor That Feels Your Mind

An emotionally and cognitively adaptive AI tutor powered by real-time emotion detection and voice analysis. Profense adapts its teaching style based on your learning state, providing personalized education that responds to your emotional and cognitive needs.

## 🚀 Features

### Adaptive Learning Engine
- **Real-time Emotion Detection**: Facial expression analysis using face-api.js (on-device processing)
- **Voice Sentiment Analysis**: Voice intensity monitoring and speech-to-text transcription
- **Learning Pulse Engine**: Intelligent classification of learning states (lost, unfocused, confident, frustrated, neutral)
- **Dynamic Content Adaptation**: Instant lesson adjustments using Google's Gemini AI
- **Intelligent UI Responses**: Automatic interface adaptations (screen dimming, visual cues) based on cognitive load

### Interactive Experience
- **Clean Modern Interface**: Professional, distraction-free learning environment
- **Split-Panel Design**: Conversation on the left, live sensors on the right
- **Live Adaptive Modes**: Visual indicators when switching between Normal and Analogy modes
- **Interactive Quizzes**: Instant MCQ generation with real-time feedback
- **Session Tracking**: Comprehensive session summaries with adaptation history

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **AI Integration**: Google Gemini API for adaptive content generation
- **Computer Vision**: face-api.js for real-time facial emotion recognition
- **State Management**: Zustand for session and pulse state management
- **Styling**: Modern glassmorphism design with responsive layouts

## 📋 Requirements

- Node.js 18+
- Google Gemini API key
- Modern browser with camera and microphone access

## ⚡ Quick Start

### 1. Environment Setup
Create a `.env` file in the project root:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_MAX_TOKENS=300
```

### 2. Installation
```bash
# Install dependencies
npm install

# Download face detection models
npm run setup
```

### 3. Development
```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
```

### 4. Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🎯 User Workflow

### 1. Landing & Topic Selection
- **Professional Landing Page**: Clean branding with "Profense" logo and tagline
- **Topic Dropdown**: Choose from Neural Networks, Machine Learning, AI Ethics, etc.
- **Smart Navigation**: Seamless transition to learning session

### 2. Live Learning Session
- **Split-Screen Layout**:
  - **Left Panel**: Real-time conversation with chat bubbles and mode indicators
  - **Right Panel**: Live sensor data (emotion, voice, cognitive load)
- **Adaptive Content**: Lessons automatically adjust based on detected learning state
- **Visual Feedback**: Clear mode badges showing current teaching approach

### 3. Intelligent Adaptation
- **Trigger Detection**: System monitors for frustration, confusion, or overload
- **Dynamic Switching**: Automatic mode changes with animated notifications
- **Content Transformation**: Lessons convert to analogies, simplified explanations, or advanced topics

### 4. Interactive Assessment
- **Smart Quizzes**: Context-aware questions generated based on current lesson
- **Instant Feedback**: Real-time scoring with explanatory responses
- **Progress Tracking**: Session-level analytics and improvement metrics

### 5. Session Management
- **Comprehensive Summaries**: Topic coverage, adaptation events, and quiz performance
- **Easy Restart**: One-click return to topic selection for new sessions
- **Data Persistence**: Learning progress maintained across sessions

## 🧠 How Profense Adapts

### Emotion-Driven Adaptations
- **Confused/Lost**: Slower pace, simplified explanations, more examples
- **Frustrated**: Humor injection, encouraging tone, step-by-step breakdowns
- **Confident**: Advanced challenges, faster pace, complex concepts
- **Unfocused**: Gamification elements, interactive quizzes, attention grabbers

### Cognitive Load Management
- **High Load**: Screen dimming, reduced information density, breathing space
- **Optimal Load**: Standard presentation with rich content
- **Low Load**: Increased complexity, additional challenges, deeper exploration

### Voice Pattern Recognition
- **Uncertain Speech**: Clarification requests, concept reinforcement
- **Confident Responses**: Progressive difficulty increases
- **Silence/Hesitation**: Gentle prompting, alternative explanations

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── page.tsx           # Landing page with topic selection
│   ├── session/           # Learning session interface
│   ├── api/               # API routes for AI and transcription
│   ├── globals.css        # Global styles and Tailwind
│   └── layout.tsx         # Root layout component
├── components/            # Reusable UI components
│   ├── LessonPane.tsx     # Adaptive lesson display
│   ├── QuizPane.tsx       # Interactive quiz interface
│   ├── VoiceSensor.tsx    # Voice analysis component
│   ├── WebcamEmotionSensor.tsx # Emotion detection
│   └── PulseGauge.tsx     # Cognitive load visualization
├── lib/                   # Core utilities
│   └── openai.ts          # Gemini AI integration
└── store/                 # State management
    ├── pulseStore.ts      # Learning pulse state
    └── sessionStore.ts    # Session data management
```

## 🔧 Configuration

### API Endpoints
- `/api/learn` - Adaptive lesson generation
- `/api/transcribe` - Voice-to-text processing

### Model Downloads
Face detection models are automatically downloaded to `public/models/` during setup.

### Customization Options
- Modify adaptation triggers in `src/store/pulseStore.ts`
- Adjust AI prompts in `src/lib/openai.ts`
- Customize UI themes in `src/app/globals.css`

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `.next` folder and `public` directory
3. Configure environment variables on your hosting platform

## 🛡️ Privacy & Security

- **On-Device Processing**: All facial analysis happens locally in the browser
- **No Data Storage**: Emotion data is processed in real-time and not stored
- **Secure API Calls**: All AI requests are server-side with encrypted connections
- **User Control**: Camera and microphone permissions required and controllable

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For questions, issues, or feature requests, please open an issue on GitHub.

---

**Profense** - Intelligent tutoring that adapts to you, not the other way around.

### Notes
- Face-api models are downloaded to `public/models` on `npm run setup`.
- Whisper endpoint accepts short audio snippets from your browser mic.
- Heuristics live in `src/store/pulseStore.ts`; prompt in `src/lib/openai.ts`.


