const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User'); // adjust path if needed

const MONGO_URI = 'mongodb+srv://meethadvani6:bPVuj0CPZ0GZPiNC@rasoicluster.i2e0zh4.mongodb.net/rasoiDB?retryWrites=true&w=majority'; // 👈 replace with your actual DB URI

const seedAdminUser = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const existing = await User.findOne({ email: 'admin@rasoi.com' });
    if (existing) {
      console.log('Admin user already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 10);

    await User.create({
      email: 'admin@rasoi.com',
      password: hashedPassword,
    });

    console.log('✅ Admin user created');
    mongoose.connection.close();
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    mongoose.connection.close();
  }
};

seedAdminUser();
