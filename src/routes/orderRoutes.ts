import { Router } from 'express';
import { PrismaClient, CurrencyType, OrderType, OrderStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';

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

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get both wallets
      const fiatWallet = await tx.wallet.findFirst({
        where: { userId, currencyType: fiatCurrency }
      });

      const cryptoWallet = await tx.wallet.findFirst({
        where: { userId, currencyType: cryptoCurrency }
      });

      if (!fiatWallet || !cryptoWallet) {
        throw new Error('Wallets not found');
      }

      const totalFiatAmount = new Decimal(amount).mul(new Decimal(pricePerUnit));

      // Check balance
      if (type === 'BUY') {
        if (new Decimal(fiatWallet.balance).lessThan(totalFiatAmount)) {
          throw new Error('Insufficient fiat balance');
        }
      } else {
        if (new Decimal(cryptoWallet.balance).lessThan(new Decimal(amount))) {
          throw new Error('Insufficient crypto balance');
        }
      }

      // Update wallets
      if (type === 'BUY') {
        await tx.wallet.update({
          where: { id: fiatWallet.id },
          data: { balance: { decrement: totalFiatAmount } }
        });

        await tx.wallet.update({
          where: { id: cryptoWallet.id },
          data: { balance: { increment: amount } }
        });
      } else {
        await tx.wallet.update({
          where: { id: cryptoWallet.id },
          data: { balance: { decrement: amount } }
        });

        await tx.wallet.update({
          where: { id: fiatWallet.id },
          data: { balance: { increment: totalFiatAmount } }
        });
      }

      // Create order
      const order = await tx.order.create({
        data: {
          userId,
          type,
          cryptoCurrency,
          fiatCurrency,
          amount,
          pricePerUnit,
          status: 'COMPLETED'
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          fromWalletId: type === 'BUY' ? fiatWallet.id : cryptoWallet.id,
          toWalletId: type === 'BUY' ? cryptoWallet.id : fiatWallet.id,
          orderId: order.id,
          amount: type === 'BUY' ? amount : totalFiatAmount,
          type: 'TRADE',
          status: 'COMPLETED'
        }
      });

      return order;
    });

    res.json({ 
      message: 'Order executed successfully',
      order: result
    });
  } catch (error) {
    res.status(400).json({ 
      error: error instanceof Error ? error.message : 'Failed to create order' 
    });
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