import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff, MessageSquare, Brain, Menu, X, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { ChatMessage } from '../../types';
import { CourseOutline } from './CourseOutline';
import { TypingMarkdown } from './TypingMarkdown';
import { ModerationAlert } from './ModerationAlert';
import { enhancedChatService, ModerationAlert as ModerationAlertType } from '../../services/enhancedChatService';
import { userService } from '../../services/userService';

interface ChatInterfaceProps {
  onGenerateQuiz?: (subject?: string, difficulty?: string, topic?: string, chatContext?: string) => void;
  onBack?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onGenerateQuiz, onBack }) => {
  const { 
    chatMessages, 
    addChatMessage, 
    teachingMode, 
    setTeachingMode,
    learningMode, 
    setLearningMode,
    isRecording, 
    setIsRecording,
    sidebarOpen,
    setSidebarOpen,
    currentCourse,
    currentTopic,
    setCurrentTopic,
    currentSubject,
    setCurrentSubject
  } = useApp();

  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentlyTypingMessageId, setCurrentlyTypingMessageId] = useState<string | null>(null);
  const [moderationAlert, setModerationAlert] = useState<ModerationAlertType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUseSuggestedQuery = (suggestedQuery: string) => {
    setMessage(suggestedQuery);
    setModerationAlert(null);
  };

  useEffect(scrollToBottom, [chatMessages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Check if message is a simple greeting
    const isGreeting = (msg: string): boolean => {
      const greetings = [
        /^hi$/i, /^hello$/i, /^hey$/i, /^hiya$/i, /^good morning$/i, 
        /^good afternoon$/i, /^good evening$/i, /^what's up$/i, /^wassup$/i,
        /^how are you$/i, /^how's it going$/i, /^what's up$/i
      ];
      
      return greetings.some(pattern => pattern.test(msg.trim()));
    };

    // Extract topic information from the message (only for non-greetings)
    const extractTopicFromMessage = (msg: string): string | null => {
      if (isGreeting(msg)) return null;
      
      const topicPatterns = [
        /teach me about (.+)/i,
        /explain (.+)/i,
        /what is (.+)/i,
        /help me with (.+)/i,
        /i want to learn (.+)/i,
        /can you teach (.+)/i
      ];
      
      for (const pattern of topicPatterns) {
        const match = msg.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
      return null;
    };

    // Extract subject from message (only for non-greetings)
    const extractSubjectFromMessage = (msg: string): string | null => {
      if (isGreeting(msg)) return null;
      
      const subjects = ['mathematics', 'physics', 'chemistry', 'biology', 'computer science', 'literature'];
      const lowerMsg = msg.toLowerCase();
      
      for (const subject of subjects) {
        if (lowerMsg.includes(subject)) {
          return subject.charAt(0).toUpperCase() + subject.slice(1);
        }
      }
      return null;
    };

    // Update current topic and subject based on user message (only for non-greetings)
    const detectedTopic = extractTopicFromMessage(message);
    const detectedSubject = extractSubjectFromMessage(message);
    
    if (detectedTopic) {
      setCurrentTopic(detectedTopic);
    }
    
    if (detectedSubject) {
      setCurrentSubject(detectedSubject);
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date()
    };

    addChatMessage(userMessage);
    setMessage('');
    setIsTyping(true);

    try {
      // Use enhanced AI service for chat response with moderation
      const response = await enhancedChatService.sendMessage({
        message: message,
        sessionId: undefined, // Will be handled by backend
        subject: detectedSubject || currentSubject || currentCourse?.subject || 'General',
        currentTopic: detectedTopic || currentTopic || 'General Learning',
        difficulty: teachingMode,
        isGreeting: isGreeting(message),
        learningMode: learningMode
      });

      // Handle moderation alert if present
      if (response.moderationAlert) {
        setModerationAlert(response.moderationAlert);
      }

      const aiMessageId = (Date.now() + 1).toString();
      setCurrentlyTypingMessageId(aiMessageId);

      const aiMessage: ChatMessage = {
        id: aiMessageId,
        content: response.message.content || 'No response content received',
        isUser: false,
        timestamp: new Date()
      };
      
      addChatMessage(aiMessage);

      // Track learning session only for non-greeting interactions
      if (!isGreeting(message)) {
        const sessionTime = 2;
        const subject = detectedSubject || currentSubject || currentCourse?.subject || 'General';
        const topic = detectedTopic || currentTopic || undefined;

        try {
          await userService.trackLearningSession(subject, sessionTime, topic);
          console.log(`Tracked learning session: ${sessionTime}min in ${subject}${topic ? ` - ${topic}` : ''}`);
        } catch (error) {
          console.error('Failed to track learning session:', error);
        }
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        isUser: false,
        timestamp: new Date()
      };
      addChatMessage(errorMessage);
    } finally {
      setIsTyping(false);
      setCurrentlyTypingMessageId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto h-screen flex">
        {/* Course Outline Sidebar */}
        <AnimatePresence>
          {sidebarOpen && currentCourse && (
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.3 }}
              className="w-80 bg-white border-r border-gray-200 flex-shrink-0"
            >
              <CourseOutline course={currentCourse} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  icon={ArrowLeft}
                  className="mr-2"
                >
                  Back
                </Button>
              )}
              {currentCourse && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  icon={sidebarOpen ? X : Menu}
                >
                  {sidebarOpen ? 'Close' : 'Menu'}
                </Button>
              )}
                            <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Brain className="text-blue-600" size={20} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">AI Tutor</h2>
                  {(currentTopic || currentSubject) && (
                    <p className="text-sm text-gray-600">
                      {currentTopic ? `Learning: ${currentTopic}` : 
                       currentSubject ? `Subject: ${currentSubject}` : ''}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Teaching Mode Selector */}
              <select
                value={teachingMode}
                onChange={(e) => setTeachingMode(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="beginner">Beginner</option>
                <option value="normal">Normal</option>
                <option value="advanced">Advanced</option>
              </select>

              {/* Learning Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setLearningMode('teaching')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    learningMode === 'teaching' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Structured teaching with step-by-step lessons"
                >
                  📚 Teaching
                </button>
                <button
                  onClick={() => setLearningMode('chat')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    learningMode === 'chat' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="Direct Q&A conversation style"
                >
                  💬 Chat
                </button>
              </div>

              {/* Generate Quiz Button - Only show in teaching mode */}
              {onGenerateQuiz && learningMode === 'teaching' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const subject = currentSubject || currentCourse?.subject || 'Mathematics';
                    const difficulty = teachingMode === 'beginner' ? 'easy' : 
                                     teachingMode === 'advanced' ? 'hard' : 'intermediate';
                    const topic = currentTopic || undefined;
                    
                    // Create relevant chat context from recent messages
                    const recentMessages = chatMessages.slice(-5).map(msg => 
                      `${msg.isUser ? 'Student' : 'AI'}: ${msg.content}`
                    ).join('\n');
                    
                    onGenerateQuiz(subject, difficulty, topic, recentMessages);
                  }}
                  className="ml-2"
                >
                  {currentTopic ? `Quiz: ${currentTopic}` : 
                   currentSubject ? `Quiz: ${currentSubject}` : 
                   currentCourse?.subject ? `Quiz: ${currentCourse.subject}` : 
                   'Generate Quiz'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="bg-blue-50 p-6 rounded-2xl mx-auto w-fit mb-4">
                <MessageSquare className="text-blue-600" size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Start Your Learning Session</h3>
              <p className="text-gray-600 mb-6">Ask me anything or let me guide you through a topic!</p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  'Explain photosynthesis',
                  'Help with calculus derivatives',
                  'What is quantum physics?',
                  'Teach me about DNA structure'
                ].map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Moderation Alert */}
          {moderationAlert && (
            <ModerationAlert
              isVisible={true}
              reasoning={moderationAlert.reasoning}
              suggestedQuery={moderationAlert.suggestedQuery}
              relevantSubjects={moderationAlert.relevantSubjects}
              onClose={() => setModerationAlert(null)}
              onUseSuggestion={handleUseSuggestedQuery}
            />
          )}

          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                msg.isUser 
                  ? 'bg-gray-600 text-white rounded-br-md' 
                  : 'bg-blue-600 text-white rounded-bl-md'
              }`}>
                {msg.isUser ? (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                ) : (
                  <TypingMarkdown 
                    content={msg.content || ''}
                    typingSpeed={30}
                    isTyping={currentlyTypingMessageId === msg.id}
                    onTypingComplete={() => setCurrentlyTypingMessageId(null)}
                  />
                )}
                <p className="text-xs mt-1 opacity-70">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-blue-600 text-white px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex space-x-1">
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.5, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex items-end gap-3">
            <button
              onClick={toggleRecording}
              className={`p-3 rounded-full transition-all ${
                isRecording 
                  ? 'bg-red-600 text-white animate-pulse' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything or describe what you'd like to learn..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                rows={1}
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim()}
              icon={Send}
              className="px-4 py-3"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};