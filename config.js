// config.js - Configuration constants
export const GAME_CONTRACT_ADDRESS = "0x603b3b1a946b9ff14280e8581539e07808dc5d0d"
export const NEYNAR_API_KEY = '8BF81B8C-C491-4735-8E1C-FC491FF048D4'
export const REOWN_PROJECT_ID = 'e0dd881bad824ac3418617434a79f917'

export const GAME_CONTRACT_ABI = [
    {"inputs": [{"type": "uint256", "name": "score"}, {"type": "uint256", "name": "gameNonce"}, {"type": "uint256", "name": "timestamp"}, {"type": "uint256", "name": "farcasterFID"}, {"type": "bytes", "name": "farcasterProof"}], "name": "claimReward", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "farcasterFID"}], "name": "startGame", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "score"}, {"type": "uint256", "name": "farcasterFID"}], "name": "submitScore", "outputs": [{"type": "uint256", "name": "position"}], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "count"}], "name": "getTopPlayers", "outputs": [{"components": [{"type": "address", "name": "player"}, {"type": "uint256", "name": "farcasterFID"}, {"type": "uint256", "name": "score"}, {"type": "uint256", "name": "timestamp"}], "type": "tuple[]", "name": ""}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"type": "address", "name": "player"}], "name": "getPlayerStats", "outputs": [{"type": "uint256", "name": "highestScore"}, {"type": "uint256", "name": "totalGames"}, {"type": "uint256", "name": "totalRewardsClaimed"}, {"type": "uint256", "name": "lastPlayTimestamp"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "farcasterFID"}], "name": "getRemainingClaimsForFID", "outputs": [{"type": "uint256", "name": ""}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "getContractBalance", "outputs": [{"type": "uint256", "name": ""}], "stateMutability": "view", "type": "function"}
]