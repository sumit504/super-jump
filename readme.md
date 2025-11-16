# 🎮 Super Jump - Farcaster Mini App

A blockchain-powered jumping game built for Farcaster with Base network integration and ETH rewards.

## 🌟 Features

- 🎯 **Fun Gameplay** - Jump on platforms, collect coins, beat high scores
- 💰 **ETH Rewards** - Score 30+ points to earn real ETH rewards
- 🏆 **On-Chain Leaderboard** - Compete with players globally
- 🔗 **Wallet Integration** - Connect with MetaMask, Rainbow, Coinbase Wallet
- 📱 **Farcaster Native** - Seamlessly integrates with Farcaster frames
- ⚡ **Base Network** - Fast and cheap transactions on Base L2

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ ([Download](https://nodejs.org/))
- A Web3 wallet (MetaMask, Rainbow, etc.)
- Some ETH on Base network for gas fees

### Installation

```bash
# 1. Download/clone the project
cd super-jump

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

The game will open automatically at `http://localhost:3000`

---

## 🎮 How to Play

1. **Connect Wallet** - Click "Connect Wallet" and choose your wallet
2. **Start Game** - Click "Play Game" and confirm transaction
3. **Controls**:
   - **Desktop**: Click left/right OR use A/D keys
   - **Mobile**: Tap left/right sides
4. **Score 30+** points to earn ETH rewards!

---

## 📁 Project Structure

```
super-jump/
├── index.html           # Main HTML
├── main.js             # Wallet & blockchain
├── game.js             # Game engine
├── package.json        # Dependencies
├── vite.config.js      # Build config
└── README.md           # This file
```

---

## 🛠️ Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview build
```

---

## 🔗 Smart Contract

**Network**: Base Mainnet  
**Address**: `0x603b3b1a946b9ff14280e8581539e07808dc5d0d`

### Functions
- `startGame()` - Start new session
- `submitScore()` - Submit to leaderboard
- `claimReward()` - Claim ETH
- `getTopPlayers()` - Get leaderboard

---

## 🌐 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
npm run build
vercel --prod
```

### Netlify
```bash
npm run build
# Upload dist/ folder
```

---

## 💰 Rewards System

- **Minimum Score**: 30 points
- **Requirement**: Farcaster account
- **Limit**: One claim per day per FID
- **Amount**: ~0.00000851 ETH per claim

---

## 🐛 Troubleshooting

### npm install fails
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port 3000 in use
```bash
npm run dev -- --port 3001
```

### Wallet not connecting
1. Install wallet extension
2. Switch to Base network
3. Refresh page
4. Check console (F12)

### Vite config error
Replace `vite.config.js` with:
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    open: true
  }
});
```

---

## 📱 Farcaster Integration

Frame metadata included for easy sharing on Farcaster. Update URLs after deployment.

---

## 🔐 Security

- ✅ No private keys stored
- ✅ Secure wallet connections
- ✅ Verified smart contract
- ✅ Open source

**Never share your seed phrase!**

---

## 📚 Documentation

- **QUICKSTART.md** - Step-by-step setup
- **CHANGES.md** - ESM to local imports migration
- **PROJECT_OVERVIEW.md** - Complete overview
- **INSTALL_NOW.txt** - Quick install guide

---

## 🎓 Tech Stack

- **Build**: Vite
- **Blockchain**: Ethers.js v6
- **Wallet**: Reown AppKit
- **Network**: Base (L2)
- **Integration**: Farcaster Frame SDK

---

## 🤝 Contributing

Contributions welcome! Fork, create branch, make changes, submit PR.

---

## 📄 License

MIT License

---

## 🆘 Support

- Check browser console (F12)
- Verify Base network selected
- Ensure dependencies installed
- See documentation files

### Resources
- [Vite Docs](https://vitejs.dev/)
- [Ethers.js](https://docs.ethers.org/)
- [Base Network](https://docs.base.org/)
- [Farcaster](https://docs.farcaster.xyz/)

---

## 🎯 Game Mechanics

- **Platform Jump**: +1 point
- **Coin Collection**: +1 point
- **Physics**: Realistic gravity and movement
- **Camera**: Smooth following
- **Background**: Dynamic altitude-based changes

---

## 📈 Roadmap

- [ ] Power-ups and obstacles
- [ ] NFT rewards
- [ ] Multiplayer mode
- [ ] Mobile app
- [ ] Tournament system

---

## 💡 Quick Tips

1. Use `npm run dev` for development
2. Test on Base network first
3. Gas fees are very low on Base (~$0.01)
4. Keep dependencies updated
5. Check console for debug info

---

**Made with ❤️ for Farcaster & Base**

**Happy Gaming! 🎮🚀**

---

*Version 1.0.0 - November 2024*