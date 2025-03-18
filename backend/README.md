# DCA Service

A Dollar Cost Averaging (DCA) service that supports multiple blockchain platforms (Injective and TON) for automated periodic investments.

## Features

- Support for multiple blockchain platforms (Injective and TON)
- Configurable investment frequency (minute, hour, day)
- User investment tracking
- RESTful API for managing DCA plans
- Dashboard support for viewing investment statistics

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- Injective or TON wallet

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your configuration (see `.env.example`)
4. Build the TypeScript code:
   ```bash
   npm run build
   ```
5. Start the service:
   ```bash
   npm start
   ```

## API Endpoints

### Create DCA Plan
```
POST /api/dca/plans
{
  "userId": "user_id",
  "amount": 5,
  "frequency": "minute|hour|day",
  "toAddress": "destination_wallet_address"
}
```

### Stop DCA Plan
```
POST /api/dca/plans/:planId/stop
```

### Get User Plans
```
GET /api/dca/users/:userId/plans
```

### Get User Total Investment
```
GET /api/dca/users/:userId/total-investment
```

## Configuration

The service can be configured using environment variables:

- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `BLOCKCHAIN_PLUGIN`: Choose between 'injective' or 'ton'
- `INJECTIVE_NETWORK`: Injective network (mainnet/testnet)
- `TON_ENDPOINT`: TON API endpoint

## Development

To run in development mode with hot reloading:
```bash
npm run dev
```

## License

ISC# helix-backend
# Helix-backend
# backend
