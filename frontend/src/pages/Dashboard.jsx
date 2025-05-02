
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardCard from '../components/DashboardCard';
import { getInventory, getOrders } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Calendar, Inbox, FileText } from 'lucide-react';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalItems: 0,
    upcomingOrders: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch orders
        const orders = await getOrders();
        const upcoming = orders.filter(order => order.status === 'upcoming').length;
        const pending = orders.filter(order => order.status === 'pending').length;
        const completed = orders.filter(order => order.status === 'completed').length;
        
        // Get recent orders
        const recent = orders.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 5);
        
        let items = 0;
        
        // Admin can see inventory stats
        if (isAdmin()) {
          const inventory = await getInventory();
          items = inventory.length;
        }
        
        setStats({
          totalItems: items,
          upcomingOrders: upcoming,
          pendingOrders: pending,
          completedOrders: completed
        });
        
        setRecentOrders(recent);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAdmin]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Welcome, {user.username}!</h1>
        <span className="text-sm text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isAdmin() && (
          <DashboardCard 
            title="Total Items"
            value={stats.totalItems}
            icon={<Package size={20} />}
            className="border-l-4 border-blue-500"
          />
        )}
        
        <DashboardCard 
          title="Upcoming Orders"
          value={stats.upcomingOrders}
          icon={<Calendar size={20} />}
          className="border-l-4 border-yellow-500"
        />
        
        <DashboardCard 
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={<Inbox size={20} />}
          className="border-l-4 border-orange-500"
        />
        
        <DashboardCard 
          title="Completed Orders"
          value={stats.completedOrders}
          icon={<FileText size={20} />}
          className="border-l-4 border-green-500"
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="py-3 px-4 font-medium">Order #</th>
                      <th className="py-3 px-4 font-medium">Customer</th>
                      <th className="py-3 px-4 font-medium">Date</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{order.orderNumber}</td>
                        <td className="py-3 px-4">{order.customerName}</td>
                        <td className="py-3 px-4">{formatDate(order.eventDate)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'pending'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">₹{order.totalAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                No recent orders found.
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Orders this month</span>
                  <span className="font-bold">
                    {recentOrders.filter(order => {
                      const orderDate = new Date(order.createdAt);
                      const now = new Date();
                      return orderDate.getMonth() === now.getMonth() &&
                             orderDate.getFullYear() === now.getFullYear();
                    }).length}
                  </span>
                </div>
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: '70%' }}></div>
                </div>
              </div>
              
              {isAdmin() && (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Low stock items</span>
                    <span className="font-bold text-orange-500">3</span>
                  </div>
                  <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className="bg-orange-500 h-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed ratio</span>
                  <span className="font-bold text-green-500">
                    {stats.totalOrders === 0 
                      ? '0%' 
                      : Math.round((stats.completedOrders / 
                          (stats.upcomingOrders + stats.pendingOrders + stats.completedOrders)) * 100) + '%'
                    }
                  </span>
                </div>
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ 
                    width: stats.totalOrders === 0 
                      ? '0%' 
                      : `${Math.round((stats.completedOrders / 
                          (stats.upcomingOrders + stats.pendingOrders + stats.completedOrders)) * 100)}%`
                  }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
