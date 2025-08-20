import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authManager } from '../lib/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, Eye, EyeOff, Sparkles, Crown } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Demo mode login - bypasses backend for easier testing
  const handleDemoLogin = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create demo user data
      const demoUser = {
        id: 'demo_admin_123',
        email: 'demo@zilliance.com',
        firstName: 'Demo',
        lastName: 'Admin',
        role: 'admin',
        isEmailVerified: true,
        permissions: ['read:tutorials', 'write:tutorials', 'delete:tutorials', 'read:users', 'write:users', 'read:analytics', 'admin:system']
      };

      // Store demo tokens
      authManager.setToken({
        access_token: `demo_access_token_${Date.now()}`,
        refresh_token: `demo_refresh_token_${Date.now()}`,
        expires_at: Date.now() + 3600000, // 1 hour from now
        user_id: demoUser.id
      });
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(demoUser));
      
      setSuccess('Demo login successful! Redirecting...');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error('Demo login error:', error);
      setError('Demo login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Login failed');
      }

      if (data.success) {
        // Store tokens
        authManager.setToken({
          access_token: data.data.tokens.accessToken,
          refresh_token: data.data.tokens.refreshToken,
          expires_at: Date.now() + (data.data.tokens.expiresIn * 1000),
          user_id: data.data.user.id
        });
        
        // Store user data
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        setSuccess('Login successful! Redirecting...');
        
        // Redirect to dashboard after a short delay
        setTimeout(() => {
          navigate('/');
        }, 1000);
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-600 via-pink-600 to-cyan-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome to Zilliance</h1>
          <p className="text-lg text-purple-200">
            Sign in to your enterprise automation platform
          </p>
        </div>

        <Card className="glass-card border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-purple-200">Sign In</CardTitle>
            <CardDescription className="text-purple-300">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-200">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  className="bg-slate-800 border-purple-500/30 text-white placeholder-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-purple-200">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    disabled={isLoading}
                    className="bg-slate-800 border-purple-500/30 text-white placeholder-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-purple-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-purple-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-purple-400 hover:text-purple-300"
                  disabled={isLoading}
                >
                  Forgot your password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            {/* Demo Login Button */}
            <div className="mt-6">
              <Button
                onClick={handleDemoLogin}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white border-0"
                disabled={isLoading}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {isLoading ? 'Signing in...' : 'Try Demo Mode'}
              </Button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-purple-300">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-medium text-purple-400 hover:text-purple-300"
                >
                  Sign up
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-purple-900/30 rounded-lg border border-purple-500/20">
              <h3 className="text-sm font-medium text-purple-200 mb-2">Demo Credentials:</h3>
              <div className="text-xs text-purple-300 space-y-1">
                <div><strong>Email:</strong> owner@zilliance.com</div>
                <div><strong>Password:</strong> ChangeMe!234</div>
                <div className="text-purple-400 mt-2">Or use the Demo Mode button above for instant access!</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;