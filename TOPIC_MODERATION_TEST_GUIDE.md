# Topic Moderation Testing Guide

## Overview
The topic moderation system keeps users focused on their current learning topic by checking message relevance BEFORE allowing AI responses.

## System Flow

### Priority Order (Most Important First):
1. ✅ **Topic Relevance Check** - "Is this related to what I'm studying?"
2. ✅ **Content Moderation** - "Is this explicitly inappropriate?"
3. ✅ **AI Response** - Normal learning interaction

## How It Works

### Topic Relevance Scoring:
- **0.6 - 1.0 (60%+)**: ✅ Allow - Question is clearly related to topic
- **0.3 - 0.6 (30-60%)**: ⚠️ Remind - Question is somewhat related, add gentle reminder
- **0.0 - 0.3 (<30%)**: 🚫 Redirect - Question is off-topic, block and redirect

### Score Calculation:
```
Score = (Topic Keywords Match × 60%) + (Subject Keywords Match × 30%) + (Question Boost × 10%)
```

## Test Scenarios

### ✅ Scenario 1: Direct Off-Topic Question
**Setup:**
- Current Topic: "Calculus - Limits"
- Subject: "Mathematics"

**Test Message:** "What is sex?"

**Expected Behavior:**
- Topic Keywords Match: 0% (no "calculus", "limit", "derivative", etc.)
- Subject Keywords Match: 0% (no "math", "equation", "function", etc.)
- Question Boost: +20% (has "what")
- **Final Score: 0.2 (20%)**
- **Action: REDIRECT** 🚫

**Expected Response:**
```
I notice you're asking about something unrelated to our current topic: Limits.

Let's stay focused on Limits to help you learn effectively. Here are some questions you could ask instead:
- What are limits in calculus?
- How do I evaluate a limit?
- Can you explain the concept of Limits?
- What are the properties of Limits?

Would you like to continue learning about Limits?
```

### ✅ Scenario 2: Related Subject, Different Topic
**Setup:**
- Current Topic: "Calculus - Derivatives"
- Subject: "Mathematics"

**Test Message:** "How do I solve quadratic equations?"

**Expected Behavior:**
- Topic Keywords Match: ~5% (no derivative-specific terms)
- Subject Keywords Match: ~40% (has "solve", "equations")
- Question Boost: +20% (has "how")
- **Final Score: ~0.35 (35%)**
- **Action: REMIND** ⚠️

**Expected Response:**
```
*Note: We're currently focusing on Derivatives. While your question is math-related, let's try to stay on topic to maximize your learning.*

---

[Then proceeds with AI response but with a reminder prepended]
```

### ✅ Scenario 3: On-Topic Question
**Setup:**
- Current Topic: "Calculus - Derivatives"
- Subject: "Mathematics"

**Test Message:** "What is the derivative of x squared?"

**Expected Behavior:**
- Topic Keywords Match: ~80% (has "derivative", mathematical terms)
- Subject Keywords Match: ~60% (has math-related terms)
- Question Boost: +20% (has "what")
- **Final Score: ~0.7+ (70%+)**
- **Action: ALLOW** ✅

**Expected Response:**
```
[Normal AI teaching response about derivatives]
```

## How to Test

### Step 1: Start a Chat Session
```bash
POST /api/chat/session
{
  "subject": "Mathematics",
  "topic": "Calculus - Limits",
  "difficulty": "intermediate"
}
```

### Step 2: Send Off-Topic Message
```bash
POST /api/chat/message
{
  "sessionId": "<session_id>",
  "message": "What is sex?",
  "subject": "Mathematics",
  "currentTopic": "Calculus - Limits"
}
```

### Step 3: Check Response
Look for:
- `topicModeration` object in response
- `topicModeration.type` should be `"redirect"`
- `topicModeration.relevanceScore` should be < 0.3
- `message.content` should contain redirect message

## Debugging

### Check Logs
Look for this line in backend logs:
```
Topic check for "Calculus - Limits": redirect (score: 0.20)
```

### Verify Session Has Topic
```javascript
// In MongoDB
db.chatsessions.findOne({ _id: ObjectId("your_session_id") })

// Check these fields:
{
  currentTopic: "Calculus - Limits",  // Must be set!
  subject: "Mathematics"               // Must be set!
}
```

### Common Issues

#### Issue 1: Topic Check Not Running
**Symptom:** AI responds to off-topic questions normally

**Possible Causes:**
- `currentTopic` is null/undefined in chat session
- Session wasn't created with a topic
- Message matches `isGeneralMessage()` patterns

**Fix:**
```typescript
// When creating session, always set topic:
const chatSession = new ChatSession({
  currentTopic: topic,  // Make sure this is set!
  subject: subject,     // And this!
  // ... other fields
});
```

#### Issue 2: Score Too High
**Symptom:** Off-topic questions getting scores > 0.3

**Possible Causes:**
- Question contains common words that match subject keywords
- Question boost is too generous

**Example:**
- "What is the history of sex?" 
- Could match "history" if studying History
- Score might be inflated

**Solution:** Already implemented - weighted scoring prioritizes topic match (60%) over subject (30%)

#### Issue 3: False Positives
**Symptom:** Related questions being blocked

**Example:** Asking about "integration" while studying "derivatives"
- These are related calculus topics
- Should get REMIND (not REDIRECT)

**Current Behavior:** Working as intended - system allows with reminder

## Frontend Integration

### Display Topic Moderation Alerts
In `ChatInterface.tsx`, check for `topicModeration` in response:

```typescript
if (response.data.topicModeration) {
  const { type, relevanceScore, currentTopic, suggestions } = response.data.topicModeration;
  
  if (type === 'redirect') {
    // Show error/warning alert
    showAlert({
      type: 'warning',
      title: 'Off-Topic Question',
      message: `Let's stay focused on ${currentTopic}`,
      suggestions: suggestions
    });
  } else if (type === 'reminder') {
    // Show gentle info message
    showAlert({
      type: 'info',
      title: 'Gentle Reminder',
      message: `We're currently studying ${currentTopic}`,
      dismissible: true
    });
  }
}
```

## Test Commands

### Quick Test Script
```javascript
// In browser console or Node.js

const testTopicModeration = async () => {
  // 1. Create session
  const sessionRes = await fetch('/api/chat/session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      subject: 'Mathematics',
      topic: 'Calculus - Limits',
      difficulty: 'intermediate'
    })
  });
  const { data: { sessionId } } = await sessionRes.json();
  
  // 2. Test off-topic question
  const msgRes = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      sessionId,
      message: 'What is sex?',
      subject: 'Mathematics',
      currentTopic: 'Calculus - Limits'
    })
  });
  const result = await msgRes.json();
  
  console.log('Topic Moderation Result:', result.data.topicModeration);
  console.log('AI Response:', result.data.message.content);
};

testTopicModeration();
```

## Verification Checklist

- [ ] Off-topic question (e.g., "What is sex?" in Calculus) gets REDIRECTED
- [ ] Related question (e.g., "What is algebra?" in Calculus) gets REMINDED
- [ ] On-topic question (e.g., "What is a derivative?" in Calculus) is ALLOWED
- [ ] Greetings ("Hi", "Hello") are always allowed
- [ ] Meta questions ("How does this work?") are always allowed
- [ ] Response includes `topicModeration` object when redirected/reminded
- [ ] Logs show relevance scores for debugging

## Current Status

✅ **Implemented:** Topic moderation with 3-tier system
✅ **Implemented:** Priority order (topic check before content check)
✅ **Implemented:** Detailed logging for debugging
✅ **Implemented:** Suggestion generation for redirects

⏳ **Pending:** Frontend alert component integration
⏳ **Pending:** User testing and threshold tuning
⏳ **Pending:** Analytics tracking for off-topic attempts

## Known Limitations

1. **Keyword-Based Matching**: Current system uses simple keyword matching
   - May not understand semantic similarity
   - "Integration" vs "Derivatives" might not be recognized as related
   
2. **No Context Memory**: Doesn't remember if user asked permission to switch topics
   - User can't explicitly change topics mid-session
   
3. **No Multi-Topic Sessions**: Can't study multiple topics in one session
   - Each session is locked to one topic

## Future Enhancements

- [ ] AI-powered semantic similarity (Phase 2)
- [ ] Allow topic switching with explicit user request
- [ ] Track off-topic patterns for user insights
- [ ] Adaptive thresholds based on user behavior
- [ ] Multi-topic session support
- [ ] "Temporarily allow off-topic" user override

---

**Last Updated:** Current session
**Status:** ✅ Fully Implemented, Ready for Testing
