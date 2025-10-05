import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { authManager } from './lib/auth';
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import TutorialBuilder from './pages/TutorialBuilder';
import UserProfile from './pages/UserProfile';
import DashboardLayout from './components/DashboardLayout';
import HeroSection from './components/HeroSection';
import EnhancedNavigation from './components/EnhancedNavigation';
import NotFound from './pages/NotFound';
import TutorialRecord from './pages/TutorialRecord';
import Tutorials from './pages/Tutorials';
import TutorialAuto from './pages/TutorialAuto';
import TutorialView from './pages/TutorialView';
import VerifyEmail from './pages/VerifyEmail';
import Reports from './pages/Reports';
import AppBuilder from './pages/AppBuilder';
import WorkflowMonitor from './pages/WorkflowMonitor';
import ApiGateway from './pages/ApiGateway';
import CrmSuite from './pages/CrmSuite';
import VideoManagement from './pages/VideoManagement';
import './styles/animations.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const demoModeEnabled = import.meta.env.VITE_DEMO_MODE === 'true';
  const isAuthenticated = demoModeEnabled || authManager.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (redirects authenticated users)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = authManager.isAuthenticated();
  
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

// Landing Page Component
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900">
      <EnhancedNavigation user={null} onLogout={() => {}} />
      <HeroSection />
      
      {/* Additional Landing Sections */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
              Why Choose{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Zilliance
              </span>
              ?
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              We've built the most powerful integrated platform that combines the best features 
              from multiple enterprise tools into one seamless experience.
            </p>
          </div>
          
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Unified Platform",
                description: "One platform for all your automation, video, API, and tutorial needs",
                icon: "🚀",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                title: "Enterprise Grade",
                description: "Built with enterprise security, scalability, and reliability in mind",
                icon: "🏢",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                title: "Cost Effective",
                description: "Save 40-60% compared to using multiple specialized tools",
                icon: "💰",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                title: "AI Powered",
                description: "Intelligent automation and content recommendations",
                icon: "🤖",
                gradient: "from-orange-500 to-red-500"
              },
              {
                title: "Global Scale",
                description: "Built to handle millions of users and petabytes of data",
                icon: "🌍",
                gradient: "from-indigo-500 to-blue-500"
              },
              {
                title: "24/7 Support",
                description: "Enterprise-grade support with dedicated account managers",
                icon: "🎧",
                gradient: "from-teal-500 to-green-500"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-8 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.gradient} rounded-2xl flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform duration-300`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-white/70 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl text-white/70 mb-8">
            Join thousands of enterprises already using Zilliance to streamline their operations
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="group bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-105">
              Start Free Trial
            </button>
            <button className="group border-white/20 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-2xl backdrop-blur-md transition-all duration-300">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

function App() {
  // Apply dark theme globally
  useEffect(() => {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            {/* Landing Page Route */}
            <Route path="/landing" element={<LandingPage />} />

            {/* Public Routes */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } />
            <Route path="/reset-password" element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } />
            <Route path="/verify-email" element={
              <PublicRoute>
                <VerifyEmail />
              </PublicRoute>
            } />

            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Index />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/tutorial-builder" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TutorialBuilder />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <UserProfile />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/tutorial/record" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TutorialRecord />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/tutorials" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Tutorials />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/tutorial/auto" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TutorialAuto />
                </DashboardLayout>
              </ProtectedRoute>
            } />
            <Route path="/tutorial/:id" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TutorialView />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/reports" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Reports />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/app-builder" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AppBuilder />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/workflow-monitor" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <WorkflowMonitor />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/api-gateway" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ApiGateway />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/crm" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CrmSuite />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            <Route path="/video-management" element={
              <ProtectedRoute>
                <DashboardLayout>
                  <VideoManagement />
                </DashboardLayout>
              </ProtectedRoute>
            } />

            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </TooltipProvider>
      
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
