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
- An `OPENAI_API_KEY`

### Setup
1. Copy env template and fill keys:
   - Create `.env.local` in the project root with:
     ```ini
     OPENAI_API_KEY=YOUR_KEY
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

### How to use (Layman’s guide)
- Enter a topic and what you want (e.g., “Explain simply”). Click “Teach Me”.
- Keep your webcam and mic on. SynapSense senses emotions and voice energy.
- If you look confused or frustrated, it will slow down, add analogies, or use humor.
- If you seem confident, it will jump to advanced problems.
- If you lose focus, it gamifies with quick challenges.
- Answer any quiz that appears; you’ll get instant feedback.

### Notes
- Face-api models are downloaded to `public/models` on `npm run setup`.
- Whisper endpoint accepts short audio snippets from your browser mic.
- This is an MVP built for hackathons; refine heuristics in `src/store/pulseStore.ts` and prompts in `src/lib/openai.ts`.




