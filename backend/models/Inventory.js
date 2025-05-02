const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema({
    name: { type: String, required: true },
    nameGujarati: { type: String, required: true },
    category: { type: String, required: true },
    totalQuantity: { type: Number, required: true },
    unit: { type: String, required: true },
    price: { type: Number, required: true },
  });

module.exports = mongoose.model("Inventory", InventorySchema);
