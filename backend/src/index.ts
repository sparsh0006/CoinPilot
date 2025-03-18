import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dcaRoutes from './routes/dca';
import userRoutes from './routes/user'; // Import user routes
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dca-service';

app.use(express.json());


// Set CORS headers for cross-domain requests (needed for frontend integration)
app.use((req, res, next) => {
  // Allow requests from any origin for local development
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// API routes
app.use('/api/dca', dcaRoutes);
app.use('/api/users', userRoutes); // Use the correct user routes


mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  });