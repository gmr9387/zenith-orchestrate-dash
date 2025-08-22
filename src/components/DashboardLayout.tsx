import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/auth';
import EnhancedNavigation from './EnhancedNavigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Settings, 
  Workflow,
  Video,
  Code,
  Zap,
  Target,
  Crown,
  Star,
  Award,
  Activity,
  BarChart3,
  Database,
  Cloud,
  Lock,
  Unlock,
  RefreshCw,
  Globe,
  Shield,
  Cpu,
  Server,
  Network,
  Bot,
  Rocket,
  Sparkles,
  Plus
} from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const demoModeEnabled = import.meta.env.VITE_DEMO_MODE === 'true';
  const authenticated = demoModeEnabled || isAuthenticated;

  useEffect(() => {
    // Check authentication status
    if (!authenticated) {
      navigate('/login');
      return;
    }

    setIsLoading(false);
  }, [authenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
              <BookOpen className="h-10 w-10 text-white" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl blur-xl opacity-50 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Zilliance</h2>
          <p className="text-purple-200">Preparing your enterprise dashboard...</p>
          
          {/* Loading Animation */}
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-purple-400 rounded-full"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user && !authenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      {/* Enhanced Navigation */}
      <EnhancedNavigation user={user ?? null} onLogout={handleLogout} />
      
      {/* Main Content */}
      <main className="pt-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-8 right-8 z-40"
        initial={{ opacity: 0, scale: 0, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5, type: "spring" }}
      >
        <button className="group relative w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-110">
          <Plus className="h-8 w-8 text-white mx-auto" />
          
          {/* Hover Tooltip */}
          <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-purple-500/20">
            Quick Actions
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
          </div>
          
          {/* Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
        </button>
      </motion.div>

      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Floating Elements */}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute top-40 right-20 w-24 h-24 bg-pink-500/10 rounded-full blur-3xl"
          animate={{
            y: [0, 15, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        
        <motion.div
          className="absolute bottom-40 left-20 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{
            y: [0, -25, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        
        <motion.div
          className="absolute bottom-20 right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-3xl"
          animate={{
            y: [0, 20, 0],
            scale: [1, 0.8, 1],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
      </div>

      {/* Performance Monitor (Development Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-40">
          <motion.div
            className="bg-slate-800/90 backdrop-blur-md text-white text-xs p-3 rounded-lg border border-purple-500/20"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2, duration: 0.5 }}
          >
            <div className="flex items-center space-x-2 mb-2">
              <Activity className="h-3 w-3 text-green-400" />
              <span className="font-medium">Performance</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>FPS:</span>
                <span className="text-green-400">60</span>
              </div>
              <div className="flex justify-between">
                <span>Memory:</span>
                <span className="text-yellow-400">45MB</span>
              </div>
              <div className="flex justify-between">
                <span>Load:</span>
                <span className="text-purple-400">0.2s</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;