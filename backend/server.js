const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads (for local fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/portfolios', require('./routes/portfolioRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/applications', require('./routes/applicationRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/follow', require('./routes/followRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));

// Welcome/Status endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Project EARTH API',
    status: 'online',
    fallbackMediaUrl: '/uploads',
    env: {
      mongodb: !!process.env.MONGODB_URI,
      cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Global Error: ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
  // Close server & exit process
  // server.close(() => process.exit(1));
});
