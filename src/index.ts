import express from 'express';
import cors from 'cors';
import { userRoutes } from './routes/userRoutes';
import { walletRoutes } from './routes/walletRoutes';
import { orderRoutes } from './routes/orderRoutes';
import { transactionRoutes } from './routes/transactionRoutes';
import { auth } from './middleware/auth';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Public routes
app.use('/api/users', userRoutes);

// Protected routes
app.use('/api/wallets', auth, walletRoutes);
app.use('/api/orders', auth, orderRoutes);
app.use('/api/transactions', auth, transactionRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
}); 