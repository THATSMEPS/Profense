import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock, PlayCircle, Check } from 'lucide-react';
import { Course } from '../../types';
import { useApp } from '../../context/AppContext';
import { courseService } from '../../services/courseService';

interface CourseOutlineProps {
  course: Course;
}

interface TopicProgress {
  topicId: string;
  status: 'not-started' | 'in-progress' | 'completed';
  masteryLevel: number;
  activitiesCompleted: {
    contentRead: boolean;
    chatDiscussed: boolean;
    practiceDone: boolean;
    quizPassed: boolean;
  };
  completedAt?: Date;
  timeSpent: number;
}

export const CourseOutline: React.FC<CourseOutlineProps> = ({ course }) => {
  const { teachingMode, learningMode } = useApp();
  const [topicProgress, setTopicProgress] = useState<Record<string, TopicProgress>>({});
  const [progressPercentage, setProgressPercentage] = useState(0);

  // Fetch topic progress on mount
  useEffect(() => {
    fetchTopicProgress();
  }, [course.id]);

  const fetchTopicProgress = async () => {
    try {
      const data = await courseService.getTopicProgress(course.id);
      
      // Convert array to map for easy lookup
      const progressMap: Record<string, TopicProgress> = {};
      data.topics.forEach((tp: any) => {
        progressMap[tp.topicId] = tp;
      });
      
      setTopicProgress(progressMap);
      setProgressPercentage(data.progressPercentage);
    } catch (error) {
      console.error('Failed to fetch topic progress:', error);
    }
  };

  const handleTopicClick = async (topicId: string) => {
    const progress = topicProgress[topicId];
    
    // If not started, mark as started
    if (!progress || progress.status === 'not-started') {
      try {
        await courseService.markTopicAsStarted(course.id, topicId);
        await fetchTopicProgress(); // Refresh data
      } catch (error) {
        console.error('Failed to start topic:', error);
      }
    }
  };

  const handleMarkComplete = async (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation();
    
    try {
      await courseService.markTopicAsCompleted(course.id, topicId);
      await fetchTopicProgress(); // Refresh data
    } catch (error) {
      console.error('Failed to complete topic:', error);
    }
  };

  const getTopicStatus = (topicId: string) => {
    const progress = topicProgress[topicId];
    if (!progress) return 'not-started';
    return progress.status;
  };

  const isTopicCompleted = (topicId: string) => {
    return getTopicStatus(topicId) === 'completed';
  };

  const getTopicMastery = (topicId: string) => {
    const progress = topicProgress[topicId];
    return progress?.masteryLevel || 0;
  };

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
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="text-xs text-gray-500">
          {progressPercentage}% Complete • {course.topics.filter(t => isTopicCompleted(t.id)).length}/{course.topics.length} topics
        </p>
      </div>

      {/* Topics List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {course.topics.map((topic, index) => {
          const status = getTopicStatus(topic.id);
          const completed = isTopicCompleted(topic.id);
          const mastery = getTopicMastery(topic.id);
          
          return (
            <motion.div
              key={topic.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => handleTopicClick(topic.id)}
              className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${
                completed 
                  ? 'border-green-200 bg-green-50' 
                  : status === 'in-progress'
                  ? 'border-blue-200 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                {completed ? (
                  <CheckCircle className="text-green-600" size={18} />
                ) : status === 'in-progress' ? (
                  <PlayCircle className="text-blue-600" size={18} />
                ) : (
                  <Circle className="text-gray-400" size={18} />
                )}
                <h4 className={`font-medium flex-1 ${
                  completed ? 'text-green-800' : status === 'in-progress' ? 'text-blue-800' : 'text-gray-900'
                }`}>
                  {topic.title}
                </h4>
                
                {/* Mark Complete Button */}
                {status === 'in-progress' && !completed && (
                  <button
                    onClick={(e) => handleMarkComplete(e, topic.id)}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <Check size={12} />
                    Complete
                  </button>
                )}
                
                {/* Mastery Badge */}
                {completed && mastery > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    mastery >= 75 ? 'bg-green-100 text-green-700' :
                    mastery >= 50 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {mastery}% mastery
                  </span>
                )}
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
          );
        })}
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
