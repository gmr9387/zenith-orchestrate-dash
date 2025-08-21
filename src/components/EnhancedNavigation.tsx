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
      path: '/crm', 
      label: 'CRM Suite', 
      icon: Users,
      description: 'Customer relationship management'
    },
    { 
      path: '/app-builder', 
      label: 'App Builder', 
      icon: Code,
      description: 'Build and deploy applications'
    },
    { 
      path: '/api-gateway', 
      label: 'API Gateway', 
      icon: Globe,
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
    { label: 'Add Contact', icon: Users, action: () => {} },
    { label: 'New App', icon: Code, action: () => {} },
    { label: 'API Test', icon: Globe, action: () => {} },
  ];

  const prefetchRoute = (path: string) => {
    try {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'document';
      link.href = path;
      document.head.appendChild(link);
      setTimeout(() => document.head.removeChild(link), 5000);
    } catch {}
  };

  return (
    <>
      {/* Enhanced Navigation Bar */}
      <motion.nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-slate-900/90 backdrop-blur-xl border-b border-purple-500/20 shadow-2xl' 
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
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                </div>
                <div className="flex flex-col">
                  <h1 className="text-2xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                    Zilliance
                  </h1>
                  <div className="flex items-center gap-1">
                    <Crown className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs font-medium text-purple-300">Enterprise</span>
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
                    <Link to={item.path} onMouseEnter={() => {
                      if (['/tutorial-builder','/videos','/api'].includes(item.path)) prefetchRoute(item.path);
                    }}>
                      <Button
                        variant={isActive(item.path) ? 'default' : 'ghost'}
                        size="sm"
                        className={`group relative px-4 py-2 rounded-xl transition-all duration-300 ${
                          isActive(item.path)
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                            : 'text-purple-200 hover:text-purple-400 hover:bg-purple-900/30'
                        }`}
                      >
                        <Icon className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-200" />
                        <span className="font-medium">{item.label}</span>
                        
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap border border-purple-500/20">
                          {item.description}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800" />
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
                  className="w-10 h-10 p-0 rounded-xl hover:bg-purple-900/30 transition-colors duration-200"
                >
                  <Search className="h-5 w-5 text-purple-300" />
                </Button>
                
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-80 bg-slate-800 rounded-2xl shadow-2xl border border-purple-500/20 p-4"
                    >
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-400" />
                        <input
                          type="text"
                          placeholder="Search tutorials, workflows, videos..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-purple-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-slate-700 text-white placeholder-purple-300"
                        />
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="mt-4 space-y-2">
                        <p className="text-xs font-medium text-purple-300 uppercase tracking-wider">Quick Actions</p>
                        {quickActions.map((action, index) => (
                          <motion.button
                            key={action.label}
                            onClick={action.action}
                            className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-slate-700 transition-colors duration-200 text-left"
                            whileHover={{ x: 5 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="w-8 h-8 bg-purple-900/50 rounded-lg flex items-center justify-center border border-purple-500/30">
                              <action.icon className="h-4 w-4 text-purple-400" />
                            </div>
                            <span className="text-sm font-medium text-purple-200">{action.label}</span>
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
                  className="w-10 h-10 p-0 rounded-xl hover:bg-purple-900/30 transition-colors duration-200 relative"
                >
                  <Bell className="h-5 w-5 text-purple-300" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </Button>
                
                <AnimatePresence>
                  {isNotificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full right-0 mt-2 w-80 bg-slate-800 rounded-2xl shadow-2xl border border-purple-500/20 p-4 max-h-96 overflow-y-auto"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Notifications</h3>
                        <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
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
                              className="flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-700 transition-colors duration-200"
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-purple-500/30 ${
                                notification.type === 'success' ? 'bg-green-900/50' :
                                notification.type === 'warning' ? 'bg-yellow-900/50' :
                                'bg-purple-900/50'
                              }`}>
                                <Icon className={`h-4 w-4 ${
                                  notification.type === 'success' ? 'text-green-400' :
                                  notification.type === 'warning' ? 'text-yellow-400' :
                                  'text-purple-400'
                                }`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white">{notification.title}</p>
                                <p className="text-xs text-purple-300 mt-1">{notification.message}</p>
                                <p className="text-xs text-purple-400 mt-2">{notification.time}</p>
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
                    className="flex items-center space-x-3 p-2 rounded-xl hover:bg-purple-900/30 transition-colors duration-200"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-white">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-purple-300">{user.email}</p>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-purple-400 transition-transform duration-200 ${
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
                        className="absolute top-full right-0 mt-2 w-64 bg-slate-800 rounded-2xl shadow-2xl border border-purple-500/20 p-4"
                      >
                        {/* User Info */}
                        <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-700 mb-4 border border-purple-500/20">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <span className="text-lg font-semibold text-white">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-white">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-purple-300">{user.email}</p>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'} className="mt-1">
                              {user.role}
                            </Badge>
                          </div>
                        </div>
                        
                        {/* Menu Items */}
                        <div className="space-y-1">
                          <Link to="/profile">
                            <Button variant="ghost" className="w-full justify-start p-3 rounded-xl hover:bg-slate-700 text-purple-200 hover:text-white">
                              <User className="mr-3 h-4 w-4" />
                              Profile Settings
                            </Button>
                          </Link>
                          <Button variant="ghost" className="w-full justify-start p-3 rounded-xl hover:bg-slate-700 text-purple-200 hover:text-white">
                            <Settings className="mr-3 h-4 w-4" />
                            Preferences
                          </Button>
                          <Button variant="ghost" className="w-full justify-start p-3 rounded-xl hover:bg-slate-700 text-purple-200 hover:text-white">
                            <HelpCircle className="mr-3 h-4 w-4" />
                            Help & Support
                          </Button>
                          <div className="border-t border-purple-500/20 my-2" />
                          <Button 
                            variant="ghost" 
                            onClick={onLogout}
                            className="w-full justify-start p-3 rounded-xl hover:bg-red-900/30 text-red-400 hover:text-red-300"
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
                  className="w-10 h-10 p-0 rounded-xl hover:bg-purple-900/30 transition-colors duration-200"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5 text-purple-300" />
                  ) : (
                    <Menu className="h-5 w-5 text-purple-300" />
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
              className="lg:hidden bg-slate-900/95 backdrop-blur-xl border-t border-purple-500/20"
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
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                            : 'text-purple-200 hover:bg-purple-900/30'
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