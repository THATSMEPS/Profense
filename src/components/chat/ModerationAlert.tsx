import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, BookOpen, Lightbulb, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface ModerationAlertProps {
  isVisible: boolean;
  reasoning: string;
  suggestedQuery?: string;
  relevantSubjects: string[];
  onClose: () => void;
  onUseSuggestion?: (query: string) => void;
}

export const ModerationAlert: React.FC<ModerationAlertProps> = ({
  isVisible,
  reasoning,
  suggestedQuery,
  relevantSubjects,
  onClose,
  onUseSuggestion
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-amber-800 mb-2">
                Let's keep our focus on learning!
              </h4>
              <p className="text-sm text-amber-700 mb-3">
                {reasoning}
              </p>
              
              {suggestedQuery && (
                <div className="mb-3 p-3 bg-amber-100 rounded-lg border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      Suggested question:
                    </span>
                  </div>
                  <p className="text-sm text-amber-700 mb-2 italic">
                    "{suggestedQuery}"
                  </p>
                  {onUseSuggestion && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-amber-700 border-amber-300 hover:bg-amber-200"
                      onClick={() => {
                        onUseSuggestion(suggestedQuery);
                        onClose();
                      }}
                    >
                      Use this question
                    </Button>
                  )}
                </div>
              )}
              
              {relevantSubjects.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">
                      Available learning topics:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {relevantSubjects.map((subject, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-amber-200 text-amber-800 rounded-full"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-amber-200 rounded-full transition-colors"
              aria-label="Close alert"
            >
              <X className="w-4 h-4 text-amber-600" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};