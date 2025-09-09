import { Quiz, Course } from '../types';

export const mockQuiz: Quiz = {
  id: '1',
  title: 'Calculus Derivatives Quiz',
  subject: 'Mathematics',
  timeLimit: 1800, // 30 minutes
  questions: [
    {
      id: '1',
      type: 'multiple-choice',
      question: 'What is the derivative of f(x) = 3x² + 2x - 5?',
      options: ['6x + 2', '6x - 2', '3x + 2', '6x² + 2x'],
      correctAnswer: '6x + 2',
      explanation: 'Using the power rule: d/dx(3x²) = 6x, d/dx(2x) = 2, and d/dx(-5) = 0. Therefore, f\'(x) = 6x + 2.'
    },
    {
      id: '2',
      type: 'numerical',
      question: 'Find the derivative of f(x) = x³ at x = 2. Enter the numerical value.',
      correctAnswer: 12,
      explanation: 'f\'(x) = 3x², so f\'(2) = 3(2)² = 3(4) = 12.'
    },
    {
      id: '3',
      type: 'multiple-choice',
      question: 'Which rule would you use to find the derivative of f(x) = sin(2x)?',
      options: ['Product Rule', 'Chain Rule', 'Quotient Rule', 'Power Rule'],
      correctAnswer: 'Chain Rule',
      explanation: 'Since 2x is inside the sine function, we need the chain rule to differentiate the composite function.'
    },
    {
      id: '4',
      type: 'text',
      question: 'Explain the geometric interpretation of a derivative at a point.',
      correctAnswer: 'The derivative at a point represents the slope of the tangent line to the curve at that point.',
      explanation: 'Geometrically, the derivative gives us the instantaneous rate of change, which corresponds to the slope of the tangent line at that specific point on the curve.'
    }
  ]
};

export const mockCourse: Course = {
  id: '1',
  title: 'Calculus I: Limits and Derivatives',
  description: 'Master the fundamentals of calculus with comprehensive lessons on limits and derivatives.',
  subject: 'Mathematics',
  difficulty: 'intermediate',
  duration: '12 hours',
  progress: 65,
  topics: [
    {
      id: '1',
      title: 'Introduction to Limits',
      completed: true,
      duration: '45 min',
      subtopics: [
        { id: '1-1', title: 'What are limits?', completed: true },
        { id: '1-2', title: 'Graphical interpretation', completed: true },
        { id: '1-3', title: 'Limit laws', completed: true }
      ]
    },
    {
      id: '2',
      title: 'Derivatives Fundamentals',
      completed: true,
      duration: '60 min',
      subtopics: [
        { id: '2-1', title: 'Definition of derivative', completed: true },
        { id: '2-2', title: 'Basic differentiation rules', completed: true },
        { id: '2-3', title: 'Chain rule', completed: false }
      ]
    },
    {
      id: '3',
      title: 'Applications of Derivatives',
      completed: false,
      duration: '75 min',
      subtopics: [
        { id: '3-1', title: 'Rate of change', completed: false },
        { id: '3-2', title: 'Optimization problems', completed: false }
      ]
    }
  ],
  thumbnail: 'https://images.pexels.com/photos/6238021/pexels-photo-6238021.jpeg'
};