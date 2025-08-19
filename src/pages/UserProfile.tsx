import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const UserProfile: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>User profile content will be implemented here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;