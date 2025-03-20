import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

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

// Transfer between wallets
router.post('/transfer', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { fromWalletId, toWalletId, amount } = req.body;

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get source wallet
      const fromWallet = await tx.wallet.findFirst({
        where: { id: fromWalletId, userId }
      });

      if (!fromWallet) {
        throw new Error('Source wallet not found');
      }

      if (fromWallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Get destination wallet
      const toWallet = await tx.wallet.findUnique({
        where: { id: toWalletId }
      });

      if (!toWallet) {
        throw new Error('Destination wallet not found');
      }

      if (fromWallet.currencyType !== toWallet.currencyType) {
        throw new Error('Cannot transfer between different currencies');
      }

      // Update wallets
      await tx.wallet.update({
        where: { id: fromWalletId },
        data: { balance: { decrement: amount } }
      });

      await tx.wallet.update({
        where: { id: toWalletId },
        data: { balance: { increment: amount } }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          fromWalletId,
          toWalletId,
          amount,
          type: 'INTERNAL_TRANSFER',
          status: 'COMPLETED'
        }
      });

      return transaction;
    });

    res.json({ 
      message: 'Transfer successful',
      transaction: result
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'An unknown error occurred' });
    }
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