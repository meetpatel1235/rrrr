const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

const inventoryRoutes = require("./routes/inventory");
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orders');
const User = require('./models/User'); // ✅ Import User model

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", authRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log("MongoDB connected");
  await createAdminIfNotExists(); // ✅ Create admin user on startup
})
.catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Function to create default admin
async function createAdminIfNotExists() {
  try {
    const existingAdmin = await User.findOne({ email: "admin@rasoi.com" });
    if (!existingAdmin) {
      const newAdmin = new User({
        email: "admin@rasoi.com",
        password: "admin123" // 🔒 Suggest using env variable or strong password
      });
      await newAdmin.save();
      console.log("✅ Default admin created: admin@rasoi.com / admin123");
    } else {
      console.log("✅ Admin user already exists");
    }
  } catch (err) {
    console.error("❌ Error creating admin user:", err);
  }
}
