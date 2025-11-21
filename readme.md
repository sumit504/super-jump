# Super Jump 🎮

A blockchain-based endless jumping game built on Base network with Farcaster integration and daily ETH rewards.

## 🌟 Features

### Gameplay
- **Endless Jumping**: Navigate through procedurally generated platforms
- **Coin Collection**: Collect coins as you climb higher
- **Dynamic Backgrounds**: Beautiful gradient transitions from sky to space
- **Particle Effects**: Smooth visual feedback with jump particles
- **Responsive Controls**: Touch, click, or keyboard controls (A/D or Arrow keys)

### Blockchain Integration
- **Base Network**: Built on Base L2 for low gas fees
- **Daily Rewards**: Score 30+ points to claim ETH rewards (once per day per Farcaster ID)
- **On-Chain Leaderboard**: Top 50 players tracked on-chain
- **Dual Wallet Support**: 
  - Farcaster Mini App wallet (in-app)
  - Reown (WalletConnect) for standalone web

### Social Features
- **Farcaster Integration**: Profile display and social sharing
- **Share to Farcaster**: Cast your scores directly from the game
- **Competitive Leaderboard**: See top players with avatars and rankings

## 🎯 How to Play

1. **Connect Wallet**: Click "Connect Wallet" to get started
2. **Start Game**: Click "Play Game" (requires on-chain transaction)
3. **Control Player**: 
   - **Mobile/Touch**: Tap left/right side of screen
   - **Desktop**: Click left/right or use A/D or Arrow keys
4. **Jump on Platforms**: Land on platforms to jump higher
5. **Collect Coins**: Grab coins for bonus points
6. **Score Big**: Reach 30+ points to qualify for rewards!

## 💰 Rewards System

- **Eligibility**: Score 30 or more points in a single game
- **Claim Limit**: One reward claim per Farcaster ID per day
- **Reward Amount**: ~0.000008 ETH per claim
- **Submit Score**: Only your best score can be submitted to leaderboard
- **Prize Pool**: Check real-time availability in main menu

## 🏆 Leaderboard

- **Top 50 Players**: View the best scores on-chain
- **Real Profiles**: See Farcaster avatars and usernames
- **Score Submission**: Only improved scores update your position
- **Persistent**: All scores stored on Base blockchain

## 🛠 Technical Stack

### Frontend
- **Vanilla JavaScript**: Pure JS game engine with HTML5 Canvas
- **CSS3**: Modern styling with glassmorphism effects
- **Responsive Design**: Works on desktop and mobile

### Web3 Integration
- **ethers.js v6**: Ethereum library for blockchain interactions
- **@farcaster/miniapp-sdk**: Farcaster Mini App integration
- **@reown/appkit**: WalletConnect v2 implementation
- **@wagmi/core**: React Hooks for Ethereum

### Blockchain
- **Network**: Base (Chain ID: 8453)
- **Smart Contract**: `0x603b3b1a946b9ff14280e8581539e07808dc5d0d`
- **Contract Functions**:
  - `startGame()`: Initialize game session
  - `submitScore()`: Submit score to leaderboard
  - `claimReward()`: Claim ETH reward for qualifying scores
  - `getTopPlayers()`: Retrieve leaderboard data
  - `getRemainingClaimsForFID()`: Check daily claim availability

### APIs
- **Neynar API**: Farcaster user profile data
- **Base RPC**: Blockchain interactions

## 📱 Deployment

### Farcaster Mini App
The game is deployed as a Farcaster Mini App with:
- Custom splash screen
- Native gesture handling
- Profile integration
- Seamless wallet connection

### Standalone Web App
Accessible via browser at: `https://super-jump-sand.vercel.app`

## 🎨 Game Mechanics

### Physics
- **Gravity**: 1200 units/second²
- **Jump Power**: -550 units/second
- **Move Speed**: 300 units/second
- **Screen Wrap**: Player wraps around screen edges

### Scoring
- **Platform Pass**: +1 point per platform passed
- **Coin Collection**: +1 point per coin
- **High Score**: Locally saved and displayed

### Difficulty
- **Platform Spacing**: 100 units vertical
- **Platform Width**: 90 pixels
- **Coin Spawn Rate**: 30-40% chance per platform
- **Dynamic Positioning**: Platforms spawn within player reach

## 🎵 Audio System

- **Jump Sound**: Rising tone (400-600-200 Hz)
- **Coin Pickup**: Bright chime (800-1400 Hz)
- **Game Over**: Descending melody
- **Web Audio API**: Procedurally generated sounds

## 🔒 Security Features

- **Farcaster FID Verification**: Prevents multi-account farming
- **On-Chain Validation**: All scores and claims verified by smart contract
- **Daily Claim Limits**: One reward per FID per 24 hours
- **Score Validation**: Only better scores can update leaderboard

## 📦 Contract Functions

```solidity
// Start a new game session
function startGame(uint256 farcasterFID)

// Submit score to leaderboard (only if better than previous)
function submitScore(uint256 score, uint256 farcasterFID) returns (uint256 position)

// Claim reward for qualifying score
function claimReward(
    uint256 score,
    uint256 gameNonce,
    uint256 timestamp,
    uint256 farcasterFID,
    bytes memory farcasterProof
)

// View functions
function getTopPlayers(uint256 count) returns (PlayerScore[])
function getPlayerStats(address player) returns (uint256 highestScore, ...)
function getRemainingClaimsForFID(uint256 fid) returns (uint256)
function getContractBalance() returns (uint256)
```

## 🌐 Environment Support

- **Farcaster**: Full integration with wallet and profiles
- **Standalone Web**: Browser-based play with Reown wallet
- **Mobile**: Touch-optimized controls
- **Desktop**: Keyboard and mouse support

## 📊 Performance

- **Target FPS**: 60 frames per second
- **Canvas Rendering**: Hardware-accelerated 2D graphics
- **Particle System**: Efficient sprite pooling
- **Memory Management**: Automatic cleanup of off-screen objects

## 🐛 Known Limitations

- Rewards require prize pool balance in contract
- One claim per Farcaster ID per day
- Score submission requires better score than previous best
- Web Audio requires user interaction to initialize

## 🔮 Future Enhancements

- Power-ups and special platforms
- Multiplayer race mode
- NFT achievements
- Seasonal tournaments
- Mobile app version
- Additional reward tiers

## 📄 License

This project is deployed on Base blockchain. Contract address: `0x603b3b1a946b9ff14280e8581539e07808dc5d0d`

## 🤝 Contributing

This is a blockchain-based game. To suggest features or report bugs, please reach out through Farcaster.

## 🎮 Play Now!

- **Farcaster**: Search for "Super Jump" in Mini Apps
- **Web**: Visit `https://super-jump-sand.vercel.app`

---

**Built with ❤️ on Base | Powered by Farcaster**

Score big. Earn ETH. Have fun! 🚀