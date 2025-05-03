const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const auth = require("../middleware/auth");

// GET all orders
router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'items.item',
        select: 'name nameGujarati price'
      })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    // Format the orders data
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber || `ORD${String(order._id).slice(-4)}`,
      customerName: order.customerName || 'N/A',
      contactPerson: order.contactPerson || order.customerName || 'N/A',
      phone: order.phone || 'N/A',
      eventDate: order.eventDate || new Date(),
      returnDate: order.returnDate || new Date(),
      items: order.items.map(item => ({
        _id: item._id,
        item: item.item ? {
          _id: item.item._id,
          name: item.item.name || 'Unknown Item',
          nameGujarati: item.item.nameGujarati || '',
          price: item.item.price || 0
        } : {
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
      paidAmount: order.paidAmount || 0,
      createdBy: order.createdBy ? {
        _id: order.createdBy._id,
        name: order.createdBy.name
      } : null,
      createdAt: order.createdAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// POST a new order
router.post("/", auth, async (req, res) => {
  try {
    console.log('Received order data:', req.body);
    console.log('User from auth:', req.user);

    const { 
      customerName, 
      phone, 
      address,
      eventDate, 
      returnDate, 
      items,
      totalAmount,
      status,
      paidAmount 
    } = req.body;

    // Validate required fields
    if (!customerName) {
      return res.status(400).json({ error: "Customer name is required" });
    }
    if (!phone) {
      return res.status(400).json({ error: "Phone number is required" });
    }
    if (!address) {
      return res.status(400).json({ error: "Address is required" });
    }
    if (!eventDate) {
      return res.status(400).json({ error: "Event date is required" });
    }
    if (!returnDate) {
      return res.status(400).json({ error: "Return date is required" });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
      return res.status(400).json({ error: "Valid total amount is required" });
    }

    // Validate items
    for (const item of items) {
      if (!item.item) {
        return res.status(400).json({ error: "Item reference is required for all items" });
      }
      if (!item.itemName) {
        return res.status(400).json({ error: "Item name is required for all items" });
      }
      if (typeof item.quantity !== 'number' || item.quantity <= 0) {
        return res.status(400).json({ error: "Valid quantity is required for all items" });
      }
      if (typeof item.rate !== 'number' || item.rate < 0) {
        return res.status(400).json({ error: "Valid rate is required for all items" });
      }
    }

    // Format items to include names
    const formattedItems = items.map(item => ({
      item: item.item,
      itemName: item.itemName,
      quantity: item.quantity,
      rate: item.rate
    }));

    // Create new order
    const newOrder = new Order({
      customerName,
      phone,
      address,
      eventDate,
      returnDate,
      items: formattedItems,
      totalAmount,
      status: status || 'upcoming',
      paidAmount: paidAmount || 0,
      createdBy: req.user.userId // Use userId from auth middleware
    });

    console.log('Creating new order:', newOrder);

    const savedOrder = await newOrder.save();
    
    // Format the response
    const formattedOrder = {
      _id: savedOrder._id,
      orderNumber: savedOrder.orderNumber,
      customerName: savedOrder.customerName,
      phone: savedOrder.phone,
      address: savedOrder.address,
      eventDate: savedOrder.eventDate,
      returnDate: savedOrder.returnDate,
      items: savedOrder.items.map(item => ({
        _id: item._id,
        item: item.item,
        itemName: item.itemName,
        quantity: item.quantity,
        rate: item.rate
      })),
      totalAmount: savedOrder.totalAmount,
      status: savedOrder.status,
      paidAmount: savedOrder.paidAmount,
      createdAt: savedOrder.createdAt
    };

    res.status(201).json(formattedOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: "Validation error", 
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(500).json({ 
      error: "Failed to create order", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update order status
router.put("/:id/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('items.item', 'name nameGujarati price')
     .populate('createdBy', 'name');

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Format the response
    const formattedOrder = {
      _id: order._id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      contactPerson: order.contactPerson,
      phone: order.phone,
      eventDate: order.eventDate,
      returnDate: order.returnDate,
      items: order.items.map(item => ({
        _id: item._id,
        item: item.item ? {
          _id: item.item._id,
          name: item.item.name,
          nameGujarati: item.item.nameGujarati,
          price: item.item.price
        } : null,
        quantity: item.quantity,
        rate: item.rate
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      paidAmount: order.paidAmount,
      createdBy: order.createdBy ? {
        _id: order.createdBy._id,
        name: order.createdBy.name
      } : null,
      createdAt: order.createdAt
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
});

module.exports = router;
