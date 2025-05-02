
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-primary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl">રસોઈ વાસણ</span>
            <span className="hidden md:inline-block text-sm">| Inventory Management</span>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex space-x-4">
                <Link 
                  to="/dashboard" 
                  className="px-3 py-2 rounded-md hover:bg-primary-hover transition-colors"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/orders" 
                  className="px-3 py-2 rounded-md hover:bg-primary-hover transition-colors"
                >
                  Orders
                </Link>
                {isAdmin() && (
                  <Link 
                    to="/inventory" 
                    className="px-3 py-2 rounded-md hover:bg-primary-hover transition-colors"
                  >
                    Inventory
                  </Link>
                )}
                <Link 
                  to="/invoices" 
                  className="px-3 py-2 rounded-md hover:bg-primary-hover transition-colors"
                >
                  Invoices
                </Link>
              </div>

              <div className="flex items-center space-x-2">
                <div className="flex items-center gap-2">
                  <User size={18} />
                  <span className="hidden md:inline-block">{user.username}</span>
                  <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                    {user.role}
                  </span>
                </div>
                <Button 
                  onClick={handleLogout} 
                  variant="ghost" 
                  className="text-white hover:bg-primary-hover"
                >
                  <LogOut size={18} />
                  <span className="hidden md:inline ml-2">Logout</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
