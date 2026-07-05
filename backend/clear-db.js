const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '.env') });

const clearDatabase = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb+srv://dharmik:uePyltgXoWCCOx6L@cluster0.mnk9tku.mongodb.net/project_earth?appName=Cluster0';
  console.log('Connecting to database...');
  
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Successfully connected to database cluster.');

    const collections = Object.keys(mongoose.connection.collections);
    for (const name of collections) {
      console.log(`Clearing collection: ${name}`);
      await mongoose.connection.collections[name].deleteMany({});
    }

    console.log('All database tables cleared successfully! Wiped all accounts, posts, comments, likes, and messages.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to wipe database:', error.message);
    process.exit(1);
  }
};

clearDatabase();
