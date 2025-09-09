import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, PlayCircle } from 'lucide-react';
import { Course } from '../../types';

interface CourseOutlineProps {
  course: Course;
}

export const CourseOutline: React.FC<CourseOutlineProps> = ({ course }) => {
  const mockTopics = [
    {
      id: '1',
      title: 'Introduction to Limits',
      completed: true,
      duration: '45 min',
      subtopics: [
        { id: '1-1', title: 'What are limits?', completed: true },
        { id: '1-2', title: 'Graphical interpretation', completed: true },
        { id: '1-3', title: 'Limit laws', completed: false }
      ]
    },
    {
      id: '2',
      title: 'Derivatives Fundamentals',
      completed: false,
      duration: '60 min',
      subtopics: [
        { id: '2-1', title: 'Definition of derivative', completed: false },
        { id: '2-2', title: 'Basic differentiation rules', completed: false },
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
  ];

  const overallProgress = Math.round(
    (mockTopics.filter(t => t.completed).length / mockTopics.length) * 100
  );

  return (
    <div className="h-full flex flex-col">
      {/* Course Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-bold text-gray-900 mb-2">{course.title}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
          <Clock size={14} />
          <span>{course.duration} total</span>
        </div>
        
        <div className="bg-gray-200 rounded-full h-2 mb-2">
          <motion.div
            className="bg-blue-600 rounded-full h-2"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-xs text-gray-500">{overallProgress}% Complete</p>
      </div>

      {/* Topics List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mockTopics.map((topic, index) => (
          <motion.div
            key={topic.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
              topic.completed 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 bg-white hover:border-blue-300'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {topic.completed ? (
                <CheckCircle className="text-green-600" size={18} />
              ) : (
                <Circle className="text-gray-400" size={18} />
              )}
              <h4 className={`font-medium flex-1 ${
                topic.completed ? 'text-green-800' : 'text-gray-900'
              }`}>
                {topic.title}
              </h4>
              <PlayCircle className="text-gray-400" size={16} />
            </div>
            
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Clock size={12} />
              <span>{topic.duration}</span>
            </div>

            {/* Subtopics */}
            {topic.subtopics && (
              <div className="ml-6 space-y-1">
                {topic.subtopics.map(subtopic => (
                  <div key={subtopic.id} className="flex items-center gap-2 text-sm">
                    {subtopic.completed ? (
                      <CheckCircle className="text-green-500" size={14} />
                    ) : (
                      <Circle className="text-gray-300" size={14} />
                    )}
                    <span className={subtopic.completed ? 'text-green-700' : 'text-gray-600'}>
                      {subtopic.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Mode Indicators */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Teaching Level:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              teachingMode === 'beginner' ? 'bg-green-100 text-green-600' :
              teachingMode === 'normal' ? 'bg-blue-100 text-blue-600' :
              'bg-orange-100 text-orange-600'
            }`}>
              {teachingMode}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Mode:</span>
            <span className="text-blue-600 font-medium capitalize">{learningMode}</span>
          </div>
        </div>
      </div>
    </div>
  );
};