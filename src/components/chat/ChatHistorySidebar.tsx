import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Clock, 
  BookOpen, 
  Trash2, 
  Archive, 
  Search,
  Plus,
  Filter,
  ChevronRight,
  History
} from 'lucide-react';
import { Button } from '../ui/Button';
import { chatService } from '../../services/chatService';

interface ChatSession {
  _id: string;
  title?: string;
  subject?: string;
  currentTopic?: string;
  courseId?: string;
  topicId?: string;
  messageCount: number;
  lastActivity: string;
  totalDuration: number;
  sessionStatus: 'active' | 'paused' | 'completed' | 'archived';
  conceptsCovered: Array<{
    concept: string;
    confidence: number;
    timestamp: string;
  }>;
  createdAt: string;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
  currentSessionId?: string;
  onCreateNewSession: () => void;
  courseId?: string; // NEW: Filter by course
  topicId?: string; // NEW: Filter by topic
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
  isOpen,
  onClose,
  onSelectSession,
  currentSessionId,
  onCreateNewSession,
  courseId,
  topicId
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load chat sessions
  const loadSessions = async (reset = false) => {
    if (loading) return;
    
    setLoading(true);
    try {
      let response;
      
      // If courseId provided, use course-specific endpoint
      if (courseId) {
        response = await chatService.getCourseSessionsCall(courseId, topicId);
      } else {
        // Otherwise use general sessions endpoint
        const currentPage = reset ? 1 : page;
        response = await chatService.getChatSessions({
          page: currentPage,
          limit: 20,
          status: filterStatus === 'all' ? undefined : filterStatus,
          search: searchQuery || undefined
        });
      }
      
      if (response.success && response.data?.sessions) {
        // Normalize session id field to _id to handle backend shapes that return `id` or `_id`
        const sessionsRaw = response.data?.sessions ?? [];
        const normalized = sessionsRaw.map((s: any) => ({ ...s, _id: s._id ?? s.id }));
        if (reset) {
          setSessions(normalized);
          setPage(2);
        } else {
          setSessions(prev => [...prev, ...normalized]);
          setPage(prev => prev + 1);
        }

        setHasMore(normalized?.length === 20);
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    if (isOpen) {
      loadSessions(true);
    }
  }, [isOpen, searchQuery, filterStatus, courseId, topicId]);

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 7) {
      return date.toLocaleDateString();
    } else if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Get session status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'archived':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Archive session
  const handleArchiveSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await chatService.updateChatSession(sessionId, { status: 'archived' });
      setSessions(prev => prev.map(session => 
        session._id === sessionId 
          ? { ...session, sessionStatus: 'archived' as const }
          : session
      ));
    } catch (error) {
      console.error('Error archiving session:', error);
    }
  };

  // Delete session
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat session?')) return;
    
    try {
      await chatService.deleteChatSession(sessionId);
      setSessions(prev => prev.filter(session => session._id !== sessionId));
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Chat History</h2>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="p-1"
              >
                ×
              </Button>
            </div>

            {/* Controls */}
            <div className="p-4 border-b border-gray-200">
              <Button
                onClick={async () => {
                  try {
                    if (courseId) {
                      // Create a course-scoped session
                      const resp = await chatService.createCourseSession(courseId, topicId);
                      if (resp.success && resp.data?.session) {
                        // backend might return `id` or `_id` — normalize (use any to avoid type collisions)
                        const created: any = resp.data.session as any;
                        const newSessionId = created._id ?? created.id;
                        // Select the created session
                        onSelectSession(newSessionId);
                        // Refresh list
                        loadSessions(true);
                        return;
                      }
                    }
                    // Fallback to generic new session flow
                    onCreateNewSession();
                  } catch (error) {
                    console.error('Failed to create course session:', error);
                    // Fallback
                    onCreateNewSession();
                  }
                }}
                className="w-full mb-3 bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto">
              {sessions.length === 0 && !loading ? (
                <div className="p-4 text-center text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No chat sessions found</p>
                  <p className="text-sm mt-1">Start a new conversation to see it here</p>
                </div>
              ) : (
                <div className="p-2">
                      {sessions.map((session) => (
                        <motion.div
                          key={session._id}
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`group p-3 rounded-lg mb-2 cursor-pointer hover:bg-gray-50 border transition-colors ${
                            currentSessionId === session._id 
                              ? 'border-blue-300 bg-blue-50' 
                              : 'border-transparent'
                          }`}
                          onClick={() => onSelectSession(session._id)}
                        >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 text-sm truncate">
                            {session.title || session.subject || 'Untitled Chat'}
                          </h3>
                          
                          {session.currentTopic && (
                            <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {session.currentTopic}
                            </p>
                          )}

                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {session.messageCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(session.lastActivity)}
                            </span>
                          </div>

                          {/* Status badge */}
                          <div className="flex items-center justify-between mt-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.sessionStatus)}`}>
                              {session.sessionStatus}
                            </span>
                            
                            {/* Concepts preview */}
                            {session.conceptsCovered.length > 0 && (
                              <span className="text-xs text-gray-400">
                                {session.conceptsCovered.length} concept{session.conceptsCovered.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {session.sessionStatus !== 'archived' && (
                            <button
                              onClick={(e: React.MouseEvent) => handleArchiveSession(session._id, e)}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Archive"
                            >
                              <Archive className="w-3 h-3" />
                            </button>
                          )}
                          {/* Resume button */}
                          {session.sessionStatus !== 'active' && (
                            <button
                              onClick={async (e: React.MouseEvent) => {
                                e.stopPropagation();
                                try {
                                  const resp = await chatService.resumeSession(session._id);
                                  if (resp.success && resp.data?.session) {
                                    // Refresh list and select resumed session
                                    setSessions(prev => prev.map(s => s._id === session._id ? { ...s, sessionStatus: 'active' } : s));
                                    onSelectSession(session._id);
                                  }
                                } catch (err) {
                                  console.error('Failed to resume session:', err);
                                }
                              }}
                              className="p-1 hover:bg-gray-200 rounded transition-colors"
                              title="Resume"
                            >
                              <History className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e: React.MouseEvent) => handleDeleteSession(session._id, e)}
                            className="p-1 hover:bg-red-200 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <div className="p-4 text-center">
                      <Button
                        onClick={() => loadSessions(false)}
                        disabled={loading}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        {loading ? 'Loading...' : 'Load More'}
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};