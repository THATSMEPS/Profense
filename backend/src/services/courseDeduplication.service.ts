import { Course } from '../models/Course';
import { logger } from '../utils/logger';

/**
 * Service to prevent duplicate courses and topics in the database
 */

/**
 * Calculate similarity score between two strings (0 to 1)
 * Uses Jaccard similarity on word sets
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2); // Remove short words
  };

  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  if (words1.size === 0 && words2.size === 0) return 1;
  if (words1.size === 0 || words2.size === 0) return 0;

  // Calculate Jaccard similarity
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Check if a course with similar title/subject/topic already exists
 */
export async function findSimilarCourse(
  title: string,
  subject: string,
  difficulty: string
): Promise<{
  exists: boolean;
  similarCourse?: any;
  similarityScore?: number;
  reason?: string;
}> {
  try {
    // First, try exact match (case-insensitive)
    const exactMatch = await Course.findOne({
      title: { $regex: new RegExp(`^${title}$`, 'i') },
      subject: { $regex: new RegExp(`^${subject}$`, 'i') },
      isActive: true
    });

    if (exactMatch) {
      logger.info(`Exact course match found: ${exactMatch.title}`);
      return {
        exists: true,
        similarCourse: exactMatch,
        similarityScore: 1.0,
        reason: 'Exact match: Course with same title and subject already exists'
      };
    }

    // Find courses in the same subject
    const coursesInSubject = await Course.find({
      subject: { $regex: new RegExp(subject, 'i') },
      isActive: true
    }).lean();

    if (coursesInSubject.length === 0) {
      return { exists: false };
    }

    // Calculate similarity with each course
    const SIMILARITY_THRESHOLD = 0.7; // 70% similarity threshold

    for (const existingCourse of coursesInSubject) {
      const titleSimilarity = calculateTextSimilarity(title, existingCourse.title);

      if (titleSimilarity >= SIMILARITY_THRESHOLD) {
        logger.info(
          `Similar course found: "${existingCourse.title}" (${Math.round(titleSimilarity * 100)}% similar to "${title}")`
        );

        return {
          exists: true,
          similarCourse: existingCourse,
          similarityScore: titleSimilarity,
          reason: `Course "${existingCourse.title}" is ${Math.round(titleSimilarity * 100)}% similar`
        };
      }
    }

    return { exists: false };
  } catch (error) {
    logger.error('Error checking for similar courses:', error);
    throw error;
  }
}

/**
 * Check if a topic already exists in a course
 */
export function findSimilarTopicInCourse(
  topicTitle: string,
  existingTopics: Array<{ title: string }>
): {
  exists: boolean;
  similarTopic?: { title: string };
  similarityScore?: number;
  reason?: string;
} {
  const TOPIC_SIMILARITY_THRESHOLD = 0.75; // 75% similarity for topics

  for (const existingTopic of existingTopics) {
    // Check exact match first
    if (existingTopic.title.toLowerCase() === topicTitle.toLowerCase()) {
      return {
        exists: true,
        similarTopic: existingTopic,
        similarityScore: 1.0,
        reason: `Topic "${existingTopic.title}" already exists in this course`
      };
    }

    // Check similarity
    const similarity = calculateTextSimilarity(topicTitle, existingTopic.title);
    if (similarity >= TOPIC_SIMILARITY_THRESHOLD) {
      return {
        exists: true,
        similarTopic: existingTopic,
        similarityScore: similarity,
        reason: `Topic "${existingTopic.title}" is ${Math.round(similarity * 100)}% similar`
      };
    }
  }

  return { exists: false };
}

/**
 * Find an existing course that can accommodate new topics instead of creating a new course
 */
export async function findCourseToExtend(
  subject: string,
  difficulty: string,
  newTopics: string[]
): Promise<{
  canExtend: boolean;
  course?: any;
  reason?: string;
}> {
  try {
    // Find courses with same subject and difficulty
    const candidateCourses = await Course.find({
      subject: { $regex: new RegExp(`^${subject}$`, 'i') },
      difficulty: difficulty.toLowerCase(),
      isActive: true
    }).lean();

    if (candidateCourses.length === 0) {
      return { canExtend: false };
    }

    // Check each course to see if it can be extended
    for (const course of candidateCourses) {
      const existingTopicTitles = course.topics.map(t => t.title);
      
      // Check how many new topics are actually new (not duplicates)
      let trulyNewTopics = 0;
      for (const newTopic of newTopics) {
        const check = findSimilarTopicInCourse(newTopic, course.topics);
        if (!check.exists) {
          trulyNewTopics++;
        }
      }

      // If there are some new topics that can be added
      if (trulyNewTopics > 0 && trulyNewTopics < newTopics.length) {
        logger.info(
          `Course "${course.title}" can be extended with ${trulyNewTopics} new topics`
        );
        return {
          canExtend: true,
          course: course,
          reason: `Course "${course.title}" already covers ${newTopics.length - trulyNewTopics} topics. Can add ${trulyNewTopics} new topics.`
        };
      }
    }

    return { canExtend: false };
  } catch (error) {
    logger.error('Error finding course to extend:', error);
    throw error;
  }
}

/**
 * Main function: Check before creating a new course
 */
export async function checkBeforeCourseCreation(
  title: string,
  subject: string,
  difficulty: string,
  topics: Array<{ title: string; [key: string]: any }>
): Promise<{
  shouldCreate: boolean;
  existingCourse?: any;
  action: 'create_new' | 'use_existing' | 'extend_existing';
  message: string;
  newTopicsToAdd?: string[];
}> {
  try {
    // Step 1: Check for similar course
    const similarCourseCheck = await findSimilarCourse(title, subject, difficulty);

    if (similarCourseCheck.exists) {
      logger.info(`Similar course exists: ${similarCourseCheck.similarCourse.title}`);
      
      return {
        shouldCreate: false,
        existingCourse: similarCourseCheck.similarCourse,
        action: 'use_existing',
        message: `${similarCourseCheck.reason}. Using existing course instead of creating duplicate.`
      };
    }

    // Step 2: Check if we can extend an existing course with these topics
    const topicTitles = topics.map(t => t.title);
    const extendCheck = await findCourseToExtend(subject, difficulty, topicTitles);

    if (extendCheck.canExtend && extendCheck.course) {
      // Find which topics are actually new
      const newTopics = topicTitles.filter(newTitle => {
        const check = findSimilarTopicInCourse(newTitle, extendCheck.course.topics);
        return !check.exists;
      });

      logger.info(`Can extend course "${extendCheck.course.title}" with new topics`);

      return {
        shouldCreate: false,
        existingCourse: extendCheck.course,
        action: 'extend_existing',
        message: extendCheck.reason || 'Course can be extended with new topics',
        newTopicsToAdd: newTopics
      };
    }

    // Step 3: No similar course found, safe to create new
    logger.info(`No similar course found. Safe to create: "${title}"`);
    
    return {
      shouldCreate: true,
      action: 'create_new',
      message: 'No duplicate found. Creating new course.'
    };

  } catch (error) {
    logger.error('Error in course deduplication check:', error);
    throw error;
  }
}
