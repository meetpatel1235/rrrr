import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-background-dark">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="ml-16 md:ml-64 pt-16 px-4 w-full min-h-screen bg-background-dark">
          <div className="py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
