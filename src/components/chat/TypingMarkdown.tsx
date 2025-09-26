import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypingMarkdownProps {
  content?: string; // Make optional with default
  typingSpeed?: number;
  isTyping?: boolean;
  onTypingComplete?: () => void;
}

export const TypingMarkdown: React.FC<TypingMarkdownProps> = ({
  content = '', // Default to empty string
  typingSpeed = 20,
  isTyping = false,
  onTypingComplete
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  // Ensure content is always a string
  const safeContent = content || '';

  useEffect(() => {
    if (!isTyping) {
      setDisplayedContent(safeContent);
      setCurrentIndex(safeContent.length);
      return;
    }

    if (currentIndex < safeContent.length) {
      const timer = setTimeout(() => {
        setDisplayedContent(safeContent.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, typingSpeed);

      return () => clearTimeout(timer);
    } else if (onTypingComplete) {
      onTypingComplete();
    }
  }, [safeContent, currentIndex, isTyping, typingSpeed, onTypingComplete]);

  useEffect(() => {
    if (isTyping && currentIndex < safeContent.length) {
      const cursorTimer = setInterval(() => {
        setShowCursor(prev => !prev);
      }, 500);

      return () => clearInterval(cursorTimer);
    } else {
      setShowCursor(false);
    }
  }, [isTyping, currentIndex, safeContent.length]);

  // Reset when content changes
  useEffect(() => {
    if (isTyping) {
      setDisplayedContent('');
      setCurrentIndex(0);
      setShowCursor(true);
    }
  }, [safeContent, isTyping]);

  // Simple markdown parsing
  const parseMarkdown = (text: string) => {
    return text
      // Bold text: **text** or __text__
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="font-semibold text-white">$1</strong>')
      // Italic text: *text* or _text_
      .replace(/\*(.*?)\*/g, '<em class="italic text-white">$1</em>')
      .replace(/_(.*?)_/g, '<em class="italic text-white">$1</em>')
      // Code blocks: ```code```
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-blue-800 p-2 rounded text-blue-100 text-xs overflow-x-auto mb-2 mt-2"><code>$1</code></pre>')
      // Inline code: `code`
      .replace(/`([^`]+)`/g, '<code class="bg-blue-800 px-1 py-0.5 rounded text-blue-100 text-xs">$1</code>')
      // Headers: # ## ###
      .replace(/^### (.*$)/gm, '<h3 class="text-sm font-semibold mb-1 mt-2 text-white">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-base font-semibold mb-2 mt-3 text-white">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-lg font-bold mb-2 mt-3 text-white">$1</h1>')
      // Line breaks
      .replace(/\n\n/g, '</p><p class="mb-2 text-white leading-relaxed">')
      .replace(/\n/g, '<br />');
  };

  return (
    <div className="relative">
      <div 
        className="prose prose-sm max-w-none text-white"
        dangerouslySetInnerHTML={{ 
          __html: `<p class="mb-2 text-white leading-relaxed">${parseMarkdown(displayedContent)}</p>` 
        }}
      />
      
      {isTyping && showCursor && currentIndex < safeContent.length && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="inline-block w-2 h-4 bg-white ml-1"
        />
      )}
    </div>
  );
};
