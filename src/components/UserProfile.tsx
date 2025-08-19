import React, { useState, useEffect } from 'react';
import { authManager } from '../lib/auth';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, User, Mail, Calendar, Shield, Edit, Save, X } from 'lucide-react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  createdAt: string;
}

const UserProfile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setEditForm({
          firstName: parsedUser.firstName,
          lastName: parsedUser.lastName,
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
    });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:3001/api/v1/users/${user._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeaders(),
        },
        body: JSON.stringify({
          firstName: editForm.firstName,
          lastName: editForm.lastName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Update failed');
      }

      if (data.success) {
        // Update local user data
        const updatedUser = { ...user, ...editForm };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        setSuccess('Profile updated successfully!');
        setIsEditing(false);
      } else {
        throw new Error(data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>User Profile</span>
              </CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </div>
            
            {!isEditing ? (
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={handleSave} size="sm" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
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

          {/* Profile Picture Placeholder */}
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-12 w-12 text-gray-400" />
            </div>
          </div>

          {/* User Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              {isEditing ? (
                <Input
                  id="firstName"
                  name="firstName"
                  value={editForm.firstName}
                  onChange={handleInputChange}
                  placeholder="First name"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border">
                  {user.firstName}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              {isEditing ? (
                <Input
                  id="lastName"
                  name="lastName"
                  value={editForm.lastName}
                  onChange={handleInputChange}
                  placeholder="Last name"
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-md border">
                  {user.lastName}
                </div>
              )}
            </div>
          </div>

          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label>Email Address</Label>
            <div className="p-3 bg-gray-50 rounded-md border flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span>{user.email}</span>
              {user.isEmailVerified ? (
                <Badge variant="secondary" className="ml-auto">
                  Verified
                </Badge>
              ) : (
                <Badge variant="destructive" className="ml-auto">
                  Unverified
                </Badge>
              )}
            </div>
          </div>

          {/* Role and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="p-3 bg-gray-50 rounded-md border flex items-center space-x-2">
                <Shield className="h-4 w-4 text-gray-400" />
                <span className="capitalize">{user.role}</span>
                <Badge 
                  variant={user.role === 'admin' ? 'destructive' : 'secondary'} 
                  className="ml-auto"
                >
                  {user.role === 'admin' ? 'Administrator' : 'User'}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Member Since</Label>
              <div className="p-3 bg-gray-50 rounded-md border flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="pt-4 border-t">
            <div className="flex flex-col space-y-2">
              <Button variant="outline" className="justify-start">
                <Mail className="mr-2 h-4 w-4" />
                Change Email
              </Button>
              
              <Button variant="outline" className="justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Change Password
              </Button>
              
              <Button variant="outline" className="justify-start">
                <User className="mr-2 h-4 w-4" />
                Privacy Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;