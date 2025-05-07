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
    customerAddress: '',
    eventDate: '',
    returnDate: '',
    totalAmount: 0
  });

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getOrders();
        console.log('Fetched orders:', data);
        
        // Format the orders data
        const formattedOrders = data.map(order => ({
          ...order,
          orderNumber: order.orderNumber || `ORD${order._id.slice(-4)}`,
          customerName: order.customerName || 'N/A',
          contactPerson: order.contactPerson || order.customerName || 'N/A',
          phone: order.phone || 'N/A',
          eventDate: order.eventDate || new Date(),
          returnDate: order.returnDate || new Date(),
          items: order.items.map(item => ({
            ...item,
            item: item.item || {
              _id: 'unknown',
              name: 'Unknown Item',
              nameGujarati: '',
              price: 0
            },
            quantity: item.quantity || 0,
            rate: item.rate || 0
          })),
          totalAmount: order.totalAmount || 0,
          status: order.status || 'upcoming',
          paidAmount: order.paidAmount || 0
        }));
        
        setOrders(formattedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Fetch inventory items on component mount
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await getInventory();
        setInventory(data);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        toast.error('Failed to fetch inventory items');
      }
    };

    fetchInventory();
  }, []);

  // Filter orders based on status
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  // Render order items
  const renderOrderItems = (items) => {
    if (!items || items.length === 0) return null;
    
    return items.map((item, index) => (
      <div key={index} className="text-sm text-gray-600">
        {item.item?.name || 'Unknown Item'} - {item.quantity || 0} x ₹{item.rate || 0}
      </div>
    ));
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      // Format date in DD/MM/YYYY format
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    return `₹${Number(amount).toFixed(2)}`;
  };

  // Render order status badge
  const renderStatusBadge = (status) => {
    const statusColors = {
      upcoming: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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

  const getStartOfDay = (date) => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    // Validate customer information
    if (!formData.customerName || !formData.customerPhone || !formData.customerAddress) {
      toast.error('Please fill in all customer information');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(formData.customerPhone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    // Validate dates
    if (!formData.eventDate || !formData.returnDate) {
      toast.error('Please select both event and return dates');
      return;
    }

    try {
      // Get current date (start of day)
      const today = getStartOfDay(new Date());
      
      // Format and validate event date
      const eventDate = new Date(formData.eventDate);
      const eventDateStart = getStartOfDay(eventDate);
      
      // Format and validate return date
      const returnDate = new Date(formData.returnDate);
      const returnDateStart = getStartOfDay(returnDate);

      // Validate event date is not in the past
      if (eventDateStart < today) {
        toast.error('Event date cannot be in the past');
        return;
      }

      // Validate return date is not before event date
      if (returnDateStart < eventDateStart) {
        toast.error('Return date must be after event date');
        return;
      }

      // Get item details from inventory and validate rates
      const itemsWithDetails = orderItems.map(item => {
        const inventoryItem = inventory.find(inv => inv._id === item.item);
        if (!inventoryItem) {
          throw new Error('Selected item not found in inventory');
        }
        return {
          item: item.item,
          itemName: inventoryItem.name,
          itemNameGujarati: inventoryItem.nameGujarati || '',
          quantity: parseInt(item.quantity, 10),
          rate: parseFloat(inventoryItem.price)
        };
      });

      // Calculate total amount
      const totalAmount = itemsWithDetails.reduce((sum, item) => {
        return sum + (item.quantity * item.rate);
      }, 0);

      // Prepare order data with ISO string dates
      const orderData = {
        customerName: formData.customerName.trim(),
        phone: formData.customerPhone.trim(),
        address: formData.customerAddress.trim(),
        eventDate: eventDate.toISOString(),
        returnDate: returnDate.toISOString(),
        items: itemsWithDetails,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        status: 'upcoming',
        paidAmount: 0
      };

      // Create the order
      const newOrder = await addOrder(orderData);
      setOrders(prev => [...prev, newOrder]);
      toast.success('Order added successfully');
      setIsAddDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error adding order:', error);
      toast.error(error.message || 'Failed to add order. Please check all fields and try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          Add New Order
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['all', 'upcoming', 'pending', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${
                activeTab === tab
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Orders List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredOrders.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No orders found
            </li>
          ) : (
            filteredOrders.map((order) => (
              <li key={order._id} className="px-6 py-4">
                <div 
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => viewOrderDetails(order)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        Order #{order.orderNumber || order._id.slice(-4)}
                      </p>
                      {renderStatusBadge(order.status)}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-900">
                        {order.customerName || 'N/A'}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Event:</span> {formatDate(order.eventDate)}
                        </div>
                        <div>
                          <span className="font-medium">Return:</span> {formatDate(order.returnDate)}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

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
            <div className="space-y-4">
              {/* Customer Name */}
              <div className="space-y-2">
                <label htmlFor="customerName" className="text-sm font-medium">Customer Name *</label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleChange}
                  required
                  placeholder="Enter customer's full name"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label htmlFor="customerPhone" className="text-sm font-medium">Phone Number *</label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleChange}
                  required
                  placeholder="Enter 10-digit phone number"
                  pattern="[0-9]{10}"
                />
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label htmlFor="customerAddress" className="text-sm font-medium">Address *</label>
                <Textarea
                  id="customerAddress"
                  name="customerAddress"
                  value={formData.customerAddress}
                  onChange={handleChange}
                  required
                  placeholder="Enter customer's full address"
                />
              </div>

              {/* Event Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="eventDate" className="text-sm font-medium">Event Date *</label>
                  <Input
                    id="eventDate"
                    name="eventDate"
                    type="date"
                    value={formData.eventDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
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
                    min={formData.eventDate || new Date().toISOString().split('T')[0]}
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
                                {invItem.name} ({invItem.nameGujarati}) - ₹{invItem.price}
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
                  <span className="font-medium">{currentOrder.phone}</span>
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
                  {renderStatusBadge(currentOrder.status)}
                </div>
                <div>
                  <span className="block text-sm text-gray-500">Created At</span>
                  <span className="font-medium">{formatDate(currentOrder.createdAt)}</span>
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
                              {item.itemName} ({item.itemNameGujarati})
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
