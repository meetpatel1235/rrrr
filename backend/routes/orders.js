const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const auth = require("../middleware/auth");

// GET all orders
router.get("/", auth, async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// POST a new order
router.post("/", auth, async (req, res) => {
  try {
    // Validate fields before saving the order
    const { customerName, contactPerson, phone, eventDate, returnDate, items } = req.body;

    if (!customerName || !contactPerson || !phone || !items || items.length === 0) {
      return res.status(400).json({ error: "All fields are required and items must be provided" });
    }

    const newOrder = new Order({
      customerName,
      contactPerson,
      phone,
      eventDate,
      returnDate,
      items,
    });

    await newOrder.save();
    res.status(201).json(newOrder);  // Set the status code to 201 (Created)
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
