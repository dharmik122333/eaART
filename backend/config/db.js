const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/project_earth';
    console.log(`Connecting to MongoDB using URI: ${connStr.replace(/:([^@]+)@/, ':****@')}`);
    
    const conn = await mongoose.connect(connStr, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    // Do not crash the server immediately to allow demo mode or mock operations if requested
    console.log('Continuing server execution... (database features may be limited)');
  }
};

module.exports = connectDB;
