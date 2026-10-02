const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    // Only log the host in non-production to avoid leaking infrastructure details
    if (process.env.NODE_ENV !== 'production') {
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } else {
      console.log('MongoDB Connected');
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
