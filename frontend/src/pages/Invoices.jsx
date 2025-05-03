import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { getOrders, generateInvoice } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  FileText,
  Download,
  Eye,
  Printer
} from 'lucide-react';

const Invoices = () => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [dueDate, setDueDate] = useState('');

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

  const handleGenerateInvoice = async (order) => {
    try {
      const invoiceData = {
        order: order._id,
        dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        status: 'unpaid'
      };
      
      await generateInvoice(invoiceData);
      toast.success('Invoice generated successfully');
      setIsViewDialogOpen(false);
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    }
  };

  const viewOrderDetails = (order) => {
    setCurrentOrder(order);
    setIsViewDialogOpen(true);
  };

  const printInvoice = (order) => {
    const invoiceWindow = window.open('', '_blank');
    if (!invoiceWindow) {
      toast.error('Please allow pop-ups to print the invoice');
      return;
    }

    const invoiceContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.orderNumber}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px;
            color: #333;
          }
          .invoice-header { 
            text-align: center; 
            margin-bottom: 30px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
          }
          .company-name { 
            font-size: 24px; 
            font-weight: bold; 
            margin-bottom: 5px;
            color: #1a1a1a;
          }
          .invoice-title { 
            font-size: 20px; 
            color: #666;
            margin-top: 0;
          }
          .invoice-meta { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px;
          }
          .meta-left, .meta-right { 
            width: 48%;
          }
          .meta-section {
            margin-bottom: 15px;
          }
          .meta-section h3 { 
            margin: 0 0 5px 0;
            font-size: 14px;
            color: #666;
          }
          .meta-section p { 
            margin: 0;
            font-size: 14px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 12px;
            text-align: left;
          }
          th { 
            background-color: #f8f9fa;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            color: #666;
          }
          td {
            font-size: 14px;
          }
          .total-row { 
            font-weight: bold;
            background-color: #f8f9fa;
          }
          .invoice-footer { 
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 2px solid #eee;
            padding-top: 20px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-completed { background-color: #d1fae5; color: #065f46; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-upcoming { background-color: #dbeafe; color: #1e40af; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="company-name">રસોઈ વાસણ</div>
          <p class="invoice-title">INVOICE</p>
        </div>
        
        <div class="invoice-meta">
          <div class="meta-left">
            <div class="meta-section">
              <h3>Customer Details:</h3>
              <p>
                <strong>${order.customerName}</strong><br>
                Phone: ${order.phone}<br>
                Address: ${order.address || 'N/A'}
              </p>
            </div>
            <div class="meta-section">
              <h3>Event Details:</h3>
              <p>
                Event Date: ${formatDate(order.eventDate)}<br>
                Return Date: ${formatDate(order.returnDate)}
              </p>
            </div>
          </div>
          <div class="meta-right">
            <div class="meta-section">
              <h3>Invoice Details:</h3>
              <p>
                <strong>Order Number:</strong> ${order.orderNumber}<br>
                <strong>Date:</strong> ${formatDate(order.createdAt)}<br>
                <strong>Status:</strong> 
                <span class="status-badge status-${order.status}">
                  ${order.status.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(item => `
              <tr>
                <td>${item.itemName} (${item.itemNameGujarati})</td>
                <td>${item.quantity}</td>
                <td>₹${item.rate.toFixed(2)}</td>
                <td>₹${(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">Total Amount</td>
              <td>₹${order.totalAmount.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3" style="text-align: right;">Paid Amount</td>
              <td>₹${(order.paidAmount || 0).toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">Balance Due</td>
              <td>₹${(order.totalAmount - (order.paidAmount || 0)).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="invoice-footer">
          <p>Thank you for your business!</p>
          <p>If you have any questions about this invoice, please contact us.</p>
        </div>

        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px;">
            Print Invoice
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #e5e7eb; color: #333; border: none; border-radius: 4px; cursor: pointer;">
            Back
          </button>
        </div>
      </body>
      </html>
    `;

    invoiceWindow.document.write(invoiceContent);
    invoiceWindow.document.close();
    invoiceWindow.focus();
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
        <h1 className="text-2xl font-bold">Invoices</h1>
      </div>

      {/* Orders List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {orders.length === 0 ? (
            <li className="px-6 py-4 text-center text-gray-500">
              No orders found
            </li>
          ) : (
            orders.map((order) => (
              <li key={order._id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        Order #{order.orderNumber || order._id.slice(-4)}
                      </p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' : 
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
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
                  <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => viewOrderDetails(order)}
                    >
                      <Eye size={16} className="mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printInvoice(order)}
                    >
                      <Printer size={16} className="mr-2" />
                      Print
                    </Button>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    currentOrder.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    currentOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
                  </span>
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

              {currentOrder.status === 'completed' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date
                  </label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              )}
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Close</Button>
                </DialogClose>
                {currentOrder.status === 'completed' && (
                  <>
                    <Button
                      onClick={() => printInvoice(currentOrder)}
                      variant="outline"
                      className="mr-2"
                    >
                      <Printer size={16} className="mr-2" />
                      Print
                    </Button>
                    <Button
                      onClick={() => handleGenerateInvoice(currentOrder)}
                      className="bg-secondary hover:bg-secondary-hover"
                    >
                      <FileText size={16} className="mr-2" />
                      Generate Invoice
                    </Button>
                  </>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
