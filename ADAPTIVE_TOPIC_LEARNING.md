# Adaptive Topic Learning System

## Problem Statement

When users enter the **Learn** section:
- No course/topic is selected initially (`currentTopic = null`, `currentSubject = null`)
- Backend creates session with `subject: "General Discussion"` and `currentTopic: undefined`
- User asks first question → Works fine (topic moderation skipped)
- User asks follow-up question → **BLOCKED** by moderation (because now a topic might be set)

## Current Flow Issues

### Scenario 1: First Message
```
User enters Learn tab
↓
currentTopic = null
currentSubject = null
↓
User: "What is quantum physics?"
↓
Backend: No currentTopic set → Skip topic moderation ✅
AI: [Explains quantum physics]
↓
Topic gets set from message → currentTopic = "quantum physics"
```

### Scenario 2: Follow-up (PROBLEM)
```
User: "Tell me more about it"
↓
Backend: currentTopic = "quantum physics" → Run topic moderation
↓
Message: "Tell me more about it"
Context: ["What is quantum physics?"]
↓
Topic Check: Low direct relevance (no "quantum" keyword)
Even with contextual reference: Might still block if context score < 40%
↓
❌ BLOCKED or ❌ Moderation warning
```

## Proposed Solution: Adaptive Topic System

### Core Concept
The system should **dynamically discover and classify topics** from conversation, then match them to existing courses/topics.

### Flow Diagram
```
User Message
     ↓
Is this first message in session?
     ↓
   YES → Extract topic from message
          ↓
          Search existing courses/topics for match
          ↓
          MATCH FOUND? 
               ↓
             YES → Assign course & topic
             NO  → Create "Discovered Topic" (General subject)
          ↓
          Allow message (no moderation yet)
     ↓
   NO → Is topic assigned?
          ↓
        YES → Run topic moderation
        NO  → Extract & assign topic, then allow
```

## Implementation Strategy

### Phase 1: Topic Discovery
When user sends first message without topic:
1. Extract topic keywords from message
2. Search database for matching courses
3. If match found (>70% similarity): Assign that course/topic
4. If no match: Create temporary "Discovered Topic" with subject classification

### Phase 2: Topic Classification
Classify discovered topic into existing subject categories:
- **STEM**: Math, Physics, Chemistry, Biology, Computer Science
- **Languages**: English, Spanish, Programming Languages
- **Humanities**: History, Literature, Philosophy
- **Professional**: Business, Law, Medicine
- **General**: Everything else

### Phase 3: Smart Moderation
- **First 3 messages**: No topic moderation (discovery phase)
- **After 3 messages**: Enable topic moderation with assigned topic
- **Contextual follow-ups**: Always allowed (already implemented)
- **Topic drift**: Offer to create new session

## Code Implementation

### 1. Topic Discovery Service

```typescript
// backend/src/services/topicDiscovery.service.ts

interface TopicMatch {
  courseId?: string;
  subject: string;
  topic: string;
  confidence: number;
  isExistingCourse: boolean;
}

class TopicDiscoveryService {
  /**
   * Extract topic from user's first message
   */
  async discoverTopic(message: string, userId: string): Promise<TopicMatch> {
    // Extract keywords
    const keywords = this.extractTopicKeywords(message);
    
    // Search for matching courses in database
    const matchingCourse = await this.findMatchingCourse(keywords, userId);
    
    if (matchingCourse && matchingCourse.confidence > 0.7) {
      return {
        courseId: matchingCourse._id,
        subject: matchingCourse.subject,
        topic: matchingCourse.topics[0], // Primary topic
        confidence: matchingCourse.confidence,
        isExistingCourse: true
      };
    }
    
    // No match found - classify into general subject
    const subject = this.classifySubject(keywords);
    const topic = this.extractMainTopic(message);
    
    return {
      subject,
      topic,
      confidence: 0.6,
      isExistingCourse: false
    };
  }
  
  /**
   * Search user's enrolled courses for topic match
   */
  private async findMatchingCourse(keywords: string[], userId: string) {
    const courses = await Course.find({ 
      'enrolledStudents.userId': userId 
    });
    
    let bestMatch = null;
    let highestScore = 0;
    
    for (const course of courses) {
      const courseKeywords = this.extractCourseKeywords(course);
      const score = this.calculateSimilarity(keywords, courseKeywords);
      
      if (score > highestScore) {
        highestScore = score;
        bestMatch = { ...course.toObject(), confidence: score };
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Classify message into subject category
   */
  private classifySubject(keywords: string[]): string {
    const subjectPatterns = {
      'Mathematics': ['math', 'calculus', 'algebra', 'geometry', 'equation', 'formula'],
      'Physics': ['physics', 'quantum', 'mechanics', 'energy', 'force', 'motion'],
      'Chemistry': ['chemistry', 'molecule', 'atom', 'reaction', 'compound'],
      'Biology': ['biology', 'cell', 'organism', 'evolution', 'dna', 'gene'],
      'Computer Science': ['programming', 'code', 'algorithm', 'software', 'computer'],
      'Literature': ['literature', 'book', 'novel', 'poetry', 'author', 'story'],
      'History': ['history', 'war', 'civilization', 'ancient', 'empire'],
      'General': []
    };
    
    let bestMatch = 'General';
    let highestScore = 0;
    
    for (const [subject, patterns] of Object.entries(subjectPatterns)) {
      const matches = keywords.filter(kw => 
        patterns.some(pattern => kw.includes(pattern))
      ).length;
      
      if (matches > highestScore) {
        highestScore = matches;
        bestMatch = subject;
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Extract main topic from message
   */
  private extractMainTopic(message: string): string {
    // Remove common phrases
    let topic = message
      .replace(/what is/gi, '')
      .replace(/explain/gi, '')
      .replace(/teach me about/gi, '')
      .replace(/tell me about/gi, '')
      .replace(/help me with/gi, '')
      .replace(/\?/g, '')
      .trim();
    
    // Take first meaningful phrase (max 5 words)
    const words = topic.split(' ').filter(w => w.length > 2);
    return words.slice(0, 5).join(' ') || 'General Learning';
  }
}
```

### 2. Updated Chat Route

```typescript
// backend/src/routes/chat.routes.ts

router.post('/message', asyncHandler(async (req: AuthRequest, res) => {
  // ... existing code ...
  
  let chatSession;
  
  if (sessionId) {
    chatSession = await ChatSession.findOne({
      _id: sessionId,
      userId: req.user!.id
    });
  } else {
    // NEW: Discover topic from first message
    const topicDiscoveryService = getTopicDiscoveryService();
    const discoveredTopic = await topicDiscoveryService.discoverTopic(
      message, 
      req.user!.id
    );
    
    chatSession = new ChatSession({
      userId: req.user!.id,
      subject: discoveredTopic.subject,
      currentTopic: discoveredTopic.topic,
      context: {
        difficulty: difficulty as any,
        teachingMode: difficulty as any,
        previousConcepts: [],
        sessionType: learningMode as any,
        learningObjectives: [],
        discoveredTopic: true,  // Flag for adaptive behavior
        messageCount: 0
      },
      messages: [],
      sessionStatus: 'active'
    });
    
    // Link to existing course if found
    if (discoveredTopic.isExistingCourse && discoveredTopic.courseId) {
      chatSession.courseId = discoveredTopic.courseId;
    }
  }
  
  // Increment message count
  chatSession.context.messageCount = (chatSession.context.messageCount || 0) + 1;
  
  // ... existing user message code ...
  
  // UPDATED: Topic moderation with adaptive behavior
  const topicModerationService = getTopicModerationService();
  let topicCheck = null;
  
  // Only check topic after first 3 messages (discovery phase)
  const isInDiscoveryPhase = chatSession.context.messageCount <= 3;
  
  if (
    chatSession.currentTopic && 
    !isInDiscoveryPhase &&  // NEW: Skip during discovery
    !topicModerationService.isGeneralMessage(message)
  ) {
    // ... existing topic moderation code ...
  }
  
  // ... rest of the code ...
}));
```

### 3. Enhanced Topic Moderation

```typescript
// backend/src/services/topicModeration.service.ts

async checkTopicRelevance(userMessage: string, context: TopicContext) {
  // NEW: Check if in discovery phase
  const isInDiscoveryPhase = context.messageCount && context.messageCount <= 3;
  
  if (isInDiscoveryPhase) {
    logger.info('Discovery phase: allowing message without strict moderation');
    return {
      allowed: true,
      actionType: 'allow' as const,
      relevanceScore: 1.0,
      message: null
    };
  }
  
  // ... existing contextual reference check ...
  
  // ... existing topic relevance check ...
}
```

## Benefits

### 1. Natural Onboarding
```
User: "What is quantum physics?"
↓
System discovers: Subject=Physics, Topic="quantum physics"
↓
System: [Explains quantum physics]
✅ No blocking, natural flow
```

### 2. Course Auto-Linking
```
User enrolled in: "Advanced Physics - Quantum Mechanics"
User asks: "Explain quantum entanglement"
↓
System matches: 85% similarity to enrolled course
↓
Auto-link: Session → Advanced Physics course
✅ Progress tracked automatically
```

### 3. Smart Topic Drift Detection
```
Message 1: "What is calculus?"
Message 2: "Explain derivatives"  ← Same topic ✅
Message 3: "Show me integrals"     ← Same topic ✅
Message 4: "What about biology?"   ← Topic drift detected

System: "I notice you're shifting to a new topic. Would you like to:
  • Continue with Calculus
  • Start a new session for Biology"
```

### 4. Discovery-to-Focus Transition
```
Messages 1-3: Discovery phase
  → No strict moderation
  → Extract topic keywords
  → Build context
  
Message 4+: Focus phase
  → Enable topic moderation
  → Maintain learning focus
  → Allow contextual follow-ups
```

## Edge Cases Handled

### Case 1: Vague First Message
```
User: "Hi, I need help"
↓
System: Can't extract topic → subject="General", topic="General Learning"
↓
Allow first 3 messages to discover actual topic
↓
After 3 messages: Re-evaluate topic from conversation history
```

### Case 2: Multiple Topics in One Message
```
User: "Explain calculus derivatives and quantum physics"
↓
Extract keywords: [calculus, derivatives, quantum, physics]
↓
Find dominant subject: Math (2 keywords) vs Physics (2 keywords)
↓
Use first mentioned: "calculus derivatives"
↓
Store secondary topic for later: "quantum physics"
```

### Case 3: Topic Evolution
```
Session starts: "derivatives" (broad)
Messages cover: limits, tangent lines, rate of change
↓
Refine topic: "derivatives" → "derivative applications"
↓
Update session topic based on covered concepts
```

### Case 4: User Corrects Topic
```
User: "What is quantum physics?"
System: [topic = quantum physics]
User: "Actually, tell me about classical mechanics"
↓
Detect topic switch intention
↓
Offer: "Switch to classical mechanics or continue quantum physics?"
```

## Configuration

### Discovery Phase Length
```typescript
const DISCOVERY_PHASE_MESSAGES = 3; // First 3 messages

// Adjust based on testing:
// - Longer (5): More flexible, slower focus
// - Shorter (2): Faster focus, might miss context
```

### Topic Match Threshold
```typescript
const EXISTING_COURSE_MATCH_THRESHOLD = 0.7; // 70% similarity

// Higher (0.8): Stricter matching, fewer false positives
// Lower (0.6): More matches, might link to wrong course
```

### Subject Classification Keywords
```typescript
// Expand as needed
const SUBJECT_KEYWORDS = {
  Mathematics: ['calc', 'algebra', 'trig', 'geo', 'stat'],
  Physics: ['quantum', 'mechanics', 'relativity', 'optics'],
  // ... more subjects
};
```

## Testing Scenarios

### Test 1: First-Time User
```
✅ Enter Learn tab without topic
✅ Ask "What is calculus?"
✅ System discovers topic
✅ Follow-up questions work
✅ After 3 messages, moderation enables
```

### Test 2: Enrolled Student
```
✅ Enrolled in "Physics 101"
✅ Ask "Explain ray optics"
✅ System links to Physics 101
✅ Progress tracked
✅ Topic stays focused on optics
```

### Test 3: Topic Drift
```
✅ Start with "quantum physics"
✅ Ask about "quantum tunneling" (related) ✅
✅ Ask about "chemical reactions" (unrelated) ❌ blocked
✅ System offers to switch topics
```

### Test 4: Context Retention
```
✅ Discovery phase (messages 1-3)
✅ Build conversation context
✅ After message 4, contextual references work
✅ "Tell me more about it" understood
```

## Database Schema Updates

### ChatSession Model
```typescript
interface ChatSession {
  // ... existing fields ...
  context: {
    // ... existing fields ...
    messageCount: number;           // NEW: Track message count
    discoveredTopic: boolean;       // NEW: Flag for auto-discovery
    topicConfidence: number;        // NEW: How sure are we about topic?
    potentialTopics: string[];      // NEW: Alternative topics detected
  }
}
```

## Migration Path

### Phase 1: Add Discovery Service (Week 1)
- Create `topicDiscovery.service.ts`
- Add topic extraction logic
- Test with various messages

### Phase 2: Integrate with Chat (Week 2)
- Update chat.routes.ts
- Add discovery phase logic
- Update database schema

### Phase 3: Course Matching (Week 3)
- Implement course search
- Add auto-linking
- Test with enrolled students

### Phase 4: Refinement (Week 4)
- Tune thresholds
- Add more subject patterns
- User testing and feedback

## Success Metrics

- **Reduced Blocks**: <5% of discovery phase messages blocked
- **Accurate Matching**: >80% of auto-linked courses are correct
- **User Satisfaction**: Users don't complain about early blocking
- **Topic Focus**: After discovery, >90% on-topic conversations

---

**Status**: 🎯 Proposed Solution
**Priority**: HIGH - Fixes critical UX issue
**Estimated Effort**: 2-3 weeks for full implementation
**Impact**: Dramatically improves Learn section experience
