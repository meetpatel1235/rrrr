const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    customerName: String,
    items: [
        {
            name: String,
            quantity: Number,
            unitPrice: Number
        }
    ],
    totalAmount: Number,
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Order", OrderSchema);
