
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Package, 
  ClipboardList, 
  FileText, 
  Settings,
  Users
} from 'lucide-react';

const Sidebar = () => {
  const { isAdmin } = useAuth();

  return (
    <aside className="bg-white shadow-md w-16 md:w-64 min-h-screen fixed top-16 left-0">
      <div className="py-4">
        <ul className="space-y-2 px-2">
          <li>
            <NavLink 
              to="/dashboard" 
              className={({ isActive }) => 
                `flex items-center space-x-2 p-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 hover:bg-primary-light hover:text-primary'
                }`
              }
            >
              <Home size={20} />
              <span className="hidden md:inline">Dashboard</span>
            </NavLink>
          </li>
          
          {isAdmin() && (
            <li>
              <NavLink 
                to="/inventory" 
                className={({ isActive }) => 
                  `flex items-center space-x-2 p-2 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-primary text-white' 
                      : 'text-gray-700 hover:bg-primary-light hover:text-primary'
                  }`
                }
              >
                <Package size={20} />
                <span className="hidden md:inline">Inventory</span>
              </NavLink>
            </li>
          )}
          
          <li>
            <NavLink 
              to="/orders" 
              className={({ isActive }) => 
                `flex items-center space-x-2 p-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 hover:bg-primary-light hover:text-primary'
                }`
              }
            >
              <ClipboardList size={20} />
              <span className="hidden md:inline">Orders</span>
            </NavLink>
          </li>
          
          <li>
            <NavLink 
              to="/invoices" 
              className={({ isActive }) => 
                `flex items-center space-x-2 p-2 rounded-md transition-colors ${
                  isActive 
                    ? 'bg-primary text-white' 
                    : 'text-gray-700 hover:bg-primary-light hover:text-primary'
                }`
              }
            >
              <FileText size={20} />
              <span className="hidden md:inline">Invoices</span>
            </NavLink>
          </li>
          
          {isAdmin() && (
            <>
              <li>
                <NavLink 
                  to="/users" 
                  className={({ isActive }) => 
                    `flex items-center space-x-2 p-2 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-primary text-white' 
                        : 'text-gray-700 hover:bg-primary-light hover:text-primary'
                    }`
                  }
                >
                  <Users size={20} />
                  <span className="hidden md:inline">Users</span>
                </NavLink>
              </li>
              
              <li>
                <NavLink 
                  to="/settings" 
                  className={({ isActive }) => 
                    `flex items-center space-x-2 p-2 rounded-md transition-colors ${
                      isActive 
                        ? 'bg-primary text-white' 
                        : 'text-gray-700 hover:bg-primary-light hover:text-primary'
                    }`
                  }
                >
                  <Settings size={20} />
                  <span className="hidden md:inline">Settings</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
