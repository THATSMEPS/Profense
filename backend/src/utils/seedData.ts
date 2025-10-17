import { User } from '../models/User';
import { Course } from '../models/Course';
import { Quiz } from '../models/Quiz';
import { logger } from './logger';

export const seedDatabase = async () => {
  try {
    // Check if data already exists
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    
    if (userCount > 0 && courseCount > 0) {
      logger.info('Database already seeded');
      return;
    }

    // Create sample users
    const sampleUsers = [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        educationLevel: 'college',
        preferredSubjects: ['Mathematics', 'Physics'],
        learningPreferences: {
          teachingMode: 'normal',
          preferredLanguage: 'english',
          learningPace: 'normal'
        }
      },
      {
        name: 'Jane Smith', 
        email: 'jane@example.com',
        password: 'password123',
        educationLevel: 'high',
        preferredSubjects: ['Chemistry', 'Biology'],
        learningPreferences: {
          teachingMode: 'beginner',
          preferredLanguage: 'english',
          learningPace: 'slow'
        }
      }
    ];

    // Create sample courses
    const sampleCourses = [
      {
        title: 'Calculus Fundamentals',
        description: 'Master the basics of differential and integral calculus',
        subject: 'Mathematics',
        difficulty: 'intermediate',
        estimatedDuration: 480, // 8 hours
        topics: [
          {
            title: 'Introduction to Limits',
            description: 'Understanding the concept of limits',
            content: 'Limits are fundamental to calculus...',
            duration: 60,
            difficulty: 'beginner',
            subtopics: [
              {
                title: 'What are limits?',
                content: 'A limit describes the value that a function approaches...',
                examples: ['lim x→0 (sin x)/x = 1'],
                practiceQuestions: ['Calculate lim x→2 (x² - 4)/(x - 2)']
              }
            ],
            resources: [
              {
                type: 'video',
                title: 'Introduction to Limits Video',
                url: 'https://example.com/limits-video',
                description: 'Visual explanation of limits'
              }
            ],
            order: 1,
            prerequisites: []
          }
        ],
        prerequisites: ['Algebra', 'Trigonometry'],
        learningObjectives: ['Understand limits', 'Calculate derivatives', 'Solve integrals'],
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=300',
        isActive: true,
        createdBy: 'ai'
      }
    ];

    // Insert data
    if (userCount === 0) {
      await User.insertMany(sampleUsers);
      logger.info('Sample users created');
    }

    if (courseCount === 0) {
      await Course.insertMany(sampleCourses);
      logger.info('Sample courses created');
    }

    logger.info('Database seeded successfully');
  } catch (error) {
    logger.error('Error seeding database:', error);
  }
};