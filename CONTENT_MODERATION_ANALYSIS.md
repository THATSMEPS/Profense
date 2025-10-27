# Content Moderation System - Current State & Enhancements Needed

## 📅 Date: October 26, 2025

---

## ✅ WHAT IS CURRENTLY IMPLEMENTED

### **1. Basic Content Moderation (Active)**

**Location:** `backend/src/services/enhanced-ai.service.ts` & `backend/src/routes/chat.routes.ts`

#### **Current Protection:**

✅ **Blocks Explicitly Inappropriate Content:**
- Sexual/explicit content
- Violence, harm, suicide
- Illegal activities (drugs, weapons)
- Hate speech, racist content

```typescript
const explicitlyInappropriatePatterns = [
  /\b(explicit|pornographic|sexual|nude|xxx)\b/i,
  /\b(violence|kill|murder|harm|suicide|self[-\s]harm)\b/i,
  /\b(illegal|drugs|cocaine|heroin|marijuana sale|weapon)\b/i,
  /\b(hate speech|racist|discrimination|offensive slur)\b/i
];
```

✅ **Allows Educational Content:**
- Math, science, physics, chemistry questions
- Programming, computer science topics
- History, literature, engineering
- General questions with "explain", "how", "why"

#### **UI Component:**
- **`src/components/chat/ModerationAlert.tsx`** - Shows warning when content is blocked
- Displays reasoning
- Suggests alternative questions
- Shows available learning topics

---

### **2. Google Gemini Safety Settings (Active)**

**Location:** `backend/src/services/ai.service.ts`

```typescript
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  }
];
```

**⚠️ NOTE:** Currently set to `BLOCK_NONE` to prevent false positives on educational content like biology, chemistry, etc.

---

## ❌ WHAT IS MISSING

### **1. NO Topic Focus/Distraction Prevention**

**Problem:** User can ask about **any** educational topic at any time.

**Example Scenario:**
```
User is learning: "Ray Optics in Physics"
User asks: "Explain calculus derivatives"
System response: ✅ Allows and answers calculus question

Expected: ❌ Should warn and keep user on Ray Optics topic
```

**Current Behavior:**
- ✅ Blocks inappropriate content
- ❌ Does NOT keep user on current topic
- ❌ Does NOT detect topic shifts
- ❌ Does NOT encourage staying focused

---

### **2. NO Session Topic Tracking**

**Current State:**
```typescript
const chatSession = new ChatSession({
  subject: 'Physics',
  currentTopic: 'Ray Optics',  // ← Stored but NOT enforced
  context: {
    sessionType: 'teaching',
    learningObjectives: []
  }
});
```

**Problem:** 
- `currentTopic` is stored but not used for moderation
- User can ask about any topic even if it contradicts `currentTopic`

---

### **3. NO Context-Aware Moderation**

**What We Have:**
- ✅ Basic content filtering (inappropriate vs educational)

**What We DON'T Have:**
- ❌ Topic relevance checking
- ❌ Subject boundary enforcement
- ❌ Distraction detection
- ❌ Focus encouragement

---

## 🎯 RECOMMENDED ENHANCEMENTS

### **Enhancement 1: Topic-Focused Moderation**

#### **Goal:** Keep user focused on their current learning topic

#### **Implementation Plan:**

1. **Check Topic Relevance** before responding
2. **Calculate Similarity** between question and current topic
3. **Warn User** if switching topics
4. **Suggest Refocus** with relevant questions

#### **Similarity Scoring:**

```typescript
function calculateTopicRelevance(
  question: string,
  currentTopic: string,
  subject: string
): {
  isRelevant: boolean;
  similarityScore: number;
  reasoning: string;
} {
  // Example scores:
  // Question: "Explain refraction of light"
  // Current Topic: "Ray Optics"
  // Subject: "Physics"
  // Score: 0.95 (highly relevant) ✅

  // Question: "What is derivative?"
  // Current Topic: "Ray Optics"
  // Subject: "Physics"
  // Score: 0.15 (not relevant) ❌
}
```

---

### **Enhancement 2: Smart Topic Detection**

#### **Use AI to Detect Topic Shifts:**

```typescript
async function detectTopicShift(
  message: string,
  sessionContext: {
    currentTopic: string;
    subject: string;
    previousMessages: string[];
  }
): Promise<{
  isTopicShift: boolean;
  detectedTopic: string;
  confidence: number;
  shouldWarn: boolean;
}> {
  // AI analyzes message and compares with current topic
}
```

#### **Example Scenarios:**

**Scenario 1: Staying on Topic ✅**
```
Current Topic: "Ray Optics"
User: "What is total internal reflection?"
Detection: Same topic (confidence: 0.92)
Action: Allow and respond normally
```

**Scenario 2: Related Topic (Allow with note) ⚠️**
```
Current Topic: "Ray Optics"
User: "How does wave optics differ from ray optics?"
Detection: Related topic (confidence: 0.75)
Action: Allow but mention "Moving to related topic"
```

**Scenario 3: Unrelated Topic (Warn) ❌**
```
Current Topic: "Ray Optics"
User: "Explain calculus derivatives"
Detection: Different subject (confidence: 0.95)
Action: Warn and suggest staying on topic
```

**Scenario 4: Completely Off-Topic (Block) 🚫**
```
Current Topic: "Ray Optics"
User: "Tell me about World War 2"
Detection: Unrelated subject (confidence: 0.98)
Action: Block and redirect to current topic
```

---

### **Enhancement 3: Smart Moderation Response**

#### **Three-Tier Response System:**

**Tier 1: Allow (Relevance > 70%)**
```
User: "What is Snell's law?" (while studying Ray Optics)
Response: [Normal AI response about Snell's law]
```

**Tier 2: Allow with Gentle Reminder (Relevance 40-70%)**
```
User: "Explain electromagnetic waves" (while studying Ray Optics)
Response: 
"I'll help with electromagnetic waves! This is related to optics.
[AI explains electromagnetic waves]
💡 Remember: We're focusing on Ray Optics. 
Would you like to know how light waves behave in optical systems?"
```

**Tier 3: Soft Block with Redirect (Relevance < 40%)**
```
User: "Teach me calculus derivatives" (while studying Ray Optics)
Response:
"🎯 Let's stay focused on Ray Optics!
I notice you're asking about calculus, which is a different topic.

📚 Your current focus: Ray Optics in Physics

Would you like to:
1. Continue learning about ray diagrams?
2. Explore lens formulas?
3. Understand reflection and refraction?

💡 Tip: Focusing on one topic helps you master it faster!

If you want to learn calculus, I can help you start a new session for that!"
```

---

## 💻 IMPLEMENTATION CODE

### **Step 1: Create Topic Moderation Service**

**File: `backend/src/services/topicModeration.service.ts`**

```typescript
import { logger } from '../utils/logger';

interface TopicContext {
  currentTopic: string;
  subject: string;
  difficulty: string;
  sessionType: string;
}

interface ModerationResult {
  allowed: boolean;
  relevanceScore: number;
  detectedTopic: string;
  actionType: 'allow' | 'remind' | 'redirect';
  message?: string;
  suggestions?: string[];
}

export class TopicModerationService {
  
  /**
   * Check if user's message is relevant to current topic
   */
  async checkTopicRelevance(
    userMessage: string,
    context: TopicContext
  ): Promise<ModerationResult> {
    
    // Extract keywords from current topic
    const topicKeywords = this.extractKeywords(context.currentTopic);
    const subjectKeywords = this.extractKeywords(context.subject);
    
    // Extract keywords from user message
    const messageKeywords = this.extractKeywords(userMessage);
    
    // Calculate relevance score
    const relevanceScore = this.calculateRelevance(
      messageKeywords,
      topicKeywords,
      subjectKeywords
    );
    
    logger.info(`Topic relevance: ${relevanceScore} for message about ${context.currentTopic}`);
    
    // Determine action based on score
    if (relevanceScore >= 0.7) {
      return {
        allowed: true,
        relevanceScore,
        detectedTopic: context.currentTopic,
        actionType: 'allow'
      };
    } else if (relevanceScore >= 0.4) {
      return {
        allowed: true,
        relevanceScore,
        detectedTopic: 'related',
        actionType: 'remind',
        message: this.generateReminder(context),
        suggestions: this.generateSuggestions(context)
      };
    } else {
      return {
        allowed: false,
        relevanceScore,
        detectedTopic: 'unrelated',
        actionType: 'redirect',
        message: this.generateRedirect(context),
        suggestions: this.generateSuggestions(context)
      };
    }
  }
  
  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): Set<string> {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    return new Set(words);
  }
  
  /**
   * Calculate relevance between message and topic
   */
  private calculateRelevance(
    messageKeywords: Set<string>,
    topicKeywords: Set<string>,
    subjectKeywords: Set<string>
  ): number {
    
    // Jaccard similarity for topic
    const topicIntersection = new Set(
      [...messageKeywords].filter(x => topicKeywords.has(x))
    );
    const topicUnion = new Set([...messageKeywords, ...topicKeywords]);
    const topicScore = topicIntersection.size / topicUnion.size;
    
    // Jaccard similarity for subject
    const subjectIntersection = new Set(
      [...messageKeywords].filter(x => subjectKeywords.has(x))
    );
    const subjectUnion = new Set([...messageKeywords, ...subjectKeywords]);
    const subjectScore = subjectIntersection.size / subjectUnion.size;
    
    // Weighted average (topic 70%, subject 30%)
    return (topicScore * 0.7) + (subjectScore * 0.3);
  }
  
  /**
   * Generate gentle reminder message
   */
  private generateReminder(context: TopicContext): string {
    return `I'll help with that! Just a reminder - we're focusing on ${context.currentTopic} in ${context.subject}. Let's keep building on what you're learning!`;
  }
  
  /**
   * Generate redirect message
   */
  private generateRedirect(context: TopicContext): string {
    return `🎯 Let's stay focused on ${context.currentTopic}!

I notice your question might be about a different topic. 

📚 Your current focus: ${context.currentTopic} in ${context.subject}

Staying on topic helps you master concepts faster! Would you like to continue learning about ${context.currentTopic}?`;
  }
  
  /**
   * Generate topic-relevant suggestions
   */
  private generateSuggestions(context: TopicContext): string[] {
    // These would ideally come from the course content
    return [
      `Continue with ${context.currentTopic} examples`,
      `Learn more advanced concepts in ${context.currentTopic}`,
      `Practice problems for ${context.currentTopic}`
    ];
  }
}

// Singleton export
let topicModerationService: TopicModerationService | null = null;

export function getTopicModerationService(): TopicModerationService {
  if (!topicModerationService) {
    topicModerationService = new TopicModerationService();
  }
  return topicModerationService;
}
```

---

### **Step 2: Integrate into Chat Routes**

**File: `backend/src/routes/chat.routes.ts`**

Add before AI response generation:

```typescript
import { getTopicModerationService } from '../services/topicModeration.service';

// In the chat message route:
router.post('/session/:sessionId/message', async (req, res) => {
  const { message } = req.body;
  const session = await ChatSession.findById(req.params.sessionId);
  
  // Step 1: Content moderation (explicit content)
  const contentCheck = await performContentModeration(message);
  if (!contentCheck.approved) {
    return res.json({ 
      blocked: true, 
      reason: contentCheck.reasoning 
    });
  }
  
  // Step 2: Topic relevance check (NEW!)
  const topicModeration = getTopicModerationService();
  const topicCheck = await topicModeration.checkTopicRelevance(message, {
    currentTopic: session.currentTopic,
    subject: session.subject,
    difficulty: session.context.difficulty,
    sessionType: session.context.sessionType
  });
  
  // Step 3: Handle based on relevance
  if (topicCheck.actionType === 'redirect') {
    // Soft block - encourage staying on topic
    return res.json({
      success: true,
      data: {
        aiResponse: {
          content: topicCheck.message,
          confidence: 0.9
        },
        moderation: {
          type: 'topic_redirect',
          relevanceScore: topicCheck.relevanceScore,
          suggestions: topicCheck.suggestions
        }
      }
    });
  }
  
  // Step 4: Generate AI response (optionally with reminder)
  const aiService = getAIService();
  let response = await aiService.generateTeachingResponse(message, context);
  
  if (topicCheck.actionType === 'remind') {
    // Prepend reminder to response
    response.content = topicCheck.message + '\n\n' + response.content;
  }
  
  // Continue with normal flow...
});
```

---

## 📊 COMPARISON: BEFORE vs AFTER

### **BEFORE (Current State)**

| Scenario | User Question | Current Behavior |
|----------|---------------|------------------|
| **On Topic** | "What is Snell's law?" (Ray Optics) | ✅ Answers normally |
| **Related** | "Explain wave optics" (Ray Optics) | ✅ Answers, no warning |
| **Off Topic** | "Teach me calculus" (Ray Optics) | ✅ Answers calculus! |
| **Completely Off** | "History of Rome" (Ray Optics) | ✅ Answers history! |

**Problem:** User can get completely distracted!

---

### **AFTER (With Enhancements)**

| Scenario | User Question | New Behavior |
|----------|---------------|--------------|
| **On Topic** | "What is Snell's law?" (Ray Optics) | ✅ Answers normally |
| **Related** | "Explain wave optics" (Ray Optics) | ✅ Answers + gentle reminder |
| **Off Topic** | "Teach me calculus" (Ray Optics) | ⚠️ Soft redirect to Ray Optics |
| **Completely Off** | "History of Rome" (Ray Optics) | 🚫 Strong redirect to topic |

**Benefit:** User stays focused, learns faster!

---

## 🎯 IMPLEMENTATION PRIORITY

### **Phase 1: Basic Topic Enforcement** ⭐⭐⭐
- [ ] Create `topicModeration.service.ts`
- [ ] Implement keyword-based relevance checking
- [ ] Integrate into chat routes
- [ ] Test with different scenarios
- **Estimated Time:** 4-6 hours

### **Phase 2: AI-Powered Topic Detection** ⭐⭐
- [ ] Use Gemini AI to detect topic shifts
- [ ] Semantic similarity instead of keyword matching
- [ ] Context-aware suggestions
- **Estimated Time:** 6-8 hours

### **Phase 3: Smart Learning Path** ⭐
- [ ] Track learning progress per topic
- [ ] Adaptive difficulty based on focus
- [ ] Rewards for staying on topic
- **Estimated Time:** 8-10 hours

---

## 📝 SUMMARY

### **What You Have:**
✅ Basic content moderation (blocks inappropriate content)
✅ UI component to show moderation alerts
✅ Google Gemini safety settings

### **What You DON'T Have:**
❌ Topic focus enforcement
❌ Distraction prevention
❌ Subject boundary checking
❌ Context-aware moderation

### **What You NEED:**
🎯 Topic relevance checking
🎯 Soft redirects when user goes off-topic
🎯 Gentle reminders to stay focused
🎯 Smart suggestions for current topic

### **Recommendation:**
Implement Phase 1 (Basic Topic Enforcement) first to prevent users from getting distracted while learning Ray Optics or any focused topic.
