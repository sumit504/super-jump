// Simplified wallet integration without Farcaster SDK initially
import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { base } from '@reown/appkit/networks';
import { ethers } from 'ethers';

let appKitModal = null;
let ethersProvider = null;
window.walletConfig = null; 
window.isWalletConnected = false; 
window.currentAccount = null;

const GAME_CONTRACT_ADDRESS = "0x603b3b1a946b9ff14280e8581539e07808dc5d0d";
const REOWN_PROJECT_ID = 'e0dd881bad824ac3418617434a79f917';
const BASE_CHAIN_ID = 8453;

const GAME_CONTRACT_ABI = [
    {"inputs": [{"type": "uint256", "name": "score"}, {"type": "uint256", "name": "gameNonce"}, {"type": "uint256", "name": "timestamp"}, {"type": "uint256", "name": "farcasterFID"}, {"type": "bytes", "name": "farcasterProof"}], "name": "claimReward", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "farcasterFID"}], "name": "startGame", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "score"}, {"type": "uint256", "name": "farcasterFID"}], "name": "submitScore", "outputs": [{"type": "uint256", "name": "position"}], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "count"}], "name": "getTopPlayers", "outputs": [{"components": [{"type": "address", "name": "player"}, {"type": "uint256", "name": "farcasterFID"}, {"type": "uint256", "name": "score"}, {"type": "uint256", "name": "timestamp"}], "type": "tuple[]", "name": ""}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"type": "address", "name": "player"}], "name": "getPlayerStats", "outputs": [{"type": "uint256", "name": "highestScore"}, {"type": "uint256", "name": "totalGames"}, {"type": "uint256", "name": "totalRewardsClaimed"}, {"type": "uint256", "name": "lastPlayTimestamp"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "farcasterFID"}], "name": "getRemainingClaimsForFID", "outputs": [{"type": "uint256", "name": ""}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "getContractBalance", "outputs": [{"type": "uint256", "name": ""}], "stateMutability": "view", "type": "function"}
];

// Verify network
async function verifyNetwork() {
    try {
        if (ethersProvider) {
            const network = await ethersProvider.getNetwork();
            if (Number(network.chainId) !== BASE_CHAIN_ID) {
                console.warn('Wrong network. Expected Base (8453), got:', network.chainId);
                return false;
            }
        }
        return true;
    } catch (error) {
        console.error('Network verification failed:', error);
        return false;
    }
}

// Check if contract exists
async function verifyContractExists() {
    try {
        if (ethersProvider) {
            const code = await ethersProvider.getCode(GAME_CONTRACT_ADDRESS);
            if (code === '0x' || code === '0x0') {
                console.error('No contract at:', GAME_CONTRACT_ADDRESS);
                return false;
            }
            console.log('✅ Contract verified');
            return true;
        }
        return true;
    } catch (error) {
        console.error('Contract verification failed:', error);
        return false;
    }
}

async function initializeWallet() {
    try {
        const adapter = new EthersAdapter();
        appKitModal = createAppKit({ 
            adapters: [adapter], 
            projectId: REOWN_PROJECT_ID, 
            networks: [base], 
            metadata: { 
                name: 'Super Jump', 
                description: 'Jump game on Base', 
                url: window.location.origin, 
                icons: ['https://super-jump-sand.vercel.app/image.png'] 
            }, 
            features: { analytics: false }
        });

        appKitModal.subscribeState((state) => {
            if (state.open === false && !state.loading) {
                setTimeout(() => checkConnection(), 500);
            }
        });

        async function checkConnection() {
            try {
                const walletProvider = appKitModal.getWalletProvider();
                if (walletProvider) {
                    ethersProvider = new ethers.BrowserProvider(walletProvider);
                    const signer = await ethersProvider.getSigner();
                    const address = await signer.getAddress();
                    
                    if (address) {
                        console.log('✅ Wallet connected:', address);
                        
                        const isCorrectNetwork = await verifyNetwork();
                        if (!isCorrectNetwork) {
                            showSuccessMessage('⚠️ Please switch to Base network');
                            return false;
                        }
                        
                        const contractExists = await verifyContractExists();
                        if (!contractExists) {
                            showSuccessMessage('❌ Contract not found. Check network.');
                            return false;
                        }
                        
                        window.currentAccount = { address: address, isConnected: true };
                        window.isWalletConnected = true;
                        updateWalletUI({ isConnected: true, address: address });
                        return true;
                    }
                }
            } catch (error) {
                console.log('No wallet connected');
            }
            
            window.currentAccount = null;
            window.isWalletConnected = false;
            ethersProvider = null;
            updateWalletUI({ isConnected: false });
            return false;
        }

        setTimeout(() => checkConnection(), 1000);
        console.log('✅ Wallet initialized');
    } catch (error) { 
        console.error('Failed to initialize wallet:', error); 
    }
}

function updateWalletUI(account) {
    if (account && account.isConnected && account.address) {
        window.isWalletConnected = true; 
        window.currentAccount = account;
        document.getElementById('walletIndicator').classList.add('connected');
        document.getElementById('walletStatus').textContent = 'Connected';
        document.getElementById('walletInfo').style.display = 'block';
        document.getElementById('walletAddress').textContent = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`;
        document.getElementById('connectBtn').style.display = 'none';
        document.getElementById('playBtn').disabled = false;
        checkPrizePoolStatus();
    } else {
        window.isWalletConnected = false; 
        window.currentAccount = null;
        document.getElementById('walletIndicator').classList.remove('connected');
        document.getElementById('walletStatus').textContent = 'Not Connected';
        document.getElementById('walletInfo').style.display = 'none';
        document.getElementById('connectBtn').style.display = 'inline-block';
        document.getElementById('playBtn').disabled = true;
    }
}

async function checkPrizePoolStatus() {
    try {
        if (ethersProvider) { 
            const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, ethersProvider); 
            const contractBalance = await contract.getContractBalance(); 
            
            const REWARD_AMOUNT = BigInt(8510638297872);
            const rewardsAvailable = contractBalance / REWARD_AMOUNT;
            
            const statusDiv = document.getElementById('prizePoolStatus');
            if (statusDiv) {
                if (contractBalance < REWARD_AMOUNT) {
                    statusDiv.innerHTML = '😔 Prize pool empty, play for fun!';
                    statusDiv.style.color = '#10b981';
                } else if (rewardsAvailable < 10n) {
                    statusDiv.innerHTML = `⚡ Prize pool low - ${rewardsAvailable} rewards left!`;
                    statusDiv.style.color = '#EAB308';
                } else {
                    statusDiv.innerHTML = `✅ Prize pool active - ${rewardsAvailable}+ rewards available!`;
                    statusDiv.style.color = '#10b981';
                }
            }
        }
    } catch (error) {
        console.error('Failed to check prize pool:', error);
        const statusDiv = document.getElementById('prizePoolStatus');
        if (statusDiv) {
            statusDiv.innerHTML = '💰 Prize pool status unknown';
            statusDiv.style.color = 'rgba(255, 255, 255, 0.6)';
        }
    }
}

window.getFarcasterFID = () => 0; // Default to 0 for non-Farcaster users

window.connectWallet = async function() {
    try {
        console.log('Opening wallet modal...');
        await appKitModal.open();
        
        const checkInterval = setInterval(async () => {
            const state = appKitModal.getState();
            
            if (state.open === false && !state.loading) {
                clearInterval(checkInterval);
                
                try {
                    const walletProvider = appKitModal.getWalletProvider();
                    if (walletProvider) {
                        ethersProvider = new ethers.BrowserProvider(walletProvider);
                        const signer = await ethersProvider.getSigner();
                        const address = await signer.getAddress();
                        
                        if (address) {
                            console.log('✅ Connected:', address);
                            
                            const isCorrectNetwork = await verifyNetwork();
                            if (!isCorrectNetwork) {
                                showSuccessMessage('⚠️ Please switch to Base network in your wallet');
                                return;
                            }
                            
                            window.currentAccount = { address: address, isConnected: true };
                            window.isWalletConnected = true;
                            updateWalletUI({ isConnected: true, address: address });
                        }
                    }
                } catch (error) {
                    console.log('User closed modal without connecting');
                }
            }
        }, 500);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
    } catch (error) { 
        console.error('Connect wallet error:', error);
        showSuccessMessage('❌ Failed to connect wallet'); 
    }
};

window.startGameFromMenu = async function() {
    if (!window.isWalletConnected || !window.currentAccount) {
        showSuccessMessage('🔗 Please connect your wallet first!');
        return;
    }

    try {
        const isCorrectNetwork = await verifyNetwork();
        if (!isCorrectNetwork) {
            showSuccessMessage('⚠️ Wrong network! Switch to Base network');
            return;
        }

        const contractExists = await verifyContractExists();
        if (!contractExists) {
            showSuccessMessage('❌ Contract not found. Are you on Base?');
            return;
        }

        const playBtn = document.getElementById('playBtn');
        playBtn.disabled = true;
        playBtn.innerHTML = 'Starting... <div style="display: inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; margin-left: 10px;"></div>';

        if (!ethersProvider) {
            const walletProvider = appKitModal.getWalletProvider();
            if (walletProvider) ethersProvider = new ethers.BrowserProvider(walletProvider);
            else throw new Error('No wallet provider');
        }
        
        const signer = await ethersProvider.getSigner(); 
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, signer);
        
        try {
            const gasEstimate = await contract.startGame.estimateGas(0);
            console.log('Gas estimate:', gasEstimate.toString());
        } catch (gasError) {
            console.error('Gas estimation failed:', gasError);
            throw new Error('Contract call will fail. Check network.');
        }
        
        const tx = await contract.startGame(0); 
        console.log('Transaction sent:', tx.hash);
        await tx.wait();
        console.log('Transaction confirmed');

        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('profileHeader').style.display = 'none';
        document.getElementById('leaderboardBtn').style.display = 'none';
        
        if (!window.gameInstance) {
            window.gameInstance = new Game(document.getElementById('gameCanvas'));
        }
        window.gameInstance.startGame();

    } catch (error) {
        console.error('Failed to start game:', error);
        
        const playBtn = document.getElementById('playBtn');
        playBtn.disabled = false;
        playBtn.textContent = 'Play Game';
        
        let errorMessage = '❌ Failed to start game. ';
        
        if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
            errorMessage = '❌ Transaction rejected.';
        } else if (error.message.includes('insufficient funds')) {
            errorMessage = '❌ Insufficient funds for gas.';
        } else if (error.code === 'CALL_EXCEPTION') {
            errorMessage = '❌ Contract error. Verify: 1) Base network 2) Contract deployed 3) Refresh page';
        } else {
            errorMessage += error.message || 'Try again.';
        }
        
        showSuccessMessage(errorMessage);
    }
};

window.submitScoreOnChain = async function() {
    if (!window.isWalletConnected || !window.currentAccount) { 
        showSuccessMessage('🔗 Connect wallet first!'); 
        return; 
    }
    
    const score = window.gameInstance ? Math.floor(window.gameInstance.score) : 0;

    if (score < 30) {
        showSuccessMessage('❌ Score must be 30+ to submit!');
        return;
    }

    try {
        if (!ethersProvider) {
            const walletProvider = appKitModal.getWalletProvider();
            if (walletProvider) ethersProvider = new ethers.BrowserProvider(walletProvider);
        }
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, ethersProvider); 
        const playerStats = await contract.getPlayerStats(window.currentAccount.address); 
        
        const previousBestScore = Number(playerStats[0]);
        
        if (previousBestScore > 0 && score <= previousBestScore) {
            showSuccessMessage(`⚠️ Not better than best (${previousBestScore})`);
            return;
        }
        
        showSuccessMessage('📝 Submitting score...');
        
        const signer = await ethersProvider.getSigner(); 
        const contractWithSigner = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, signer); 
        const tx = await contractWithSigner.submitScore(score, 0); 
        await tx.wait(); 
        
        if (previousBestScore === 0) {
            showSuccessMessage('🎉 First score submitted!');
        } else {
            showSuccessMessage(`🎉 New best! Improved from ${previousBestScore}!`);
        }
        
        const leaderboardScreen = document.getElementById('leaderboardScreen');
        if (leaderboardScreen && leaderboardScreen.style.display !== 'none') {
            await window.loadOnChainLeaderboard();
        }
        
    } catch (error) {
        console.error('Submit error:', error);
        let errorMessage = 'Failed to submit.';
        
        if (error.message.includes('User rejected')) {
            errorMessage = '❌ Transaction rejected.';
        } else if (error.message.includes('ScoreNotBetter')) {
            errorMessage = '⚠️ Score not better!';
        }
        
        showSuccessMessage(errorMessage);
    }
};

window.loadOnChainLeaderboard = async function() {
    try {
        if (ethersProvider) { 
            const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, ethersProvider); 
            const topPlayers = await contract.getTopPlayers(50); 
            displayOnChainLeaderboard(topPlayers);
        }
    } catch (error) { 
        document.getElementById('leaderboardList').innerHTML = `<div class="empty-leaderboard"><p>Failed to load</p></div>`; 
    }
};

async function displayOnChainLeaderboard(players) {
    const listDiv = document.getElementById('leaderboardList');
    
    if (!players || players.length === 0) {
        listDiv.innerHTML = `<div class="empty-leaderboard"><p>No scores yet!</p></div>`;
        return;
    }
    
    listDiv.innerHTML = players.map((entry, idx) => {
        const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : '';
        const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        
        const letter = entry.player.substring(2, 3).toUpperCase();
        const avatarHtml = `<div style="width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">${letter}</div>`;
        
        return `<div class="leaderboard-item ${rankClass}"><div style="display: flex; align-items: center; gap: 8px; flex: 1;"><div style="font-size: 20px; min-width: 45px; text-align: center;">${rankIcon}</div>${avatarHtml}<div style="flex: 1;"><div style="font-weight: bold; color: white;">${entry.player.substring(0, 6)}...${entry.player.substring(38)}</div></div></div><div style="font-size: 16px; font-weight: bold; color: #FFD700;">🎯 ${Number(entry.score)}</div></div>`;
    }).join('');
}

window.showSuccessMessage = function(message) {
    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.textContent = message;
    document.body.appendChild(popup);
    
    setTimeout(() => popup.remove(), 3000);
};

// Initialize
initializeWallet();