import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const router = Router();
const prisma = new PrismaClient();

// Get all wallets for user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const wallets = await prisma.wallet.findMany({
      where: { userId }
    });
    res.json({ wallets });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallets' });
  }
});

// Get wallet balance
router.get('/:id/balance', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const wallet = await prisma.wallet.findFirst({
      where: {
        id: req.params.id,
        userId
      }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ balance: wallet.balance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balance' });
  }
});

// Update wallet balance (for testing only)
router.put('/:id/balance', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { balance } = req.body;
    const walletId = req.params.id;

    const wallet = await prisma.wallet.findFirst({
      where: {
        id: walletId,
        userId
      }
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: walletId },
      data: { balance }
    });

    res.json({ wallet: updatedWallet });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update balance' });
  }
});

export const walletRoutes = router; 