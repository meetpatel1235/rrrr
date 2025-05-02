
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-dark">
      <div className="text-center">
        <h1 className="text-8xl font-bold text-primary mb-4">404</h1>
        <p className="text-2xl font-medium mb-6">Page Not Found</p>
        <p className="text-gray-500 mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to="/dashboard">
          <Button className="bg-primary hover:bg-primary-hover">
            <Home size={18} className="mr-2" />
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
