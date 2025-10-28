import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Play, Trophy, TrendingUp, Star } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressRing } from '../ui/ProgressRing';
import { useApp } from '../../context/AppContext';
import { Course } from '../../types';
import { courseService } from '../../services/courseService';
import { userService } from '../../services/userService';

interface DashboardProps {
  onStartLearning: (course: Course) => void;
  onViewCourses: () => void;
  onStartQuiz?: (subject?: string, difficulty?: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartLearning, onViewCourses, onStartQuiz }) => {
  const { user, setError } = useApp();
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user's enrolled courses, stats, and recommendations in parallel
      const [enrolledCourses, stats, recommended] = await Promise.all([
        courseService.getEnrolledCourses(),
        userService.getUserStats(),
        courseService.getRecommendedCourses()
      ]);

      setRecentCourses(enrolledCourses.slice(0, 3)); // Show latest 3 courses
      setUserStats(stats);
      setRecommendedCourses(recommended.slice(0, 6)); // Show top 6 recommendations
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = () => {
    if (onStartQuiz) {
      // Use user's preferred subjects or default to Mathematics
      const preferredSubject = user?.preferredSubjects?.[0] || 'Mathematics';
      onStartQuiz(preferredSubject, 'intermediate');
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 border-r-blue-400"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-b-indigo-600 border-l-indigo-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <span className="text-lg font-medium text-gray-700">Loading dashboard...</span>
          <div className="flex items-center space-x-1 mt-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      label: 'Courses Completed', 
      value: userStats?.coursesCompleted?.toString() || '0', 
      icon: Trophy, 
      color: 'text-yellow-600' 
    },
    { 
      label: 'Quiz Score Avg', 
      value: userStats?.averageScore ? `${Math.round(userStats.averageScore)}%` : '0%', 
      icon: TrendingUp, 
      color: 'text-green-600' 
    },
    { 
      label: 'Current Streak', 
      value: userStats?.streakDays !== undefined ? `${userStats.streakDays} ${userStats.streakDays === 1 ? 'day' : 'days'}` : '0 days', 
      icon: Star, 
      color: 'text-orange-600' 
    }
  ];

  const subjects = [
    { name: 'Mathematics', icon: '📐', courses: recommendedCourses.filter(c => c.subject === 'Mathematics').length, color: 'bg-blue-600' },
    { name: 'Physics', icon: '⚛️', courses: recommendedCourses.filter(c => c.subject === 'Physics').length, color: 'bg-purple-600' },
    { name: 'Chemistry', icon: '🧪', courses: recommendedCourses.filter(c => c.subject === 'Chemistry').length, color: 'bg-green-600' },
    { name: 'Biology', icon: '🧬', courses: recommendedCourses.filter(c => c.subject === 'Biology').length, color: 'bg-teal-600' },
    { name: 'Computer Science', icon: '💻', courses: recommendedCourses.filter(c => c.subject === 'Computer Science').length, color: 'bg-orange-600' },
    { name: 'Literature', icon: '📚', courses: recommendedCourses.filter(c => c.subject === 'Literature').length, color: 'bg-pink-600' }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.name}! 👋
        </h1>
        <p className="text-gray-600">Ready to continue your learning journey?</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8"
      >
        <Card className="p-6 bg-gradient-to-r from-blue-600 to-teal-600 text-white">
          <h2 className="text-xl font-bold mb-4">Continue Your Learning</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="outline" 
              className="bg-white text-blue-600 border-white hover:bg-gray-50"
              onClick={() => recentCourses.length > 0 ? onStartLearning(recentCourses[0]) : onViewCourses()}
            >
              {recentCourses.length > 0 ? `Continue ${recentCourses[0].title}` : 'Start Learning'}
            </Button>
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/10"
              onClick={onViewCourses}
            >
              Explore All Courses
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 text-center" hover>
            <stat.icon className={`mx-auto mb-2 ${stat.color}`} size={24} />
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </Card>
        ))}
      </motion.div>

      {/* Quick Actions */}
      {onStartQuiz && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Quick Practice</h3>
                <p className="text-gray-600">Test your knowledge with a quick quiz</p>
              </div>
              <Button 
                onClick={handleStartQuiz}
                icon={Trophy}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                Start Quiz
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Courses */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="lg:col-span-2"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Continue Learning</h3>
          <div className="space-y-4">
            {recentCourses.map(course => (
              <Card key={course.id} className="p-6" hover onClick={() => onStartLearning(course)}>
                <div className="flex items-center gap-4">
                  <img 
                    src={course.thumbnail} 
                    alt={course.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{course.title}</h4>
                    <p className="text-gray-600 text-sm mb-2">{course.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        {course.subject}
                      </span>
                      <span>{course.difficulty}</span>
                      <span>{course.duration}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <ProgressRing percentage={course.progress} size={60} strokeWidth={4} />
                    <Button size="sm" className="mt-2" icon={Play}>
                      Continue
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Subject Categories */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-4">Explore Subjects</h3>
          <div className="space-y-3">
            {subjects.map((subject) => (
              <Card key={subject.name} className="p-4" hover>
                <div className="flex items-center gap-3">
                  <div className={`${subject.color} p-2 rounded-lg`}>
                    <span className="text-white text-lg">{subject.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{subject.name}</h4>
                    <p className="text-sm text-gray-500">{subject.courses} courses</p>
                  </div>
                  <BookOpen className="text-gray-400" size={18} />
                </div>
              </Card>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={onViewCourses}
          >
            View All Courses
          </Button>
        </motion.div>
      </div>
    </div>
  );
};