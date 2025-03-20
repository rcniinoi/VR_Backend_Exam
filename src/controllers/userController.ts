import { Request, Response } from 'express';
import { UserModel } from '../models/userModel';
import bcrypt from 'bcryptjs';

export class UserController {
  // Register new user
  static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user with wallets
      const user = await UserModel.createUserWithWallets({
        email,
        passwordHash,
        firstName,
        lastName,
      });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });
    } catch (error) {
      res.status(400).json({ error: 'Failed to create user' });
    }
  }

  // Get user profile with wallets
  static async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.id; // Assuming auth middleware sets user
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await UserModel.getUserWithWallets(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          wallets: user.wallets,
        },
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  }

  // Get user's orders
  static async getUserOrders(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const userWithOrders = await UserModel.getUserWithOrders(userId);
      if (!userWithOrders) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ orders: userWithOrders.orders });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user orders' });
    }
  }
} 