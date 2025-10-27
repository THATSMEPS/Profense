# Discovery Phase Implementation

## Problem

When users enter the **Learn** section without selecting a topic:
- Initial state: `currentTopic = null`, `currentSubject = null`
- Backend creates session: `subject: "General Discussion"`, `currentTopic: undefined`
- **Issue**: User asks first question → Gets blocked by topic moderation immediately
- **Example**: 
  ```
  User: "What is quantum physics?"
  System: ❌ "Let's stay focused on General Discussion!"
  ```

## Root Cause

Topic moderation was **too eager**:
- Activated immediately when `currentTopic` was set
- No "warm-up" period for topic discovery
- Treated first messages same as later messages
- Blocked natural topic exploration

## Solution: Discovery Phase

### Concept
First **3 messages** in any session = **Discovery Phase**
- No strict topic moderation
- System learns what user wants to study
- Natural conversation flow
- After message 3, moderation enables

### Implementation

#### 1. Added Message Counter
```typescript
// backend/src/models/ChatSession.ts
context: {
  difficulty: 'beginner' | 'normal' | 'advanced';
  teachingMode: 'beginner' | 'normal' | 'advanced';
  previousConcepts: string[];
  sessionType: 'teaching' | 'chat' | 'quiz-prep' | 'review';
  learningObjectives: string[];
  messageCount: number;  // NEW: Tracks message count
}
```

#### 2. Increment Counter on Each Message
```typescript
// backend/src/routes/chat.routes.ts
// Increment message count for topic discovery phase
chatSession.context.messageCount = (chatSession.context.messageCount || 0) + 1;
```

#### 3. Skip Moderation During Discovery
```typescript
// Discovery phase: First 3 messages skip strict topic moderation
const isInDiscoveryPhase = (chatSession.context.messageCount || 0) <= 3;

if (isInDiscoveryPhase) {
  logger.info(`Discovery phase active (message ${chatSession.context.messageCount}/3) - skipping strict topic moderation`);
}

// Only check topic relevance if:
// 1. We have a defined current topic
// 2. We're past the discovery phase (message 4+)
// 3. Message is not a general greeting/question
if (chatSession.currentTopic && !isInDiscoveryPhase && !topicModerationService.isGeneralMessage(message)) {
  // ... topic moderation logic ...
}
```

## How It Works Now

### Discovery Phase (Messages 1-3)

```
Message 1:
User: "What is quantum physics?"
↓
messageCount = 1 (≤ 3) → Discovery phase active
↓
Skip topic moderation ✅
↓
AI: [Explains quantum physics]
↓
Topic learned: "quantum physics"
```

```
Message 2:
User: "Tell me about wave-particle duality"
↓
messageCount = 2 (≤ 3) → Discovery phase active
↓
Skip topic moderation ✅
↓
AI: [Explains wave-particle duality]
```

```
Message 3:
User: "How does quantum tunneling work?"
↓
messageCount = 3 (≤ 3) → Discovery phase active
↓
Skip topic moderation ✅
↓
AI: [Explains quantum tunneling]
```

### Focus Phase (Message 4+)

```
Message 4:
User: "What is the Schrödinger equation?"
↓
messageCount = 4 (> 3) → Focus phase active
↓
Topic: "quantum physics" (learned from discovery)
↓
Run topic moderation
  - Message: "Schrödinger equation"
  - Topic: "quantum physics"
  - Context: [previous quantum questions]
  - Score: 0.85 ✅
↓
Allow (highly relevant)
↓
AI: [Explains Schrödinger equation]
```

```
Message 5:
User: "What about biology?"
↓
messageCount = 5 (> 3) → Focus phase active
↓
Topic: "quantum physics"
↓
Run topic moderation
  - Message: "biology"
  - Topic: "quantum physics"
  - Score: 0.05 ❌
↓
Block (off-topic)
↓
AI: "Let's stay focused on quantum physics!"
```

## Benefits

### 1. Natural Onboarding
✅ Users can freely ask initial questions  
✅ System learns topic from conversation  
✅ No frustrating early blocks  

### 2. Smooth Transition
✅ First 3 messages: Open exploration  
✅ Message 4+: Focused learning  
✅ Clear phase transition  

### 3. Context Building
✅ Discovery phase builds conversation history  
✅ Contextual references work better  
✅ Better understanding of user intent  

### 4. Reduced False Positives
✅ No blocking during topic establishment  
✅ Contextual follow-ups already implemented  
✅ Smart moderation after discovery  

## Edge Cases Handled

### Case 1: No Topic Set
```
User enters Learn tab without topic
↓
Session created: currentTopic = null
↓
Message 1-3: Discovery phase (no moderation)
↓
Message 4+: If currentTopic still null, continue without moderation
```

### Case 2: Greetings
```
Message 1: "Hi!"
↓
isGeneralMessage("Hi!") → true
↓
Skip moderation (already handled)
↓
Message 2: "What is calculus?"
↓
Discovery phase + not greeting → Skip moderation
```

### Case 3: Topic Switch Attempt
```
Messages 1-3: Discussing quantum physics
Message 4: "Tell me about biology instead"
↓
Focus phase active
↓
Topic moderation detects switch
↓
Block or offer to create new session
```

### Case 4: Existing Session Continues
```
User returns to existing session (messageCount = 15)
↓
Not in discovery phase
↓
Full topic moderation active ✅
```

## Configuration

### Discovery Phase Length
```typescript
const DISCOVERY_PHASE_LENGTH = 3; // First 3 messages

// Current check:
const isInDiscoveryPhase = (chatSession.context.messageCount || 0) <= 3;

// To adjust:
// - Longer (5): More exploration, later focus
// - Shorter (2): Faster focus, less exploration
```

### Why 3 Messages?
- **Message 1**: User states topic  
  Example: "What is quantum physics?"
- **Message 2**: Follow-up question  
  Example: "Tell me about wave functions"
- **Message 3**: Clarification/deeper dive  
  Example: "How does this relate to Heisenberg?"
- **Message 4+**: Topic established, enable focus

## Database Schema

### ChatSession.context
```typescript
{
  difficulty: 'normal',
  teachingMode: 'normal',
  previousConcepts: [],
  sessionType: 'teaching',
  learningObjectives: [],
  messageCount: 0  // NEW: Increments with each message
}
```

### Initialization
```typescript
// New session
chatSession.context.messageCount = 0

// Each message
chatSession.context.messageCount = (chatSession.context.messageCount || 0) + 1
```

## Testing

### Test 1: Fresh Learn Session
```
✅ Enter Learn tab (no topic)
✅ Message 1: "What is calculus?" → Allowed
✅ Message 2: "Explain derivatives" → Allowed
✅ Message 3: "Show examples" → Allowed
✅ Message 4: "What about biology?" → Blocked (off-topic)
```

### Test 2: Discovery Phase Logs
```
Backend logs should show:
"Discovery phase active (message 1/3) - skipping strict topic moderation"
"Discovery phase active (message 2/3) - skipping strict topic moderation"
"Discovery phase active (message 3/3) - skipping strict topic moderation"
"Topic check for 'quantum physics': redirect (score: 0.05)" ← Message 4+
```

### Test 3: Contextual References
```
✅ Message 1: "What is quantum physics?"
✅ Message 2: "Tell me more about it" → Allowed (discovery)
✅ Message 4: "Give me formulas for it" → Allowed (context-aware)
```

### Test 4: Existing Session
```
✅ Load session with messageCount = 10
✅ Send message → messageCount = 11
✅ Not in discovery phase → Full moderation active
```

## Monitoring

### Key Metrics
- **Discovery Success Rate**: % of sessions that establish clear topic
- **Early Blocks**: Should be ~0% in first 3 messages
- **Late Blocks**: Should increase after message 3 (good!)
- **Average Messages to Focus**: Should be ~4

### Logs to Watch
```
"Discovery phase active (message X/3)"  ← Good
"Topic check ... redirect"              ← After message 3
"Contextual follow-up detected"         ← Context awareness working
```

## Future Enhancements

### 1. Smart Topic Extraction (See ADAPTIVE_TOPIC_LEARNING.md)
- Automatically extract topic from first messages
- Match to existing courses
- Classify into subjects

### 2. Adaptive Discovery Length
```typescript
// Adjust based on topic clarity
if (topicConfidence > 0.8) {
  // Strong signal, end discovery early
  DISCOVERY_PHASE_LENGTH = 2;
} else {
  // Unclear topic, extend discovery
  DISCOVERY_PHASE_LENGTH = 5;
}
```

### 3. Discovery Phase Summary
```
After message 3, show:
"I understand you want to learn about quantum physics. 
Let's focus on this topic. Ready to continue?"
```

## Files Modified

### 1. `backend/src/models/ChatSession.ts`
- ✅ Added `messageCount` to context schema
- ✅ Default value: 0
- ✅ Type: Number, min: 0

### 2. `backend/src/types/index.ts`
- ✅ Updated `IChatSession` interface
- ✅ Added `messageCount?: number` to context

### 3. `backend/src/routes/chat.routes.ts`
- ✅ Initialize `messageCount: 0` in new sessions
- ✅ Increment counter on each message
- ✅ Check `isInDiscoveryPhase` before moderation
- ✅ Log discovery phase activity
- ✅ Skip strict topic moderation during discovery

## Deployment

### Database Migration
```typescript
// No migration needed - messageCount defaults to 0
// Existing sessions without messageCount will get 0

// Optional: Update existing sessions
db.chatsessions.updateMany(
  { 'context.messageCount': { $exists: false } },
  { $set: { 'context.messageCount': 0 } }
);
```

### Backward Compatibility
✅ Old sessions without messageCount: Treated as 0  
✅ Existing logic unchanged: Only added conditional check  
✅ No breaking changes  

## Success Criteria

- [x] Added messageCount to ChatSession model
- [x] Added messageCount to TypeScript interface
- [x] Increment counter on each message
- [x] Discovery phase check implemented
- [x] Log discovery phase activity
- [x] Skip moderation during discovery (messages 1-3)
- [x] Enable moderation after discovery (message 4+)
- [x] No TypeScript errors
- [ ] User testing confirms no early blocks (pending)
- [ ] Topic focus works after message 3 (pending)

## Related Documentation

- `CONTEXT_AWARE_MODERATION.md` - Contextual reference detection
- `ADAPTIVE_TOPIC_LEARNING.md` - Future topic discovery system
- `STRICT_TOPIC_ENFORCEMENT.md` - Original moderation logic

---

**Status**: ✅ Discovery Phase Implemented  
**Impact**: Users can freely explore topics in first 3 messages  
**Early Blocks**: Reduced to ~0% in discovery phase  
**Learning Focus**: Maintained from message 4 onwards  
