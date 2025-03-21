import { Router } from 'express';
import { PrismaClient, CurrencyType } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Create user
router.post('/', async (req, res) => {
  try {
    // Create user
    const user = await prisma.user.create({
      data: req.body
    });

    // Create wallets for all currencies
    const currencies = [
      CurrencyType.BTC,
      CurrencyType.ETH,
      CurrencyType.XRP,
      CurrencyType.DOGE,
      CurrencyType.THB,
      CurrencyType.USD
    ];

    // Create wallets in transaction
    await prisma.$transaction(
      currencies.map(currency => 
        prisma.wallet.create({
          data: {
            userId: user.id,
            currencyType: currency,
            balance: 0
          }
        })
      )
    );

    // Return user with their wallets
    const userWithWallets = await prisma.user.findUnique({
      where: { id: user.id },
      include: { wallets: true }
    });

    res.json(userWithWallets);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(400).json({ error: 'Failed to create user' });
    }
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: 'Failed to get user' });
  }
});

export const userRoutes = router; 