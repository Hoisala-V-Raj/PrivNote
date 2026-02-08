import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import noteRoutes from './api/notes';
import { errorHandler } from './middleware/errorHandler';
import { AppDataSource } from './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
});

const createNoteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // limit each IP to 20 note creations per hour
  message: 'Too many notes created from this IP, please try again later',
});

const summarizeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 summarizations per minute
  message: 'Too many summarization requests, please try again later',
});

// Middleware
app.use(cors({
  origin: [process.env.CORS_ORIGIN || 'http://localhost:3000',    'http://localhost', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(limiter);


// Routes
app.use('/api/notes', createNoteLimiter, noteRoutes);
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: 'connected' });
});

// Error handling
app.use(errorHandler);

// Initialize database and start server
AppDataSource.initialize()
  .then(() => {
    console.log('✓ Database connected successfully');
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('✗ Database connection failed:', error);
    process.exit(1);
  });
