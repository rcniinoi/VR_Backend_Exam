import { PrismaClient } from '@prisma/client';
import { CurrencyType } from '../types/types';

const prisma = new PrismaClient();

export class UserModel {
  // Get user with all their wallets
  static async getUserWithWallets(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
      },
    });
  }

  // Get user with their orders
  static async getUserWithOrders(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  // Get user's wallet by currency type
  static async getUserWalletByCurrency(userId: string, currencyType: CurrencyType) {
    return prisma.wallet.findUnique({
      where: {
        userId_currencyType: {
          userId: userId,
          currencyType: currencyType,
        },
      },
    });
  }

  // Create user with initial wallets
  static async createUserWithWallets(userData: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: userData,
      });

      // Create default wallets for supported currencies
      const currencies = [CurrencyType.BTC, CurrencyType.ETH, CurrencyType.XRP, CurrencyType.DOGE, CurrencyType.THB, CurrencyType.USD];
      const walletPromises = currencies.map((currency) =>
        tx.wallet.create({
          data: {
            userId: user.id,
            currencyType: currency,
            balance: 0,
          },
        })
      );

      await Promise.all(walletPromises);

      return user;
    });
  }
} 