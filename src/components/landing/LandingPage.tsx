import React from 'react';
import { motion } from 'framer-motion';
import { Brain, BookOpen, Trophy, Users, ArrowRight, Zap, Target, Lightbulb, GraduationCap, User } from 'lucide-react';
import { Button } from '../ui/Button';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const subjects = [
    { name: 'Mathematics', icon: '📐', color: 'bg-blue-100 text-blue-600' },
    { name: 'Physics', icon: '⚛️', color: 'bg-purple-100 text-purple-600' },
    { name: 'Chemistry', icon: '🧪', color: 'bg-green-100 text-green-600' },
    { name: 'Biology', icon: '🧬', color: 'bg-teal-100 text-teal-600' },
    { name: 'Computer Science', icon: '💻', color: 'bg-orange-100 text-orange-600' },
    { name: 'Literature', icon: '📚', color: 'bg-pink-100 text-pink-600' }
  ];

  const features = [
    { icon: Brain, title: 'AI-Powered Learning', description: 'Personalized tutoring that adapts to your learning style' },
    { icon: Zap, title: 'Interactive Quizzes', description: 'Engaging assessments with immediate feedback' },
    { icon: Target, title: 'Progress Tracking', description: 'Monitor your growth with detailed analytics' },
    { icon: Lightbulb, title: 'Voice Learning', description: 'Learn through natural conversation and voice input' }
  ];

  const testimonials = [
    { name: 'Sarah Chen', text: 'EduAI helped me improve my math scores by 40% in just 3 months!', grade: 'Grade 11' },
    { name: 'Marcus Johnson', text: 'The AI tutor explains concepts in a way that finally makes sense to me.', grade: 'College Freshman' },
    { name: 'Emily Rodriguez', text: 'I love how I can ask questions anytime and get instant, helpful answers.', grade: 'Grade 9' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      {/* Hero Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="flex justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-4 rounded-2xl">
                <GraduationCap className="text-white" size={48} />
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
              Learn with{' '}
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                AI Intelligence
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience personalized education with our advanced AI tutor. Get instant answers, 
              interactive lessons, and adaptive learning paths tailored just for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" onClick={onGetStarted} icon={ArrowRight}>
                Start Learning Free
              </Button>
              <Button variant="outline" size="lg" onClick={onSignIn}>
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose EduAI?</h2>
            <p className="text-xl text-gray-600">Powerful features designed for modern learning</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="bg-blue-50 p-4 rounded-xl mb-4 mx-auto w-fit">
                  <feature.icon className="text-blue-600" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Master Any Subject</h2>
            <p className="text-xl text-gray-600">From basics to advanced topics, we've got you covered</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true }}
                className={`${subject.color} p-6 rounded-xl text-center transition-all duration-200 hover:shadow-lg`}
              >
                <div className="text-3xl mb-3">{subject.icon}</div>
                <h3 className="font-medium text-sm">{subject.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Students Say</h2>
            <p className="text-xl text-gray-600">Real results from real students</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              >
                <p className="text-gray-700 mb-4 italic">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <User className="text-blue-600" size={16} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.grade}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-teal-600">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of students already learning smarter with AI
            </p>
            <Button 
              variant="outline" 
              size="lg" 
              className="bg-white text-blue-600 border-white hover:bg-gray-50"
              onClick={onGetStarted}
            >
              Get Started Today
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};