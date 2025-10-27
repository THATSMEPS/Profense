# Dashboard Statistics Update

## Overview
Updated the Dashboard component to display **real data from the database** instead of showing all zeros. The system now fetches actual user statistics from Quiz attempts, Chat sessions, and Course enrollments.

## Changes Made

### 1. Backend: Enhanced `/api/users/stats` Endpoint
**File**: `backend/src/routes/user.routes.ts`

#### Real Data Sources:
- ✅ **Quiz Statistics**: Fetches all user's quiz attempts from Quiz collection
  - Total quiz attempts count
  - Completed quizzes count
  - Average score calculation (sum of all scores / completed quizzes)

- ✅ **Learning Time**: Calculated from ChatSession collection
  - Base: User's `totalLearningTime` field
  - Added: Estimated time from chat session durations
  - Logic: (lastMessage.timestamp - firstMessage.timestamp) in minutes
  - Safety: Capped at 120 minutes per session to avoid outliers

- ✅ **Courses Completed**: From User's enrolled courses
  - Checks each enrolled course for completion status
  - Counts courses with 100% completion percentage

- ✅ **Weekly Progress**: From ChatSession activity
  - Counts sessions in last 7 days (thisWeek)
  - Counts sessions 7-14 days ago (lastWeek)
  - Calculates percentage change

- ✅ **Subject Breakdown**: From ChatSession subjects
  - Groups sessions by subject
  - Counts number of sessions per subject

#### Response Structure:
```typescript
{
  success: true,
  data: {
    totalStudyTime: number,        // Total minutes
    streakDays: number,             // Consecutive days
    achievements: string[],         // Earned achievements
    learningLevel: string,          // beginner/normal/advanced
    coursesCompleted: number,       // Courses at 100%
    quizzesTaken: number,          // Total quiz attempts
    averageScore: number,          // Average quiz score %
    weeklyProgress: {
      thisWeek: number,            // Sessions this week
      lastWeek: number,            // Sessions last week
      change: number               // Percentage change
    },
    subjectBreakdown: {            // Sessions per subject
      [subject: string]: number
    },
    enrolledCourses: number,       // Total enrolled
    preferredSubjects: string[],   // User preferences
    joinedDate: Date,
    lastActive: Date
  }
}
```

### 2. Backend: Enhanced `/api/courses/enrolled` Endpoint
**File**: `backend/src/routes/course.routes.ts`

#### Progress Calculation:
- Fetches user's ChatSessions for each enrolled course
- Extracts covered topics from:
  - `session.currentTopic`
  - `session.conceptsCovered[]`
- Matches against course topics (case-insensitive)
- Calculates progress: (completedTopics / totalTopics) * 100

#### Time Tracking:
- Calculates time spent per course from session durations
- Caps at 60 minutes per session
- Aggregates total time across all sessions

#### Enhanced Response:
```typescript
{
  courses: [{
    ...courseData,
    progress: number,              // 0-100%
    completedTopics: number,       // Count
    totalTopics: number,           // Total
    timeSpent: number,             // Minutes
    lastAccessed: Date             // Last activity
  }]
}
```

### 3. Frontend: Dashboard Component
**File**: `src/components/dashboard/Dashboard.tsx`

#### Stats Display (No Changes Needed):
The component already properly displays the data:
- **Courses Completed**: Shows `userStats.coursesCompleted`
- **Hours Learned**: Converts minutes to hours `Math.round(totalStudyTime / 60)`
- **Quiz Score Avg**: Shows `Math.round(averageScore)%`
- **Current Streak**: Shows `streakDays` with proper singular/plural handling

#### Data Flow:
1. `loadDashboardData()` calls `userService.getUserStats()`
2. Backend calculates real statistics from database
3. Frontend displays the values in stat cards

## Testing Checklist

### To Verify Dashboard Stats:
1. ✅ **Take a Quiz**:
   - Complete a quiz with a score (e.g., 80%)
   - Dashboard should show: `quizzesTaken: 1`, `averageScore: 80`

2. ✅ **Have Chat Sessions**:
   - Start a chat session on a subject (e.g., Physics)
   - Send multiple messages
   - Dashboard should show increased `totalStudyTime`
   - `subjectBreakdown` should include Physics

3. ✅ **Enroll in Courses**:
   - Enroll in a course
   - Have chat sessions on topics within that course
   - Dashboard should show course progress > 0%

4. ✅ **Login Daily**:
   - Login on consecutive days
   - Dashboard should show `streakDays` incrementing

5. ✅ **Complete a Course**:
   - Cover all topics in a course (100% progress)
   - Dashboard should show `coursesCompleted: 1`

## Database Collections Used

### 1. Users Collection
- `totalLearningTime`: Base learning time
- `streakDays`: Consecutive login days
- `achievements`: Array of earned badges
- `enrolledCourses`: Array of Course ObjectIds
- `preferredSubjects`: User's subject preferences

### 2. Quiz Collection
- `attempts[]`: Array of quiz attempts per user
  - `userId`: User reference
  - `score`: Score achieved (0-100)
  - `completed`: Boolean flag

### 3. ChatSession Collection
- `userId`: Session owner
- `subject`: Course subject
- `currentTopic`: Active topic
- `conceptsCovered[]`: Array of covered concepts
- `messages[]`: Chat history with timestamps
- `sessionStatus`: active/completed/archived
- `lastActivity`: Last message timestamp

### 4. Course Collection
- `subject`: Course subject
- `topics[]`: Array of topics
- `isActive`: Boolean flag
- Course methods:
  - `getProgressForUser(completedTopics)`
  - `getNextTopic(completedTopics)`

## Important Notes

### Current Limitations:
1. **Progress Tracking**: Based on chat session topics, not explicit completion markers
   - May show progress even if user didn't fully master the topic
   - Future: Add explicit "Mark as Complete" feature

2. **Time Estimation**: Calculated from message timestamps
   - May not reflect actual study time if user left tab open
   - Capped at 120 min/session to avoid inflation

3. **Course Completion**: Requires 100% topic coverage
   - Detected through chat session topics
   - May need manual verification for accuracy

### Future Enhancements:
- [ ] Add explicit "Mark Topic Complete" button in chat
- [ ] Track time with active tab detection
- [ ] Add course completion certificates
- [ ] Badge system for achievements
- [ ] Leaderboard integration
- [ ] Study time recommendations
- [ ] Progress notifications

## API Endpoints Summary

### User Stats
```
GET /api/users/stats
Authorization: Bearer <token>
Response: Real user statistics
```

### Enrolled Courses
```
GET /api/courses/enrolled
Authorization: Bearer <token>
Response: Courses with progress data
```

### Recommended Courses
```
GET /api/courses/recommended
Authorization: Bearer <token>
Response: Personalized recommendations
```

## Verification Commands

### Check User Stats in Database:
```javascript
// MongoDB shell
db.users.findOne({ email: "user@example.com" })
db.chatsessions.find({ userId: ObjectId("...") }).count()
db.quizzes.find({ "attempts.userId": ObjectId("...") })
```

### Test API Response:
```bash
# Get user stats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/users/stats

# Get enrolled courses
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/courses/enrolled
```

## Success Criteria
✅ Dashboard shows real quiz scores when quizzes are completed
✅ Dashboard shows actual learning time from chat sessions  
✅ Dashboard shows correct enrolled course count
✅ Dashboard shows course completion progress
✅ Dashboard shows streak days (starts at 0, increments with daily logins)
✅ All stats update in real-time when user takes actions

## Related Files
- `backend/src/routes/user.routes.ts` - User stats endpoint
- `backend/src/routes/course.routes.ts` - Course enrollment with progress
- `backend/src/models/User.ts` - User schema with learning data
- `backend/src/models/Quiz.ts` - Quiz attempts and scores
- `backend/src/models/ChatSession.ts` - Learning sessions and topics
- `backend/src/models/Course.ts` - Course structure and progress
- `src/components/dashboard/Dashboard.tsx` - Frontend display
- `src/services/userService.ts` - API client for user data
- `src/services/courseService.ts` - API client for courses

---

**Last Updated**: Current session  
**Status**: ✅ Fully Implemented and Ready for Testing
