const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");

// ✅ Removed auth middleware from GET route
router.get("/", async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

router.post("/add", async (req, res) => {
    console.log("POST /api/inventory/add hit");
  
    const { name, nameGujarati, category, totalQuantity, unit, price } = req.body;
  
    // Log the data received from the frontend to ensure the price is coming through correctly
    console.log("Received Data:", req.body);
  
    if (!name || !nameGujarati || !category || !totalQuantity || !unit || !price) {
      return res.status(400).json({ message: "All fields are required" });
    }
  
    // Ensure price is correctly converted to a number
    const priceNumber = Number(price);
    console.log("Converted Price:", priceNumber); // Check conversion
  
    if (isNaN(priceNumber)) {
      return res.status(400).json({ message: "Price must be a valid number" });
    }
  
    try {
      const newItem = new Inventory({
        name,
        nameGujarati,
        category,
        totalQuantity: Number(totalQuantity),
        unit,
        price: priceNumber, // Ensure price is a valid number
      });
  
      // Log the new item before saving to check if all data is correct
      console.log("New Item to Save:", newItem);
  
      await newItem.save();
      res.status(201).json({
        _id: newItem._id,
        name: newItem.name,
        nameGujarati: newItem.nameGujarati,
        category: newItem.category,
        quantity: newItem.totalQuantity,
        unit: newItem.unit,
        price: newItem.price,
      });
    } catch (error) {
      console.error("Error saving inventory item:", error);
      res.status(500).json({ message: "Failed to add item", error: error.message });
    }
  });
  
module.exports = router;
