import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token');
        return;
      }
      setStatus('verifying');
      try {
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
        const res = await fetch(`${apiBase}/api/v1/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'Verification failed');
        setStatus('success');
        setMessage('Email verified. You can now sign in.');
        setTimeout(() => navigate('/login'), 1500);
      } catch (e) {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Verification failed');
      }
    })();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Email Verification</CardTitle>
            <CardDescription>Confirming your email address…</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={status === 'error' ? 'text-red-600' : 'text-green-700'}>
              {message || (status === 'verifying' ? 'Verifying…' : '')}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between w-full">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500">Back to login</Link>
            <Link to="/register" className="text-sm text-blue-600 hover:text-blue-500">Create account</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;

