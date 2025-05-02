
// Get base URL - use relative path for production
const API_URL = '/api';

// Get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Generic fetch function
const fetchApi = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };
  
  const config = {
    ...options,
    headers
  };
  
  const response = await fetch(`${API_URL}${endpoint}`, config);
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  
  return data;
};

// Inventory API calls
export const getInventory = () => fetchApi('/inventory');

export const addInventoryItem = (item) => fetchApi('/inventory', {
  method: 'POST',
  body: JSON.stringify(item)
});

export const updateInventoryItem = (id, item) => fetchApi(`/inventory/${id}`, {
  method: 'PUT',
  body: JSON.stringify(item)
});

export const deleteInventoryItem = (id) => fetchApi(`/inventory/${id}`, {
  method: 'DELETE'
});

// Order API calls
export const getOrders = (status) => {
  const query = status ? `?status=${status}` : '';
  return fetchApi(`/orders${query}`);
};

export const addOrder = (order) => fetchApi('/orders', {
  method: 'POST',
  body: JSON.stringify(order)
});

export const updateOrder = (id, order) => fetchApi(`/orders/${id}`, {
  method: 'PUT',
  body: JSON.stringify(order)
});

export const updateOrderStatus = (id, status) => fetchApi(`/orders/${id}/status`, {
  method: 'PUT',
  body: JSON.stringify({ status })
});

// Invoice API calls
export const getInvoices = () => fetchApi('/invoices');

export const generateInvoice = (orderData) => fetchApi('/invoices', {
  method: 'POST',
  body: JSON.stringify(orderData)
});

export const updateInvoice = (id, invoiceData) => fetchApi(`/invoices/${id}`, {
  method: 'PUT',
  body: JSON.stringify(invoiceData)
});

export default {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getOrders,
  addOrder,
  updateOrder,
  updateOrderStatus,
  getInvoices,
  generateInvoice,
  updateInvoice
};
