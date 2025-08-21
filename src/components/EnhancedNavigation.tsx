import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { BookOpen, Home, Target, Code, Users, LogOut } from 'lucide-react';

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
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home, description: 'Overview and analytics' },
    { path: '/tutorial-builder', label: 'Tutorial Builder', icon: Target, description: 'Create and manage tutorials' },
    { path: '/tutorials', label: 'Library', icon: BookOpen, description: 'Browse tutorials' },
    { path: '/reports', label: 'Reports', icon: Code, description: 'Analytics and insights' },
    { path: '/profile', label: 'Profile', icon: Users, description: 'User settings' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-xl border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 rounded-xl flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">Zilliance</span>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className="text-[10px]">Enterprise</Badge>
            </div>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={isActive(item.path) ? 'default' : 'ghost'}
                  size="sm"
                  className={`px-4 py-2 rounded-xl ${isActive(item.path) ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' : 'text-purple-200 hover:text-purple-400 hover:bg-purple-900/30'}`}
                  onMouseEnter={() => {
                    if (item.path === '/tutorial-builder') import('@/pages/TutorialBuilder').catch(() => {});
                    if (item.path === '/reports') import('@/pages/Reports').catch(() => {});
                  }}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:block text-sm text-purple-200">{user.firstName} {user.lastName}</span>
              <Button variant="ghost" size="sm" onClick={onLogout} className="text-red-400 hover:text-red-300">
                <LogOut className="h-4 w-4 mr-1" />
                Sign out
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default EnhancedNavigation;

