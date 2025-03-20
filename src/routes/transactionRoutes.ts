import { Router } from 'express';
import { PrismaClient, TransactionType, TransactionStatus } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get user's transaction history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    // Get all user's wallets
    const userWallets = await prisma.wallet.findMany({
      where: { userId },
      select: { id: true }
    });

    const walletIds = userWallets.map(w => w.id);

    // Get transactions where user is sender or receiver
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromWalletId: { in: walletIds } },
          { toWalletId: { in: walletIds } }
        ]
      },
      include: {
        fromWallet: true,
        toWallet: true,
        order: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

// Create external transfer
router.post('/external', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { fromWalletId, toAddress, amount } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // Check source wallet
      const fromWallet = await tx.wallet.findFirst({
        where: { id: fromWalletId, userId }
      });

      if (!fromWallet) {
        throw new Error('Source wallet not found');
      }

      if (fromWallet.balance < amount) {
        throw new Error('Insufficient balance');
      }

      // Verify external address exists
      const externalWallet = await tx.externalWallet.findFirst({
        where: {
          address: toAddress,
          currencyType: fromWallet.currencyType
        }
      });

      if (!externalWallet) {
        throw new Error('Invalid external wallet address');
      }

      // Update wallet balance
      await tx.wallet.update({
        where: { id: fromWalletId },
        data: { balance: { decrement: amount } }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          fromWalletId,
          toWalletId: fromWalletId, // Same wallet for external transfers
          amount,
          type: TransactionType.EXTERNAL_TRANSFER,
          status: TransactionStatus.COMPLETED
        }
      });

      return transaction;
    });

    res.json({
      message: 'External transfer successful',
      transaction: result
    });
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Failed to process external transfer' });
  }
});

export const transactionRoutes = router; 