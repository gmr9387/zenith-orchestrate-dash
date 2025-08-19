import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  BookOpen, 
  User, 
  LogOut, 
  Home,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  Sparkles,
  Crown,
  Zap,
  Workflow,
  Video,
  Code,
  Target,
  ChevronDown,
  ChevronRight,
  Plus,
  Globe,
  Shield,
  Activity,
  BarChart3,
  Database,
  Cloud,
  Lock,
  Unlock,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Info,
  HelpCircle,
  ExternalLink,
  Folder,
  File,
  GitBranch,
  Users,
  Star,
  Heart,
  Share2,
  MoreHorizontal,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

interface EnhancedNavigationProps {
  user: User | null;
  onLogout: () => void;
}

const EnhancedNavigation: React.FC<EnhancedNavigationProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  
  const navRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { 
      path: '/', 
      label: 'Dashboard', 
      icon: Home,
      description: 'Overview and analytics'
    },
    { 
      path: '/tutorial-builder', 
      label: 'Tutorial Builder', 
      icon: Target,
      description: 'Create and manage tutorials'
    },
    { 
      path: '/workflows', 
      label: 'Workflows', 
      icon: Workflow,
      description: 'Automation and workflows'
    },
    { 
      path: '/videos', 
      label: 'Videos', 
      icon: Video,
      description: 'Video management platform'
    },
    { 
      path: '/api', 
      label: 'API Gateway', 
      icon: Code,
      description: 'API testing and management'
    },
    { 
      path: '/profile', 
      label: 'Profile', 
      icon: User,
      description: 'User settings and preferences'
    },
  ];

  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Workflow completed successfully',
      message: 'Your automation workflow has finished processing',
      time: '2 minutes ago',
      icon: CheckCircle
    },
    {
      id: 2,
      type: 'info',
      title: 'New tutorial published',
      message: 'Your tutorial is now live and available to users',
      time: '1 hour ago',
      icon: BookOpen
    },
    {
      id: 3,
      type: 'warning',
      title: 'Storage usage alert',
      message: 'You\'re approaching 80% of your storage limit',
      time: '3 hours ago',
      icon: AlertTriangle
    }
  ];

  const quickActions = [
    { label: 'Create Tutorial', icon: Plus, action: () => {} },
    { label: 'New Workflow', icon: Workflow, action: () => {} },
    { label: 'Upload Video', icon: Video, action: () => {} },
    { label: 'API Test', icon: Code, action: () => {} },
  ];

  return (
    <>
      {/* Enhanced Navigation Bar */}
      <motion.nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-2xl' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <motion.div 
              className="flex items-center space-x-3"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Zilliance
                  </h1>
                  <div className="flex items-center gap-1">
                    <Crown className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs font-medium text-gray-600">Enterprise</span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.path}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link to={item.path}>
                      <Button
                        variant={isActive(item.path) ? 'default' : 'ghost'}
                        size="sm"
                        className={`group relative px-4 py-2 rounded-xl transition-all duration-300 ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                      >
                        <Icon className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        <span className="font-medium">{item.label}</span>
                        
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                          {item.description}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                        </div>
                      </Button>
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <motion.div
                ref={searchRef}
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="w-10 h-10 p-0 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                >
                  <Search className="h-5 w-5 text-gray-600" />
                </Button>
                
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4"
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search tutorials, workflows, videos..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Quick Actions</p>
                        {quickActions.map((action, index) => (
                          <motion.button
                            key={action.label}
                            onClick={action.action}
                            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200 text-left"
                            whileHover={{ x: 5 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <action.icon className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">{action.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Notifications */}
              <motion.div
                className="relative"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="w-10 h-10 p-0 rounded-xl hover:bg-gray-100 transition-colors duration-200 relative"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </Button>
                
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-h-96 overflow-y-auto"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          Mark all read
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        {notifications.map((notification, index) => {
                          const Icon = notification.icon;
                          return (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-200"
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                notification.type === 'success' ? 'bg-green-100' :
                                notification.type === 'warning' ? 'bg-yellow-100' :
                                'bg-blue-100'
                              }`}>
                                <Icon className={`h-4 w-4 ${
                                  notification.type === 'success' ? 'text-green-600' :
                                  notification.type === 'warning' ? 'text-yellow-600' :
                                  'text-blue-600'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* User Menu */}
              {user && (
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="ghost"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`} />
                  </Button>
                  
                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4"
                      >
                        {/* User Info */}
                        <div className="flex items-center space-x-3 p-3 rounded-xl bg-gray-50 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <span className="text-lg font-semibold text-white">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="mt-1">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="space-y-1">
                          <Link to="/profile">
                            <Button variant="ghost" className="w-full justify-start p-3 rounded-xl hover:bg-gray-50">
                              <User className="mr-3 h-4 w-4" />
                              Profile Settings
                            </Button>
                          </Link>
                          <Button variant="ghost" className="w-full justify-start p-3 rounded-xl hover:bg-gray-50">
                            <Settings className="mr-3 h-4 w-4" />
                            Preferences
                          </Button>
                          <Button variant="ghost" className="w-full justify-start p-3 rounded-xl hover:bg-gray-50">
                            <HelpCircle className="mr-3 h-4 w-4" />
                            Help & Support
                          </Button>
                          <div className="border-t border-gray-200 my-2" />
                          <Button 
                            variant="ghost" 
                            onClick={onLogout}
                            className="w-full justify-start p-3 rounded-xl hover:bg-red-50 text-red-600 hover:text-red-700"
                          >
                            <LogOut className="mr-3 h-4 w-4" />
                            Sign Out
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Mobile Menu Button */}
              <motion.div
                className="lg:hidden"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="w-10 h-10 p-0 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5 text-gray-600" />
                  ) : (
                    <Menu className="h-5 w-5 text-gray-600" />
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-gray-200"
            >
              <div className="px-4 py-6 space-y-4">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.path}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 p-3 rounded-xl transition-all duration-200 ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                        {isActive(item.path) && (
                          <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Spacer for fixed navigation */}
      <div className="h-16" />
    </>
  );
};

export default EnhancedNavigation;