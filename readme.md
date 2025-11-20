# Super Jump Game

A blockchain-integrated jump game built with Farcaster Mini App SDK and Reown wallet connector.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Development

Run the development server:

```bash
npm run dev
```

This will start a Vite development server (usually on `http://localhost:5173`).

### 3. Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder.

### 4. Preview Production Build

```bash
npm run preview
```

## Project Structure

```
.
├── index.html          # Main HTML file
├── wallet.js           # Wallet integration (Farcaster & Reown)
├── game.js             # Game logic and classes
├── package.json        # Dependencies
└── README.md          # This file
```

## Features

- **Dual Wallet Support**: 
  - Farcaster Mini App wallet (when opened in Farcaster)
  - Reown AppKit (when opened in browser)

- **Blockchain Integration**:
  - On-chain score submission
  - Leaderboard stored on Base network
  - ETH rewards for high scores

- **Game Features**:
  - Dynamic platform generation
  - Coin collection
  - Particle effects
  - Audio feedback
  - Responsive design

## Environment Variables

The following are hardcoded but can be moved to environment variables:

- `GAME_CONTRACT_ADDRESS`: Smart contract address
- `NEYNAR_API_KEY`: Farcaster API key
- `REOWN_PROJECT_ID`: Reown project ID

## Deployment

This project can be deployed to:
- Vercel
- Netlify
- Any static hosting service

Make sure to:
1. Build the project first: `npm run build`
2. Deploy the `dist` folder
3. Configure your hosting to serve `index.html` for all routes

## Technologies Used

- **Frontend**: Vanilla JavaScript, HTML5 Canvas
- **Blockchain**: ethers.js, @wagmi/core
- **Wallets**: @reown/appkit, @farcaster/miniapp-sdk
- **Build Tool**: Vite

## License

MIT