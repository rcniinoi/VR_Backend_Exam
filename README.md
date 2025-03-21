# VR Backend Exam - Crypto Trading Platform

A backend service for a cryptocurrency trading platform that handles user wallets and orders.

## Features

- User Authentication
- Wallet Management (BTC, ETH, XRP, DOGE, THB, USD)
- Order Creation and Management (Buy/Sell)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone https://github.com/rcniinoi/VR_Backend_Exam.git
cd VR_Backend_Exam
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/vr_crypto_db"
PORT=3001
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma db seed
```

5. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Users
- `POST /api/users` - Create a new user
- `GET /api/users/:id` - Get user details

### Wallets (Protected Routes)
- `GET /api/wallets` - Get all wallets for authenticated user
- `GET /api/wallets/:id/balance` - Get wallet balance

### Orders (Protected Routes)
- `POST /api/orders` - Create a new order
- `GET /api/orders/my-orders` - Get user's orders

### Authentication
All protected routes require the `X-User-ID` header with a valid user ID.

## Example Usage

1. Create a buy order:
```bash
curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -H "X-User-ID: YOUR_USER_ID" \
  -d '{
    "type": "BUY",
    "cryptoCurrency": "BTC",
    "fiatCurrency": "THB",
    "amount": 0.1,
    "pricePerUnit": 1000000
  }'
```

2. Check wallet balance:
```bash
curl http://localhost:3001/api/wallets/WALLET_ID/balance \
  -H "X-User-ID: YOUR_USER_ID"
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## Testing

```bash
npm test
```

## Database Design

The database design is documented using ER diagrams in two formats:
- Detailed documentation: [ER_Diagram.md](docs/ER_Diagram.md)
- Visual diagram: [ER_Diagram_Visual.md](docs/ER_Diagram_Visual.md)

### Entity Relationships

- **User to Wallet (1:N)**: Each user can have multiple wallets (one per currency)
- **User to Order (1:N)**: Users can create multiple buy/sell orders
- **Wallet to Transaction (1:N)**: Wallets can be involved in multiple transactions
- **Order to Transaction (1:1)**: Each completed order generates one transaction
- **User to ExternalWallet (1:N)**: Users can save multiple external wallet addresses

## Tech Stack

- Node.js with TypeScript
- Express.js for API server
- Prisma ORM for database management
- PostgreSQL database

## Project Structure

```
.
├── src/
│   ├── controllers/     # Request handlers
│   ├── models/         # Database models and relationships
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── types/          # TypeScript type definitions
├── prisma/
│   └── schema.prisma   # Database schema
└── docs/
    ├── ER_Diagram.md           # Detailed ER documentation
    └── ER_Diagram_Visual.md    # Visual ER diagram
```

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd cryptocurrency-exchange
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. Set up the database:
   ```bash
   npx prisma migrate dev
   ```

5. Seed the database:
   ```bash
   npx prisma db seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:seed`: Seed the database

## API Documentation

### User Management
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - User login
- GET `/api/user/profile` - Get user profile

### Wallet Operations
- GET `/api/wallets` - List user's wallets
- GET `/api/wallets/:id/balance` - Get wallet balance

### Trading
- POST `/api/orders`