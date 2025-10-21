# 🎮 Super Jump - Play to Earn Game

A thrilling vertical jumping game built on **Base blockchain** where players can earn ETH rewards by achieving high scores. Features dual wallet support for both Farcaster Mini Apps and standalone web deployment.

![Super Jump](https://super-jump-sand.vercel.app/image.png)

## 🌟 Features

### 🎯 Gameplay
- **Endless Vertical Jumping**: Jump from platform to platform and reach new heights
- **Coin Collection**: Collect coins mid-air for bonus points
- **Dynamic Backgrounds**: Beautiful gradient backgrounds that change with altitude
- **Particle Effects**: Smooth jump particles and visual feedback
- **Score System**: Points earned by passing platforms and collecting coins

### 💰 Play-to-Earn Mechanics
- **Score 30+ Points**: Qualify for ETH rewards
- **Daily Claims**: Claim rewards once per day (per Farcaster FID)
- **On-Chain Leaderboard**: Top 50 players displayed with Farcaster profiles
- **Smart Contract Integration**: All scores and rewards verified on-chain
- **Prize Pool Status**: Real-time display of available rewards

### 🔗 Dual Wallet Support
- **Farcaster Mini App**: Seamless integration with Farcaster frames
- **Standalone Web**: Works on any website with Reown (WalletConnect)
- **Multi-Wallet Compatible**: Coinbase Wallet, MetaMask, Rainbow, and more
- **Auto-Detection**: Automatically uses the right wallet connector

### 🎨 UI/UX Features
- **Responsive Design**: Works on mobile and desktop
- **Profile Integration**: Displays Farcaster profile pictures and usernames
- **Live Leaderboard**: View top 50 players with their scores
- **Share Functionality**: Share your score directly to Farcaster
- **Sound Effects**: Audio feedback for jumps, coins, and game over

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ (for local development)
- MetaMask or Coinbase Wallet
- ETH on Base network (for gas fees)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/super-jump.git
cd super-jump
```

2. **No build required!** This is a standalone HTML file
```bash
# Just open the HTML file in your browser
open index.html
```

3. **Or deploy to Vercel/Netlify**
```bash
# Deploy to Vercel
vercel deploy

# Or to Netlify
netlify deploy
```

## 🎮 How to Play

### Controls
- **Desktop**: 
  - Click **LEFT** side of screen to move left
  - Click **RIGHT** side of screen to move right
  - Or use **A/D** or **Arrow Keys**
  
- **Mobile**: 
  - Tap **LEFT** side to move left
  - Tap **RIGHT** side to move right

### Objective
1. **Connect your wallet** (Farcaster or Reown)
2. **Click "Play Game"** and confirm the transaction
3. **Jump on platforms** to keep moving upward
4. **Collect coins** for bonus points
5. **Score 30+ points** to qualify for rewards
6. **Submit your score** to the leaderboard
7. **Claim your ETH reward** (once per day)

### Scoring
- **Pass Platform**: +1 point
- **Collect Coin**: +1 point
- **Minimum for Rewards**: 30 points

## 🔧 Configuration

### Smart Contract
Located at: `0x400e38922f7ad076fe4fd2f89e850ab4325eaa64` on **Base Mainnet**

### API Keys (Update in code)
```javascript
const NEYNAR_API_KEY = 'YOUR_NEYNAR_API_KEY';
const REOWN_PROJECT_ID = 'YOUR_REOWN_PROJECT_ID';
```

### Contract Functions
- `startGame(farcasterFID)`: Initialize a new game session
- `submitScore(score, farcasterFID)`: Submit score to leaderboard
- `claimReward(score, gameNonce, timestamp, farcasterFID, proof)`: Claim ETH reward
- `getTopPlayers(count)`: Fetch leaderboard data
- `getRemainingClaimsForFID(fid)`: Check if FID can claim today

## 🏗️ Technical Architecture

### Frontend
- **Pure HTML/CSS/JS**: No build tools required
- **Canvas API**: Smooth 60 FPS gameplay
- **Web Audio API**: Dynamic sound effects
- **LocalStorage**: High score persistence

### Blockchain Integration
- **Farcaster Path**: 
  - `@farcaster/miniapp-sdk` for profile data
  - `@farcaster/miniapp-wagmi-connector` for wallet
  - `@wagmi/core` for contract interactions

- **Standalone Path**:
  - `@reown/appkit` for wallet connection
  - `ethers.js` v6 for contract calls
  - Works with any WalletConnect-compatible wallet

### Smart Contract (Solidity)
- **Network**: Base (Chain ID: 8453)
- **Reward Amount**: ~0.000008 ETH per claim
- **Daily Limit**: 1 claim per Farcaster FID per day
- **Leaderboard**: Stores top scores with player addresses

## 📁 Project Structure

```
super-jump/
├── index.html              # Main game file (all-in-one)
├── README.md              # This file
├── image.png              # Game thumbnail
├── splash.png             # Farcaster splash screen
└── sounds/                # Optional sound files
    ├── correct.mp3
    ├── wrong.mp3
    └── win.mp3
```

## 🎨 Game Classes

### Core Classes
- **`Game`**: Main game loop and state management
- **`Player`**: Player physics and rendering
- **`Platform`**: Platform generation and collision
- **`Coin`**: Collectible coins with animations
- **`Camera`**: Smooth follow camera system
- **`ParticleSystem`**: Visual effects on jumps
- **`BackgroundManager`**: Dynamic background gradients
- **`AudioManager`**: Sound effect generation

## 🔐 Security Features

- **On-chain verification**: All scores verified by smart contract
- **Anti-cheat**: Game start requires transaction confirmation
- **Daily limits**: Prevents reward farming
- **Farcaster proof**: Links rewards to Farcaster identity

## 🌐 Deployment

### Vercel (Recommended)
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

### GitHub Pages
```bash
git push origin main
# Enable GitHub Pages in repository settings
```

### Farcaster Frame
Update the meta tag with your deployment URL:
```html
<meta name="fc:miniapp" content='{
    "version":"1",
    "imageUrl":"YOUR_URL/image.png",
    "button":{
        "title":"Play Super Jump & Earn!",
        "action":{
            "type":"launch_frame",
            "name":"Super Jump",
            "url":"YOUR_DEPLOYMENT_URL",
            "splashImageUrl":"YOUR_URL/splash.png",
            "splashBackgroundColor":"#00111a"
        }
    }
}' />
```

## 📊 Leaderboard System

### Features
- **Top 50 Players**: Displays best scores from all players
- **Best Score Only**: Shows each player's highest score
- **Farcaster Integration**: Fetches profile pictures and usernames
- **Real-time Updates**: Refreshes after score submission
- **Rank Badges**: 🥇🥈🥉 for top 3 players

### Data Source
- Fetched from smart contract `getTopPlayers(50)`
- Player profiles from Neynar API
- Sorted by score (highest first)

## 💎 Reward System

### Eligibility
- Score **30+ points** in a single game
- Connect wallet (Farcaster or Reown)
- Have remaining daily claims

### Claim Process
1. Complete game with 30+ points
2. Click "Submit to Leaderboard" (optional)
3. Click "Claim ETH Reward"
4. Confirm transaction
5. Receive ETH to your wallet

### Limits
- **1 claim per day** per Farcaster FID
- Resets at midnight UTC
- Contract must have sufficient balance

## 🐛 Troubleshooting

### Wallet Won't Connect
- Ensure you're on Base network
- Try refreshing the page
- Clear browser cache
- Use Coinbase Wallet or MetaMask

### Transaction Failed
- Check you have ETH for gas on Base
- Ensure game was started with transaction
- Verify you haven't claimed today

### Leaderboard Not Loading
- Check internet connection
- Verify smart contract is accessible
- Try refreshing the page

### Game Lags
- Close other browser tabs
- Reduce browser extensions
- Use Chrome/Brave for best performance

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Live Game**: [https://celio-jump.vercel.app](https://celio-jump.vercel.app)
- **Smart Contract**: [BaseScan](https://basescan.org/address/0x400e38922f7ad076fe4fd2f89e850ab4325eaa64)
- **Farcaster**: [Launch in Farcaster](https://warpcast.com/)
- **Documentation**: [Game Docs](https://docs.yoursite.com)

## 👥 Team

- **Developer**: Your Name
- **Smart Contracts**: Your Team
- **Design**: Your Designer

## 🙏 Acknowledgments

- **Farcaster** - For the amazing mini app SDK
- **Reown** - For WalletConnect integration
- **Base** - For the L2 blockchain platform
- **Neynar** - For Farcaster API services

## 📈 Roadmap

- [ ] Power-ups and special platforms
- [ ] Multiplayer racing mode
- [ ] NFT character skins
- [ ] Tournament system
- [ ] Mobile app version
- [ ] More reward tiers

## 💬 Support

- **Discord**: [Join our community](https://discord.gg/yourserver)
- **Twitter**: [@YourGame](https://twitter.com/yourgame)
- **Email**: support@yourgame.com

---

**Made with ❤️ on Base blockchain**

Play now and start earning! 🚀