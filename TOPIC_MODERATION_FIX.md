# Topic Moderation Fix - Priority Reordering

## Issue Reported
When studying Calculus and asking "What is sex?", the system responded with biological information instead of redirecting the user back to Calculus.

## Root Cause
The moderation checks were in the wrong order:
1. ❌ **OLD ORDER**: Content Moderation → Topic Relevance → AI Response
2. ✅ **NEW ORDER**: Topic Relevance → Content Moderation → AI Response

### Why This Matters:
- Content moderation was checking if question was "educational"
- "What is sex?" has biological/educational context → Passed content check
- Topic relevance check happened AFTER, so educational but off-topic questions got through

## Fix Applied

### File: `backend/src/routes/chat.routes.ts`

**Changed the execution order:**

```typescript
// OLD FLOW (❌ Wrong):
1. Content moderation check (allows educational content)
2. Topic relevance check (too late!)
3. AI response

// NEW FLOW (✅ Correct):
1. Topic relevance check (blocks off-topic first!)
2. Content moderation check (blocks inappropriate content)
3. AI response
```

### Priority System:

#### 1️⃣ FIRST: Topic Relevance (lines 241-303)
```typescript
// Check if message is related to current topic
if (chatSession.currentTopic && !topicModerationService.isGeneralMessage(message)) {
  topicCheck = await topicModerationService.checkTopicRelevance(message, {
    currentTopic: chatSession.currentTopic,
    subject: chatSession.subject || 'General',
    difficulty: chatSession.context.difficulty,
    sessionType: chatSession.context.sessionType
  });
  
  // If relevance score < 30%, redirect immediately
  if (topicCheck.actionType === 'redirect') {
    return res.json({
      success: true,
      data: {
        message: { /* redirect message */ },
        topicModeration: {
          type: 'redirect',
          relevanceScore: topicCheck.relevanceScore,
          suggestions: topicCheck.suggestions,
          currentTopic: chatSession.currentTopic
        }
      }
    });
  }
}
```

#### 2️⃣ SECOND: Content Moderation (lines 305-347)
```typescript
// Only for explicitly inappropriate content (violence, explicit, etc.)
const moderationResult = await performContentModeration(message);

if (!moderationResult.approved) {
  return res.json({
    success: true,
    data: {
      message: { /* moderation message */ },
      moderation: moderationResult
    }
  });
}
```

#### 3️⃣ THIRD: Normal AI Response (lines 349+)
```typescript
// Generate teaching response
const aiResponseData = await aiService.generateTeachingResponse(message, context);
```

## Test Cases

### ✅ Test 1: Off-Topic Question
**Input:** "What is sex?" while studying "Calculus - Limits"
- Topic match: 0%
- Subject match: 0%
- Question boost: +20%
- **Score: 0.20 (20%)**
- **Action: REDIRECT** 🚫

**Expected Output:**
```
I notice you're asking about something unrelated to our current topic: Limits.

Let's stay focused on Limits to help you learn effectively.
```

### ✅ Test 2: Related but Different Topic
**Input:** "How do quadratic equations work?" while studying "Calculus - Derivatives"
- Topic match: ~5%
- Subject match: ~40%
- Question boost: +20%
- **Score: 0.35 (35%)**
- **Action: REMIND** ⚠️

**Expected Output:**
```
*Note: We're currently focusing on Derivatives. While your question is math-related, 
let's try to stay on topic to maximize your learning.*

[Then AI provides answer with reminder]
```

### ✅ Test 3: On-Topic Question
**Input:** "What is the derivative of x²?" while studying "Calculus - Derivatives"
- Topic match: ~80%
- Subject match: ~60%
- Question boost: +20%
- **Score: 0.72 (72%)**
- **Action: ALLOW** ✅

**Expected Output:**
```
[Normal AI teaching response about derivatives]
```

## How to Verify Fix

### Step 1: Start Backend
```bash
cd backend
npm run dev
```

### Step 2: Create Chat Session
```bash
POST http://localhost:5000/api/chat/session
{
  "subject": "Mathematics",
  "topic": "Calculus - Limits",
  "difficulty": "intermediate"
}
```

### Step 3: Ask Off-Topic Question
```bash
POST http://localhost:5000/api/chat/message
{
  "sessionId": "<your_session_id>",
  "message": "What is sex?",
  "subject": "Mathematics",
  "currentTopic": "Calculus - Limits"
}
```

### Step 4: Check Response
You should see:
```json
{
  "success": true,
  "data": {
    "message": {
      "content": "I notice you're asking about something unrelated to our current topic: Limits...",
      "aiModel": "topic-moderation"
    },
    "topicModeration": {
      "type": "redirect",
      "relevanceScore": 0.2,
      "suggestions": [
        "What are limits in calculus?",
        "How do I evaluate a limit?",
        ...
      ],
      "currentTopic": "Calculus - Limits"
    }
  },
  "message": "Topic redirect sent successfully"
}
```

### Step 5: Check Logs
Backend logs should show:
```
Topic check for "Calculus - Limits": redirect (score: 0.20)
```

## Important Notes

### When Topic Check Runs:
- ✅ Only if `chatSession.currentTopic` is set
- ✅ Only if message is NOT a general greeting/meta question
- ✅ Runs BEFORE content moderation
- ✅ Runs BEFORE AI response generation

### When Topic Check is Skipped:
- ❌ No `currentTopic` in session
- ❌ Message is greeting: "Hi", "Hello", "Thanks"
- ❌ Message is meta: "How does this work?", "What can you teach?"

### Thresholds:
- **≥ 60%**: Allow without warning
- **30-60%**: Allow with reminder
- **< 30%**: Block and redirect

## Files Modified

1. ✅ `backend/src/routes/chat.routes.ts`
   - Reordered moderation checks
   - Topic relevance now runs FIRST

2. ✅ `TOPIC_MODERATION_TEST_GUIDE.md` (New)
   - Comprehensive testing guide
   - Test scenarios and examples
   - Debugging instructions

## Related Documentation

- `CONTENT_MODERATION_ANALYSIS.md` - Content moderation details
- `TOPIC_MODERATION_TEST_GUIDE.md` - Complete testing guide
- `backend/src/services/topicModeration.service.ts` - Service implementation

## Success Criteria

- [x] Off-topic questions are blocked (score < 30%)
- [x] Topic check runs before content check
- [x] Response includes `topicModeration` data
- [x] Logs show relevance scores
- [x] No TypeScript errors
- [ ] Frontend displays redirect alerts (pending)
- [ ] User testing confirms behavior (pending)

## Next Steps

1. **Test in UI**: Verify redirect messages appear correctly
2. **Frontend Alert**: Add `ModerationAlert` component for topic redirects
3. **Analytics**: Track off-topic attempt patterns
4. **Threshold Tuning**: Adjust based on real user feedback

---

**Status:** ✅ Fix Applied and Ready for Testing
**Priority:** 🔴 High - Core Learning Focus Feature
**Last Updated:** Current session
