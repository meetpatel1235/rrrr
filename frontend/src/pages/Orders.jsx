
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { 
  getOrders, 
  getInventory, 
  addOrder, 
  updateOrder,
  updateOrderStatus,
  generateInvoice
} from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { 
  Plus, 
  Calendar,
  ClipboardList,
  CheckCircle,
  FileText,
  ChevronDown,
  Trash
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Orders = () => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([{ item: '', quantity: 1, rate: 0 }]);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    eventDate: '',
    returnDate: '',
    totalAmount: 0
  });

  // Fetch orders and inventory data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersData, inventoryData] = await Promise.all([
          getOrders(),
          getInventory()
        ]);
        setOrders(ordersData);
        setInventory(inventoryData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...orderItems];
    
    if (field === 'item') {
      const selectedItem = inventory.find(item => item._id === value);
      updatedItems[index] = {
        ...updatedItems[index],
        item: value,
        rate: selectedItem ? selectedItem.price : 0
      };
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: field === 'quantity' ? Number(value) : value
      };
    }
    
    setOrderItems(updatedItems);
    
    // Calculate total
    const total = updatedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.rate);
    }, 0);
    
    setFormData(prev => ({
      ...prev,
      totalAmount: total
    }));
  };

  const addItemRow = () => {
    setOrderItems([...orderItems, { item: '', quantity: 1, rate: 0 }]);
  };

  const removeItemRow = (index) => {
    if (orderItems.length === 1) return;
    
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
    
    // Recalculate total
    const total = updatedItems.reduce((sum, item) => {
      return sum + (item.quantity * item.rate);
    }, 0);
    
    setFormData(prev => ({
      ...prev,
      totalAmount: total
    }));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    
    if (orderItems.some(item => !item.item)) {
      toast.error('Please select all items');
      return;
    }
    
    try {
      const orderData = {
        ...formData,
        items: orderItems,
        status: 'upcoming',
        paidAmount: 0
      };
      
      const newOrder = await addOrder(orderData);
      setOrders(prev => [...prev, newOrder]);
      toast.success('Order added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding order:', error);
      toast.error('Failed to add order');
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      eventDate: '',
      returnDate: '',
      totalAmount: 0
    });
    setOrderItems([{ item: '', quantity: 1, rate: 0 }]);
  };

  const handleStatusChange = async (order, newStatus) => {
    try {
      await updateOrderStatus(order._id, newStatus);
      
      // Update local state
      setOrders(prev => 
        prev.map(o => o._id === order._id ? { ...o, status: newStatus } : o)
      );
      
      toast.success(`Order marked as ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleGenerateInvoice = async (order) => {
    try {
      const invoiceData = {
        order: order._id,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        status: 'unpaid'
      };
      
      await generateInvoice(invoiceData);
      toast.success('Invoice generated successfully');
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    }
  };

  const viewOrderDetails = (order) => {
    setCurrentOrder(order);
    setIsViewDialogOpen(true);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredOrders = orders.filter(order => order.status === activeTab);

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
        <h1 className="text-2xl font-bold">Orders Management</h1>
        {isAdmin() && (
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-primary hover:bg-primary-hover"
          >
            <Plus size={18} className="mr-2" />
            Add Order
          </Button>
        )}
      </div>

      <Tabs 
        defaultValue="upcoming" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Upcoming</span>
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <ClipboardList size={16} />
            <span>Pending</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>Completed</span>
          </TabsTrigger>
        </TabsList>
        
        {['upcoming', 'pending', 'completed'].map((status) => (
          <TabsContent key={status} value={status}>
            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order._id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg">
                            {order.customerName}
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            Order #{order.orderNumber} | Phone: {order.customerPhone}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline"
                            onClick={() => viewOrderDetails(order)}
                          >
                            View Details
                          </Button>
                          {isAdmin() && status === 'upcoming' && (
                            <Button
                              variant="outline"
                              className="border-orange-500 text-orange-500 hover:bg-orange-50"
                              onClick={() => handleStatusChange(order, 'pending')}
                            >
                              Mark as Pending
                            </Button>
                          )}
                          {isAdmin() && status === 'pending' && (
                            <Button
                              variant="outline"
                              className="border-green-500 text-green-500 hover:bg-green-50"
                              onClick={() => handleStatusChange(order, 'completed')}
                            >
                              Mark as Completed
                            </Button>
                          )}
                          {isAdmin() && status === 'completed' && (
                            <Button
                              onClick={() => handleGenerateInvoice(order)}
                              className="bg-secondary hover:bg-secondary-hover flex items-center gap-2"
                            >
                              <FileText size={16} />
                              Generate Invoice
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Event Date</p>
                          <p>{formatDate(order.eventDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Return Date</p>
                          <p>{formatDate(order.returnDate)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Total Items</p>
                          <p>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Amount</p>
                          <p className="font-medium">₹{order.totalAmount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                {status === 'upcoming' && (
                  <>
                    <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-500 mb-1">No upcoming orders</h3>
                  </>
                )}
                {status === 'pending' && (
                  <>
                    <ClipboardList size={48} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-500 mb-1">No pending orders</h3>
                  </>
                )}
                {status === 'completed' && (
                  <>
                    <CheckCircle size={48} className="mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-500 mb-1">No completed orders</h3>
                  </>
                )}
                <p className="text-gray-400 mb-4">
                  Orders with status '{status}' will appear here.
                </p>
                {isAdmin() && status === 'upcoming' && (
                  <Button 
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-primary hover:bg-primary-hover"
                  >
                    <Plus size={18} className="mr-2" />
                    Create New Order
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Add Order Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
            <DialogDescription>
              Add a new order with customer information and items.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="customerName" className="text-sm font-medium">Customer Name *</label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="customerPhone" className="text-sm font-medium">Phone Number *</label>
                  <Input
                    id="customerPhone"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="eventDate" className="text-sm font-medium">Event Date *</label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="returnDate" className="text-sm font-medium">Return Date *</label>
                  <Input
                    id="returnDate"
                    name="returnDate"
                    type="date"
                    value={formData.returnDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Order Items *</h3>
                  <Button 
                    type="button"
                    onClick={addItemRow}
                    variant="outline"
                    size="sm"
                    className="flex items-center text-xs"
                  >
                    <Plus size={14} className="mr-1" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-1/2">
                        <Select
                          value={item.item}
                          onValueChange={(value) => handleItemChange(index, 'item', value)}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select item" />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.map((invItem) => (
                              <SelectItem key={invItem._id} value={invItem._id}>
                                {invItem.name} ({invItem.nameGujarati})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-1/6">
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          placeholder="Qty"
                          required
                        />
                      </div>
                      <div className="w-1/6">
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          placeholder="Rate"
                          readOnly
                        />
                      </div>
                      <div className="w-1/6 text-right">
                        ₹{(item.quantity * item.rate).toFixed(2)}
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="flex-shrink-0"
                        disabled={orderItems.length === 1}
                        onClick={() => removeItemRow(index)}
                      >
                        <Trash size={16} className="text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-end mt-4 pt-2 border-t">
                  <div className="text-right">
                    <span className="block text-sm text-gray-500">Total Amount</span>
                    <span className="font-bold text-lg">₹{formData.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" className="bg-primary hover:bg-primary-hover">
                Create Order
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{currentOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          {currentOrder && (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span className="block text-sm text-gray-500">Customer</span>
                  <span className="font-medium">{currentOrder.customerName}</span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500">Phone</span>
                  <span className="font-medium">{currentOrder.customerPhone}</span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500">Event Date</span>
                  <span className="font-medium">{formatDate(currentOrder.eventDate)}</span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500">Return Date</span>
                  <span className="font-medium">{formatDate(currentOrder.returnDate)}</span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500">Status</span>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                    currentOrder.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : currentOrder.status === 'pending'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {currentOrder.status}
                  </span>
                </div>
                <div>
                  <span className="block text-sm text-gray-500">Created By</span>
                  <span className="font-medium">
                    {currentOrder.createdBy?.username || 'System'}
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium mb-2">Order Items</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Item
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Quantity
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rate
                        </th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentOrder.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.item.name} ({item.item.nameGujarati})
                            </div>
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                            ₹{item.rate.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                            ₹{(item.quantity * item.rate).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right">
                          Total
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-right">
                          ₹{currentOrder.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Close</Button>
                </DialogClose>
                {isAdmin() && currentOrder.status === 'upcoming' && (
                  <Button
                    className="border-orange-500 text-orange-500 hover:bg-orange-50"
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(currentOrder, 'pending');
                      setIsViewDialogOpen(false);
                    }}
                  >
                    Mark as Pending
                  </Button>
                )}
                {isAdmin() && currentOrder.status === 'pending' && (
                  <Button
                    className="border-green-500 text-green-500 hover:bg-green-50"
                    variant="outline"
                    onClick={() => {
                      handleStatusChange(currentOrder, 'completed');
                      setIsViewDialogOpen(false);
                    }}
                  >
                    Mark as Completed
                  </Button>
                )}
                {isAdmin() && currentOrder.status === 'completed' && (
                  <Button
                    onClick={() => {
                      handleGenerateInvoice(currentOrder);
                      setIsViewDialogOpen(false);
                    }}
                    className="bg-secondary hover:bg-secondary-hover"
                  >
                    <FileText size={16} className="mr-2" />
                    Generate Invoice
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
