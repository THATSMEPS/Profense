import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, ExternalLink, CheckCircle, Clock } from 'lucide-react';
import { Topic } from '../../types';
import { Button } from '../ui/Button';
import ReactMarkdown from 'react-markdown';

interface TopicViewerProps {
  courseId: string;
  topics: Topic[];
  currentTopicIndex: number;
  onTopicChange: (index: number) => void;
  onMarkComplete?: (topicId: string) => void;
  onClose?: () => void;
}

export const TopicViewer: React.FC<TopicViewerProps> = ({
  courseId,
  topics,
  currentTopicIndex,
  onTopicChange,
  onMarkComplete,
  onClose
}) => {
  const [topic, setTopic] = useState<Topic>(topics[currentTopicIndex]);
  const [isCompleted, setIsCompleted] = useState(topic.completed);

  useEffect(() => {
    setTopic(topics[currentTopicIndex]);
    setIsCompleted(topics[currentTopicIndex].completed);
  }, [currentTopicIndex, topics]);

  const handlePrevious = () => {
    if (currentTopicIndex > 0) {
      onTopicChange(currentTopicIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentTopicIndex < topics.length - 1) {
      onTopicChange(currentTopicIndex + 1);
    }
  };

  const handleMarkComplete = () => {
    if (onMarkComplete) {
      onMarkComplete(topic.id);
      setIsCompleted(true);
    }
  };

  // Default content if topic.content is not available
  const defaultContent = `
# ${topic.title}

## Overview
This topic covers the fundamentals of **${topic.title}**. 

## Key Concepts
- Understanding the basic principles
- Exploring practical applications
- Mastering essential techniques

## Learning Objectives
By the end of this topic, you will be able to:
1. Understand the core concepts
2. Apply knowledge to solve problems
3. Demonstrate mastery through practice

## Duration
Estimated time: ${topic.duration}

---

*Use the AI chat to ask questions and dive deeper into this topic!*
  `.trim();

  const content = (topic as any).content || defaultContent;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="text-blue-600" size={20} />
            <span className="text-sm font-medium text-gray-500">
              Topic {currentTopicIndex + 1} of {topics.length}
            </span>
          </div>
          {isCompleted && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle size={16} />
              <span>Completed</span>
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{topic.title}</h2>
        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
          <Clock size={14} />
          <span>{topic.duration}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTopicIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="p-6 max-w-4xl mx-auto"
          >
            {/* Main Content */}
            <div className="prose prose-blue max-w-none mb-8">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>

            {/* Subtopics */}
            {topic.subtopics && topic.subtopics.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Topics Covered</h3>
                <div className="space-y-2">
                  {topic.subtopics.map((subtopic) => (
                    <div
                      key={subtopic.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        subtopic.completed
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {subtopic.completed ? (
                        <CheckCircle className="text-green-600" size={18} />
                      ) : (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300" />
                      )}
                      <span
                        className={`flex-1 ${
                          subtopic.completed ? 'text-green-800' : 'text-gray-700'
                        }`}
                      >
                        {subtopic.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resources (if available) */}
            {(topic as any).resources && (topic as any).resources.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
                <div className="space-y-2">
                  {(topic as any).resources.map((resource: any, index: number) => (
                    <a
                      key={index}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <ExternalLink className="text-blue-600" size={18} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{resource.title}</div>
                        {resource.description && (
                          <div className="text-sm text-gray-600">{resource.description}</div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentTopicIndex === 0}
            icon={ChevronLeft}
          >
            Previous
          </Button>

          {!isCompleted && onMarkComplete && (
            <Button
              onClick={handleMarkComplete}
              className="bg-green-600 hover:bg-green-700"
              icon={CheckCircle}
            >
              Mark as Complete
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentTopicIndex === topics.length - 1}
          >
            <span className="flex items-center gap-2">
              Next
              <ChevronRight size={16} />
            </span>
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mt-4">
          <div className="flex items-center gap-1">
            {topics.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index === currentTopicIndex
                    ? 'bg-blue-600'
                    : index < currentTopicIndex
                    ? 'bg-green-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
