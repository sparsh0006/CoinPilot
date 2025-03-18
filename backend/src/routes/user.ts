// src/routes/user.ts
import express from 'express';
import { User } from '../models/User';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

const router = express.Router();

// Create or update user
router.post('/', async (req, res) => {
  try {
    let { address } = req.body;

    // Trim and validate address
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Wallet address is required and must be a string' });
    }

    address = address.trim(); // Ensure there are no leading/trailing spaces

    // Check if user already exists
    let user = await User.findOne({ address });

    if (user) {
      logger.info(`Existing user logged in: ${address}`);
      return res.json(user);
    }

    // Create new user
    user = await User.create({ address });
    logger.info(`New user created: ${address}`);

    res.status(201).json(user);
  } catch (error) {
    logger.error('Failed to create/update user:', error);
    res.status(500).json({ error: 'Failed to create/update user' });
  }
});

// Get user by address
router.get('/:address', async (req, res) => {
  try {
    let { address } = req.params;

    // Trim and validate address
    if (!address || typeof address !== 'string') {
      return res.status(400).json({ error: 'Valid wallet address is required' });
    }

    address = address.trim(); // Ensure there are no leading/trailing spaces

    const user = await User.findOne({ address });

    if (!user) {
      logger.warn(`User not found for address: ${address}`);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Failed to get user by address:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get user by ID
router.get('/id/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.warn(`Invalid user ID format: ${id}`);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(id);

    if (!user) {
      logger.warn(`User not found for ID: ${id}`);
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Failed to get user by ID:', error);
    res.status(500).json({ error: 'Failed to get user by ID' });
  }
});

export default router;
