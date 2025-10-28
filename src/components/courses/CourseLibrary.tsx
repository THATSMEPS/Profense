import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, Users, Star, BookOpen } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Course } from '../../types';
import { courseService, CourseFilters } from '../../services/courseService';

interface CourseLibraryProps {
  onSelectCourse: (course: Course) => void;
}

export const CourseLibrary: React.FC<CourseLibraryProps> = ({ onSelectCourse }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [totalCourses, setTotalCourses] = useState(0);

  useEffect(() => {
    loadCourses();
  }, [searchTerm, selectedSubject, selectedDifficulty]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      
      const filters: CourseFilters = {
        search: searchTerm || undefined,
        subject: selectedSubject !== 'all' ? selectedSubject : undefined,
        difficulty: selectedDifficulty !== 'all' ? selectedDifficulty as any : undefined,
        page: 1,
        limit: 20
      };

      const result = await courseService.getCourses(filters);
      setCourses(result.courses);
      setTotalCourses(result.total);
    } catch (error) {
      console.error('Failed to load courses:', error);
      setLocalError('Failed to load courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollInCourse = async (courseId: string) => {
    try {
      await courseService.enrollInCourse(courseId);
      // Reload courses to update enrollment status
      loadCourses();
    } catch (error) {
      console.error('Failed to enroll in course:', error);
      setLocalError('Failed to enroll in course. Please try again.');
    }
  };

  // Load courses on component mount
  useEffect(() => {
    loadCourses();
  }, []);

  // Filter courses based on search and filters
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || course.subject === selectedSubject;
    const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  // Get unique subjects and difficulties from courses
  const subjects = ['all', ...Array.from(new Set(courses.map(course => course.subject)))];
  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-600';
      case 'intermediate': return 'bg-yellow-100 text-yellow-600';
      case 'advanced': return 'bg-red-100 text-red-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Course Library</h1>
        <p className="text-gray-600">Discover courses tailored to your learning goals</p>
        {localError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600">{localError}</p>
          </div>
        )}
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Subject Filter */}
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>
                  {subject === 'all' ? 'All Subjects' : subject}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>
                  {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </Card>
      </motion.div>

      {/* Results Count */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-gray-600 mb-6"
      >
        {loading ? 'Loading courses...' : `Showing ${filteredCourses.length} of ${totalCourses} courses`}
      </motion.p>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 border-r-blue-400"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-b-indigo-600 border-l-indigo-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <span className="text-lg font-medium text-gray-700">Loading courses...</span>
          <div className="flex items-center space-x-1 mt-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      )}

      {/* Courses Grid */}
      {!loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="overflow-hidden" hover onClick={() => onSelectCourse(course)}>
                <img 
                  src={course.thumbnail || 'https://images.pexels.com/photos/6238021/pexels-photo-6238021.jpeg'} 
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded-full">
                      {course.subject}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getDifficultyColor(course.difficulty)}`}>
                      {course.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {course.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{course.enrolledCount || 0} students</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star size={14} />
                      <span>{course.rating || 'N/A'}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    icon={BookOpen}
                    onClick={() => handleEnrollInCourse(course.id)}
                  >
                    {course.isEnrolled ? 'Continue Course' : 'Start Course'}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && filteredCourses.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="bg-gray-100 p-6 rounded-2xl mx-auto w-fit mb-4">
            <BookOpen className="text-gray-400" size={48} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search or filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedSubject('all');
              setSelectedDifficulty('all');
            }}
          >
            Clear Filters
          </Button>
        </motion.div>
      )}
    </div>
  );
};