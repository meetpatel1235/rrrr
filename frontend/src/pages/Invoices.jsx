
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { getInvoices, updateInvoice } from '../services/api';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Printer, Download } from 'lucide-react';

const Invoices = () => {
  const { isAdmin } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [paidAmount, setPaidAmount] = useState(0);

  // Fetch invoices data
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const data = await getInvoices();
        setInvoices(data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleStatusChange = async (invoiceId, status, paid = 0) => {
    try {
      const updatedInvoice = await updateInvoice(invoiceId, { 
        status, 
        paidAmount: paid 
      });
      
      // Update local state
      setInvoices(prev => 
        prev.map(inv => inv._id === invoiceId ? updatedInvoice : inv)
      );
      
      toast.success(`Invoice marked as ${status}`);
      
      if (isViewDialogOpen) {
        setCurrentInvoice(updatedInvoice);
      }
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!currentInvoice) return;
    
    const paid = Number(paidAmount);
    if (isNaN(paid) || paid <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    const total = currentInvoice.order.totalAmount;
    let status = 'partial';
    
    if (paid >= total) {
      status = 'paid';
      setPaidAmount(total);
    }
    
    await handleStatusChange(currentInvoice._id, status, paid);
  };

  const viewInvoice = (invoice) => {
    setCurrentInvoice(invoice);
    setPaidAmount(invoice.order.paidAmount || 0);
    setIsViewDialogOpen(true);
  };

  const printInvoice = () => {
    if (!currentInvoice) return;
    
    // Implementation would typically involve opening a print-friendly window/iframe
    toast.success('Preparing invoice for printing...');
    
    const invoiceWindow = window.open('', '_blank');
    if (invoiceWindow) {
      const invoiceContent = generateInvoiceHTML(currentInvoice);
      invoiceWindow.document.write(invoiceContent);
      invoiceWindow.document.close();
      invoiceWindow.focus();
      // Let the content load before printing
      setTimeout(() => {
        invoiceWindow.print();
        invoiceWindow.close();
      }, 250);
    } else {
      toast.error('Please allow pop-ups to print the invoice');
    }
  };

  // Generate HTML for printable invoice
  const generateInvoiceHTML = (invoice) => {
    const order = invoice.order;
    const createdDate = new Date(invoice.issuedDate).toLocaleDateString();
    const dueDate = new Date(invoice.dueDate).toLocaleDateString();
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .invoice-header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 28px; font-weight: bold; margin-bottom: 5px; }
          .invoice-title { font-size: 22px; margin-top: 0; color: #F97316; }
          .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .meta-left, .meta-right { width: 48%; }
          h3 { margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
          th { background-color: #f2f2f2; }
          .total-row { font-weight: bold; }
          .invoice-footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          .status-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-paid { background-color: #d1fae5; color: #065f46; }
          .status-partial { background-color: #fef3c7; color: #92400e; }
          .status-unpaid { background-color: #fee2e2; color: #b91c1c; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div class="company-name">રસોઈ વાસણ</div>
          <p class="invoice-title">INVOICE</p>
        </div>
        
        <div class="invoice-meta">
          <div class="meta-left">
            <h3>Invoice To:</h3>
            <p>
              <strong>${order.customerName}</strong><br>
              Phone: ${order.customerPhone}<br>
            </p>
          </div>
          <div class="meta-right">
            <h3>Invoice Details:</h3>
            <p>
              <strong>Invoice Number:</strong> ${invoice.invoiceNumber}<br>
              <strong>Order Number:</strong> ${order.orderNumber}<br>
              <strong>Date Issued:</strong> ${createdDate}<br>
              <strong>Due Date:</strong> ${dueDate}<br>
              <strong>Status:</strong> 
              <span class="status-badge status-${invoice.status}">
                ${invoice.status.toUpperCase()}
              </span>
            </p>
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
                <td>${item.item.name} (${item.item.nameGujarati})</td>
                <td>${item.quantity}</td>
                <td>₹${item.rate.toFixed(2)}</td>
                <td>₹${(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">Total</td>
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
      </body>
      </html>
    `;
  };

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
        <h1 className="text-2xl font-bold">Invoices</h1>
      </div>

      {invoices.length > 0 ? (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <Card key={invoice._id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">
                      Invoice #{invoice.invoiceNumber}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      Order #{invoice.order.orderNumber} | Customer: {invoice.order.customerName}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => viewInvoice(invoice)}
                    >
                      <FileText size={18} className="mr-2" />
                      View Invoice
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Date Issued</p>
                    <p>{formatDate(invoice.issuedDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p>{formatDate(invoice.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-medium">₹{invoice.order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-lg font-medium text-gray-500 mb-1">No invoices found</h3>
          <p className="text-gray-400 mb-4">
            Invoices will appear here once they are generated from completed orders.
          </p>
        </div>
      )}

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Invoice #{currentInvoice?.invoiceNumber}</DialogTitle>
            <DialogDescription>
              Invoice details for order #{currentInvoice?.order.orderNumber}
            </DialogDescription>
          </DialogHeader>
          
          {currentInvoice && (
            <div>
              <div className="flex flex-col md:flex-row justify-between mb-6">
                <div className="mb-4 md:mb-0">
                  <h3 className="text-sm font-medium text-gray-500">Invoice To:</h3>
                  <p className="font-medium">{currentInvoice.order.customerName}</p>
                  <p className="text-gray-500">Phone: {currentInvoice.order.customerPhone}</p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-medium text-gray-500">Invoice Details:</h3>
                  <p className="text-gray-700">
                    <span className="text-gray-500">Date:</span> {formatDate(currentInvoice.issuedDate)}
                  </p>
                  <p className="text-gray-700">
                    <span className="text-gray-500">Due Date:</span> {formatDate(currentInvoice.dueDate)}
                  </p>
                  <p>
                    <span className="text-gray-500">Status:</span>{' '}
                    <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                      currentInvoice.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : currentInvoice.status === 'partial'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {currentInvoice.status.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden mb-6">
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
                    {currentInvoice.order.items.map((item, idx) => (
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
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right border-t">
                        Total
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-right border-t">
                        ₹{currentInvoice.order.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right">
                        Paid Amount
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-right text-green-600">
                        ₹{(currentInvoice.order.paidAmount || 0).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm font-medium text-right">
                        Balance Due
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-right text-red-600">
                        ₹{(currentInvoice.order.totalAmount - (currentInvoice.order.paidAmount || 0)).toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              {isAdmin() && currentInvoice.status !== 'paid' && (
                <div className="mb-6 p-4 border rounded-md bg-gray-50">
                  <h3 className="font-medium mb-2">Record Payment</h3>
                  <form onSubmit={handlePayment} className="flex items-end gap-4">
                    <div className="flex-1">
                      <label htmlFor="paymentAmount" className="text-sm font-medium text-gray-700 block mb-1">
                        Payment Amount (₹)
                      </label>
                      <Input
                        id="paymentAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        required
                      />
                    </div>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700">
                      Record Payment
                    </Button>
                  </form>
                </div>
              )}
              
              <DialogFooter>
                <div className="flex items-center gap-2 w-full justify-between">
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={printInvoice}
                      className="flex items-center"
                    >
                      <Printer size={16} className="mr-2" />
                      Print
                    </Button>
                  </div>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Close</Button>
                  </DialogClose>
                </div>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Invoices;
