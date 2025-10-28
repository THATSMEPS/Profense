import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Edit2, Trophy, Clock, TrendingUp, Star, Award } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useApp } from '../../context/AppContext';
import { userService, UserProfile } from '../../services/userService';

interface ProfilePageProps {
  onLogout?: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onLogout }) => {
  const { user, setUser, setError } = useApp();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: ''
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const profile = await userService.getProfile();
      setUserProfile(profile);
      setEditData({
        name: profile.name || '',
        email: profile.email || '',
        bio: '' // Remove bio since it's not in UserProfile interface
      });
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updatedProfile = await userService.updateProfile(editData);
      setUserProfile(updatedProfile);
      setUser(updatedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-blue-600 border-r-blue-400"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-b-indigo-600 border-l-indigo-400" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <span className="text-lg font-medium text-gray-700">Loading profile...</span>
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
      value: userProfile?.stats?.coursesCompleted?.toString() || '0', 
      icon: Trophy, 
      color: 'text-yellow-600', 
      bg: 'bg-yellow-100' 
    },
    { 
      label: 'Total Hours', 
      value: userProfile?.stats?.totalStudyTime ? Math.round(userProfile.stats.totalStudyTime / 60).toString() : '0', 
      icon: Clock, 
      color: 'text-blue-600', 
      bg: 'bg-blue-100' 
    },
    { 
      label: 'Average Score', 
      value: userProfile?.stats?.averageScore ? `${Math.round(userProfile.stats.averageScore)}%` : '0%', 
      icon: TrendingUp, 
      color: 'text-green-600', 
      bg: 'bg-green-100' 
    },
    { 
      label: 'Current Streak', 
      value: userProfile?.stats?.streakDays?.toString() || '0', 
      icon: Star, 
      color: 'text-orange-600', 
      bg: 'bg-orange-100' 
    }
  ];

  // Load achievements from user profile or show empty state
  const achievements = userProfile?.stats?.badgesEarned?.map(badge => ({
    title: badge,
    description: `Achievement: ${badge}`,
    earned: true,
    date: new Date().toISOString().split('T')[0],
    progress: 100
  })) || [];

  // Show progress by subject if available
  const subjectProgress = userProfile?.preferences?.subjects?.map(subject => ({
    subject,
    progress: Math.floor(Math.random() * 100), // This would come from real analytics
    color: 'bg-blue-600'
  })) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 rounded-2xl">
              <User className="text-white" size={48} />
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    value={editData.name}
                    onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                    className="text-2xl font-bold bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                  <input
                    value={editData.email}
                    onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your email"
                    type="email"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} size="sm">Save</Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)} size="sm">Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-1">{userProfile?.name}</h1>
                  <p className="text-gray-600 mb-1">{userProfile?.email}</p>
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                </>
              )}
            </div>
            
            {!isEditing && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsEditing(true)} icon={Edit2}>
                  Edit Profile
                </Button>
                {onLogout && (
                  <Button 
                    variant="outline" 
                    onClick={onLogout}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Sign Out
                  </Button>
                )}
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 text-center" hover>
              <div className={`${stat.bg} p-3 rounded-lg mx-auto w-fit mb-3`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Subject Progress */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subject Progress</h2>
          <Card className="p-6">
            <div className="space-y-6">
              {subjectProgress.map((item, index) => (
                <div key={item.subject}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-900">{item.subject}</span>
                    <span className="text-sm font-medium text-gray-600">{item.progress}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <motion.div
                      className={`${item.color} rounded-full h-3`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl font-bold text-gray-900 mb-4">Achievements</h2>
          <Card className="p-6">
            <div className="space-y-4">
              {achievements.map((achievement, index) => (
                <motion.div
                  key={achievement.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-3 rounded-lg ${
                    achievement.earned ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    achievement.earned ? 'bg-yellow-100' : 'bg-gray-100'
                  }`}>
                    <Award className={achievement.earned ? 'text-yellow-600' : 'text-gray-400'} size={20} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-medium ${achievement.earned ? 'text-yellow-800' : 'text-gray-600'}`}>
                      {achievement.title}
                    </h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    {achievement.earned && achievement.date && (
                      <p className="text-xs text-gray-500 mt-1">
                        Earned on {new Date(achievement.date).toLocaleDateString()}
                      </p>
                    )}
                    {!achievement.earned && achievement.progress !== undefined && achievement.progress > 0 && (
                      <div className="mt-2">
                        <div className="bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 rounded-full h-1.5" 
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{achievement.progress}% complete</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};