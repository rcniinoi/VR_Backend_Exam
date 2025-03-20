import { PrismaClient, CurrencyType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      firstName: 'John',
      lastName: 'Doe',
      status: 'ACTIVE'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      passwordHash: await bcrypt.hash('password123', 10),
      firstName: 'Jane',
      lastName: 'Smith',
      status: 'ACTIVE'
    }
  });

  // Create wallets for users
  const currencies = [CurrencyType.BTC, CurrencyType.ETH, CurrencyType.XRP, CurrencyType.DOGE, CurrencyType.THB, CurrencyType.USD];
  
  for (const user of [user1, user2]) {
    for (const currency of currencies) {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          currencyType: currency,
          balance: currency === CurrencyType.THB ? 100000 : (currency === CurrencyType.USD ? 3000 : 1),
        }
      });
    }
  }

  // Create some test orders
  const order1 = await prisma.order.create({
    data: {
      userId: user1.id,
      type: 'BUY',
      cryptoCurrency: CurrencyType.BTC,
      fiatCurrency: CurrencyType.THB,
      amount: 0.1,
      pricePerUnit: 1000000,
      status: 'PENDING'
    }
  });

  const order2 = await prisma.order.create({
    data: {
      userId: user2.id,
      type: 'SELL',
      cryptoCurrency: CurrencyType.ETH,
      fiatCurrency: CurrencyType.USD,
      amount: 1,
      pricePerUnit: 3000,
      status: 'PENDING'
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 