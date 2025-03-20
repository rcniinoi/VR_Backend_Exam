import { Router } from 'express';
import { PrismaClient, CurrencyType, OrderType, OrderStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: 'PENDING'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get user's orders
router.get('/my-orders', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create new order
router.post('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { type, cryptoCurrency, fiatCurrency, amount, pricePerUnit } = req.body;

    // Validate currencies
    if (!Object.values(CurrencyType).includes(cryptoCurrency) || 
        !Object.values(CurrencyType).includes(fiatCurrency)) {
      return res.status(400).json({ error: 'Invalid currency type' });
    }

    // Check if user has sufficient balance
    const walletToCheck = type === OrderType.BUY ? fiatCurrency : cryptoCurrency;
    const requiredAmount = type === OrderType.BUY ? amount * pricePerUnit : amount;

    const userWallet = await prisma.wallet.findFirst({
      where: {
        userId,
        currencyType: walletToCheck
      }
    });

    if (!userWallet || userWallet.balance < requiredAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        type,
        cryptoCurrency,
        fiatCurrency,
        amount,
        pricePerUnit,
        status: OrderStatus.PENDING
      }
    });

    res.status(201).json({ 
      message: 'Order created successfully',
      order 
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to create order' });
  }
});

// Cancel order
router.post('/:id/cancel', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const orderId = req.params.id;

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId,
        status: OrderStatus.PENDING
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or already processed' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED }
    });

    res.json({ 
      message: 'Order cancelled successfully',
      order: updatedOrder
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to cancel order' });
  }
});

export const orderRoutes = router; 