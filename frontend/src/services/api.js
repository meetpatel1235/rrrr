// Get base URL - use relative path for production
const API_URL = 'https://madhuramdecobackend.onrender.com/api';

// Get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Generic fetch function
const fetchApi = async (endpoint, options = {}) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...options.headers
    };
    
    const config = {
      ...options,
      headers
    };
    
    console.log('Making API request to:', `${API_URL}${endpoint}`);
    console.log('Request config:', {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body ? JSON.parse(config.body) : undefined
    });

    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Try to parse the response as JSON
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (!response.ok) {
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      
      // If we got JSON error data, use it
      if (typeof data === 'object' && data !== null) {
        throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
      }
      
      // Otherwise use the text response or status
      throw new Error(typeof data === 'string' ? data : `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', {
      endpoint,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Inventory API calls
export const getInventory = () => fetchApi('/inventory');

export const addInventoryItem = (item) => fetchApi('/inventory/add', {
  method: 'POST',
  body: JSON.stringify(item)
});

export const updateInventoryItem = (id, item) => fetchApi(`/inventory/${id}`, {
  method: 'PUT',
  body: JSON.stringify(item)
});

export const deleteInventoryItem = (id) => fetchApi(`/inventory/delete/${id}`, {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Order API calls
export const getOrders = (status) => {
  const query = status ? `?status=${status}` : '';
  return fetchApi(`/orders${query}`);
};

export const addOrder = async (orderData) => {
  try {
    console.log('API: Adding order with data:', orderData);
    
    // Validate required fields
    if (!orderData.customerName) throw new Error('Customer name is required');
    if (!orderData.phone) throw new Error('Phone number is required');
    if (!orderData.address) throw new Error('Address is required');
    if (!orderData.eventDate) throw new Error('Event date is required');
    if (!orderData.returnDate) throw new Error('Return date is required');
    if (!orderData.items || !Array.isArray(orderData.items) || orderData.items.length === 0) {
      throw new Error('At least one item is required');
    }
    if (typeof orderData.totalAmount !== 'number' || orderData.totalAmount <= 0) {
      throw new Error('Valid total amount is required');
    }

    // Validate items
    for (const item of orderData.items) {
      if (!item.item) throw new Error('Item reference is required for all items');
      if (!item.itemName) throw new Error('Item name is required for all items');
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        throw new Error('Valid quantity is required for all items');
      }
      if (typeof item.rate !== 'number' || item.rate < 0) {
        throw new Error('Valid rate is required for all items');
      }
    }

    const response = await fetchApi('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });

    console.log('API: Order creation response:', response);
    return response;
  } catch (error) {
    console.error('API: Error in addOrder:', {
      error: error.message,
      stack: error.stack,
      orderData
    });
    throw error;
  }
};

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

// Auth API calls
export const registerUser = async (userData) => {
  try {
    console.log('API: Registering user with data:', userData);
    const response = await fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    console.log('API: Registration response:', response);
    return response;
  } catch (error) {
    console.error('API: Error in registerUser:', error);
    throw error;
  }
};

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
  updateInvoice,
  registerUser
};
