// Import from local node_modules instead of ESM CDN
import { sdk } from '@farcaster/frame-sdk';
import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { base } from '@reown/appkit/networks';
import { ethers } from 'ethers';
import {
    createConfig,
    connect,
    writeContract,
    readContract,
    getAccount,
    waitForTransactionReceipt,
    watchAccount,
    http
} from '@wagmi/core';
import { base as wagmiBase } from '@wagmi/core/chains';

let isFarcasterEnvironment = false, userProfile = null, farcasterFID = null, appKitModal = null, ethersProvider = null;
window.walletConfig = null; 
window.isWalletConnected = false; 
window.currentAccount = null;

const GAME_CONTRACT_ADDRESS = "0x603b3b1a946b9ff14280e8581539e07808dc5d0d";
const NEYNAR_API_KEY = '8BF81B8C-C491-4735-8E1C-FC491FF048D4';
const REOWN_PROJECT_ID = 'e0dd881bad824ac3418617434a79f917';
const GAME_CONTRACT_ABI = [
    {"inputs": [{"type": "uint256", "name": "score"}, {"type": "uint256", "name": "gameNonce"}, {"type": "uint256", "name": "timestamp"}, {"type": "uint256", "name": "farcasterFID"}, {"type": "bytes", "name": "farcasterProof"}], "name": "claimReward", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "farcasterFID"}], "name": "startGame", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "score"}, {"type": "uint256", "name": "farcasterFID"}], "name": "submitScore", "outputs": [{"type": "uint256", "name": "position"}], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "count"}], "name": "getTopPlayers", "outputs": [{"components": [{"type": "address", "name": "player"}, {"type": "uint256", "name": "farcasterFID"}, {"type": "uint256", "name": "score"}, {"type": "uint256", "name": "timestamp"}], "type": "tuple[]", "name": ""}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"type": "address", "name": "player"}], "name": "getPlayerStats", "outputs": [{"type": "uint256", "name": "highestScore"}, {"type": "uint256", "name": "totalGames"}, {"type": "uint256", "name": "totalRewardsClaimed"}, {"type": "uint256", "name": "lastPlayTimestamp"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"type": "uint256", "name": "farcasterFID"}], "name": "getRemainingClaimsForFID", "outputs": [{"type": "uint256", "name": ""}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "getContractBalance", "outputs": [{"type": "uint256", "name": ""}], "stateMutability": "view", "type": "function"}
];

async function detectEnvironment() {
    try { 
        const context = await sdk.context; 
        if (context?.user?.fid) { 
            isFarcasterEnvironment = true; 
            console.log('✅ Farcaster Environment'); 
            return true; 
        } 
    } catch (error) {
        console.log('Not in Farcaster environment');
    }
    isFarcasterEnvironment = false; 
    console.log('🌐 Standalone - Reown'); 
    return false;
}

async function fetchFarcasterProfile() {
    try {
        const context = await sdk.context;
        if (context?.user?.fid) {
            farcasterFID = context.user.fid;
            const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${farcasterFID}`, { 
                method: 'GET', 
                headers: { 
                    'Accept': 'application/json', 
                    'api_key': NEYNAR_API_KEY 
                }
            });
            if (response.ok) { 
                const data = await response.json(); 
                if (data.users && data.users.length > 0) { 
                    userProfile = data.users[0]; 
                    updateProfileUI(); 
                } 
            }
        } else { 
            userProfile = { display_name: "Demo Player", username: "player", pfp_url: null }; 
            farcasterFID = 0; 
            updateProfileUI(); 
        }
    } catch (error) { 
        console.error('Failed to fetch profile:', error);
        userProfile = { display_name: "Demo Player", username: "player", pfp_url: null }; 
        farcasterFID = 0; 
        updateProfileUI(); 
    }
}

function updateProfileUI() {
    if (!userProfile) return;
    const headerAvatar = document.getElementById('profileAvatar');
    if (userProfile.pfp_url) { 
        headerAvatar.innerHTML = `<img src="${userProfile.pfp_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`; 
    }
    else { 
        headerAvatar.textContent = userProfile.display_name ? userProfile.display_name.charAt(0).toUpperCase() : '?'; 
    }
    const profileUsername = document.getElementById('profileUsername');
    profileUsername.textContent = userProfile.display_name || 'Anonymous Player';
    document.getElementById('profileHeader').style.display = 'flex';
}

async function initializeFarcasterWallet() {
    try {
        // In Farcaster environment, also initialize Reown for wallet connection
        await initializeReownWallet();
        
        // For Farcaster environment, use injected provider if available
  window.walletConfig = createConfig({ 
    chains: [wagmiBase], 
    transports: { 
        [wagmiBase.id]: http('https://base-mainnet.g.alchemy.com/v2/B1LejkLDDTELo2DAIk7nc') 
    }
});
        watchAccount(window.walletConfig, { onChange: (account) => updateWalletUI(account) });
        const account = getAccount(window.walletConfig);
        if (account.isConnected) { 
            updateWalletUI(account); 
        }
    } catch (error) { 
        console.error('Failed to initialize Farcaster wallet:', error); 
    }
}

async function initializeReownWallet() {
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

        const unsubscribe = appKitModal.subscribeState((state) => {
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
        console.log('✅ Reown initialized');
    } catch (error) { 
        console.error('Failed to initialize Reown:', error); 
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
        let contractBalance;
        if (isFarcasterEnvironment && window.walletConfig) { 
            contractBalance = await readContract(window.walletConfig, { 
                address: GAME_CONTRACT_ADDRESS, 
                abi: GAME_CONTRACT_ABI, 
                functionName: 'getContractBalance' 
            }); 
        }
        else if (ethersProvider) { 
            const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, ethersProvider); 
            contractBalance = await contract.getContractBalance(); 
        }
        
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
    } catch (error) {
        console.error('Failed to check prize pool:', error);
        const statusDiv = document.getElementById('prizePoolStatus');
        if (statusDiv) {
            statusDiv.innerHTML = '💰 Prize pool status unknown';
            statusDiv.style.color = 'rgba(255, 255, 255, 0.6)';
        }
    }
}

window.getFarcasterFID = () => farcasterFID;

window.connectWallet = async function() {
    try {
        console.log('Connect wallet clicked');
        
        if (!appKitModal) {
            showSuccessMessage('⏳ Initializing wallet connection...');
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        console.log('Opening Reown modal...');
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
        showSuccessMessage('❌ Failed to connect wallet. Please refresh and try again.'); 
    }
};

window.startGameFromMenu = async function() {
    if (!window.isWalletConnected || !window.currentAccount) {
        alert('Please connect your wallet first!');
        return;
    }

    const playBtn = document.getElementById('playBtn');
    playBtn.disabled = true;
    playBtn.innerHTML = '🎮 Starting...';

    try {
     
        const fid = window.getFarcasterFID();
        if (!ethersProvider) {
            const walletProvider = appKitModal.getWalletProvider();
            if (walletProvider) ethersProvider = new ethers.BrowserProvider(walletProvider);
        }
        const signer = await ethersProvider.getSigner(); 
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, signer); 
        const tx = await contract.startGame(fid || 0); 
        await tx.wait();
        

        // Start the game directly (no transaction needed for basic gameplay)
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('profileHeader').style.display = 'none';
        document.getElementById('leaderboardBtn').style.display = 'none';
        
        if (!window.gameInstance) {
            window.gameInstance = new Game(document.getElementById('gameCanvas'));
        }
        window.gameInstance.startGame();

    } catch (error) {
        console.error('Failed to start game:', error);
        
        playBtn.disabled = false;
        playBtn.textContent = 'Play Game';
        
        let errorMessage = '❌ Failed to start game. Please try again.';
        if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
            errorMessage = '❌ Transaction rejected. Please try again.';
        }
        showSuccessMessage(errorMessage);
    }
};

window.submitScoreOnChain = async function() {
    if (!window.isWalletConnected || !window.currentAccount) { 
        showSuccessMessage('🔗 Please connect your wallet first!'); 
        return; 
    }
    
    const fid = window.getFarcasterFID();
    const score = window.gameInstance ? Math.floor(window.gameInstance.score) : 0;

    if (score < 30) {
        showSuccessMessage('❌ Score must be 30 or higher to submit!');
        return;
    }

    try {
        // Get ethers provider
        if (!ethersProvider) {
            const walletProvider = appKitModal.getWalletProvider();
            if (walletProvider) ethersProvider = new ethers.BrowserProvider(walletProvider);
            else throw new Error('No wallet provider available');
        }
        
        // Check if we're on Base network (Chain ID: 8453)
        const network = await ethersProvider.getNetwork();
        if (network.chainId !== 8453n) {
            showSuccessMessage('⚠️ Please switch to Base network in your wallet!');
            return;
        }
        
        showSuccessMessage('📝 Checking your previous scores...');
        
        // Try to get player stats (optional - if it fails, we'll still submit)
        let previousBestScore = 0;
        try {
            const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, ethersProvider);
            const stats = await contract.getPlayerStats(window.currentAccount.address);
            previousBestScore = Number(stats[0]);
            
            // Check if new score is better
            if (previousBestScore > 0 && score <= previousBestScore) {
                showSuccessMessage(`⚠️ Not better than your best score (${previousBestScore}). Try again!`);
                return;
            }
        } catch (statsError) {
            console.log('Could not fetch stats, proceeding with submission:', statsError);
            // Continue anyway - let the contract decide
        }
        
        showSuccessMessage('📝 Submitting score to leaderboard...');
        
        // Submit score transaction
        const signer = await ethersProvider.getSigner(); 
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, signer); 
        const tx = await contract.submitScore(score, fid || 0); 
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            if (previousBestScore === 0) {
                showSuccessMessage('🎉 First score submitted to leaderboard!');
            } else {
                showSuccessMessage(`🎉 New best score! Improved from ${previousBestScore}!`);
            }
        } else {
            throw new Error('Transaction failed');
        }
        
        // Refresh leaderboard if visible
        const leaderboardScreen = document.getElementById('leaderboardScreen');
        if (leaderboardScreen && leaderboardScreen.style.display !== 'none') {
            setTimeout(() => window.loadOnChainLeaderboard(), 2000);
        }
        
    } catch (error) {
        console.error('Submit error:', error);
        let errorMessage = '❌ Failed to submit score.';
        
        if (error.message.includes('User rejected') || error.message.includes('user rejected')) {
            errorMessage = '❌ Transaction rejected by user.';
        } else if (error.message.includes('ScoreNotBetter')) {
            errorMessage = '⚠️ Score not better than your previous best!';
        } else if (error.message.includes('insufficient funds')) {
            errorMessage = '❌ Insufficient gas fees. Add ETH to your wallet.';
        } else if (error.code === 'CALL_EXCEPTION' || error.message.includes('missing revert data')) {
            errorMessage = '⚠️ Network error. Please ensure you\'re on Base network and try again.';
        } else if (error.message.includes('InvalidScore')) {
            errorMessage = '❌ Invalid score value.';
        }
        
        showSuccessMessage(errorMessage);
    }
};

window.loadOnChainLeaderboard = async function() {
    try {
        let topPlayers;
        if (isFarcasterEnvironment && window.walletConfig) { 
            topPlayers = await readContract(window.walletConfig, { 
                address: GAME_CONTRACT_ADDRESS, 
                abi: GAME_CONTRACT_ABI, 
                functionName: 'getTopPlayers', 
                args: [BigInt(50)] 
            }); 
        }
        else if (ethersProvider) { 
            const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, ethersProvider); 
            topPlayers = await contract.getTopPlayers(50); 
        }
        else { return; }
        
        displayOnChainLeaderboard(topPlayers);
    } catch (error) { 
        document.getElementById('leaderboardList').innerHTML = `<div class="empty-leaderboard"><p>Failed to load leaderboard</p></div>`; 
    }
};

async function displayOnChainLeaderboard(players) {
    const listDiv = document.getElementById('leaderboardList');
    
    if (!players || players.length === 0) {
        listDiv.innerHTML = `<div class="empty-leaderboard"><p style="font-size: 18px; margin-bottom: 5px;">No scores yet!</p><p style="font-size: 14px;">Be the first to submit a score.</p></div>`;
        return;
    }

    const fids = [...new Set(players.map(p => Number(p.farcasterFID)).filter(fid => fid > 0))];
    let profiles = {};
    
    if (fids.length > 0) {
        try {
            const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(',')}`, { 
                method: 'GET', 
                headers: { 
                    'Accept': 'application/json', 
                    'api_key': NEYNAR_API_KEY 
                }
            });
            if (response.ok) { 
                const data = await response.json(); 
                data.users.forEach(user => { profiles[user.fid] = user; }); 
            }
        } catch (error) {
            console.error('Failed to fetch profiles:', error);
        }
    }
    
    listDiv.innerHTML = players.map((entry, idx) => {
        const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : '';
        const rankIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
        
        const fid = Number(entry.farcasterFID);
        const profile = profiles[fid];
        
        let avatarHtml, displayName;
        
        if (profile && profile.pfp_url) {
            avatarHtml = `<img src="${profile.pfp_url}" style="width: 45px; height: 45px; border-radius: 50%;">`;
            displayName = profile.display_name || profile.username || 'Player';
        } else {
            const letter = entry.player.substring(2, 3).toUpperCase();
            avatarHtml = `<div style="width: 45px; height: 45px; border-radius: 50%; background: linear-gradient(135deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px;">${letter}</div>`;
            displayName = fid > 0 ? `FID ${fid}` : 'Anonymous';
        }
        
        return `<div class="leaderboard-item ${rankClass}"><div style="display: flex; align-items: center; gap: 8px; flex: 1;"><div style="font-size: 20px; min-width: 45px; text-align: center;">${rankIcon}</div>${avatarHtml}<div style="flex: 1; min-width: 0;"><div style="font-weight: bold; color: white; font-size: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayName}</div><div style="font-size: 11px; color: rgba(255, 255, 255, 0.6); font-family: monospace;">${entry.player.substring(0, 6)}...${entry.player.substring(38)}</div></div></div><div style="display: flex; align-items: center; gap: 8px;"><div style="font-size: 16px; font-weight: bold; color: #FFD700;">🎯</div><div style="font-size: 16px; font-weight: bold; color: #FFD700;">${Number(entry.score)}</div></div></div>`;
    }).join('');
}

async function createFarcasterProof(fid, walletAddress) {
    const message = `${walletAddress}-${fid}-${Date.now()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    
    const hashArray = new Uint8Array(hashBuffer);
    const hashHex = '0x' + Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
}

window.claimScoreReward = async function() {
    const farcasterFID = window.getFarcasterFID();
    
    if (!farcasterFID) {
        showSuccessMessage('⚠️ Please open through Farcaster app to claim rewards');
        return;
    }
    
    if (!window.isWalletConnected) {
        showSuccessMessage('❌ Please connect your wallet to claim rewards!');
        return;
    }
    
    try {
        const claimBtn = document.getElementById('claimScoreBtn');
        claimBtn.disabled = true;
        claimBtn.textContent = '⏳ Checking...';
        
        let contractBalance, remainingClaims;
        if (isFarcasterEnvironment) {
            contractBalance = await readContract(window.walletConfig, { 
                address: GAME_CONTRACT_ADDRESS, 
                abi: GAME_CONTRACT_ABI, 
                functionName: 'getContractBalance' 
            });
            remainingClaims = await readContract(window.walletConfig, { 
                address: GAME_CONTRACT_ADDRESS, 
                abi: GAME_CONTRACT_ABI, 
                functionName: 'getRemainingClaimsForFID', 
                args: [BigInt(farcasterFID)] 
            });
        } else {
            if (!ethersProvider) {
                const walletProvider = appKitModal.getWalletProvider();
                if (walletProvider) ethersProvider = new ethers.BrowserProvider(walletProvider);
            }
            const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, ethersProvider);
            contractBalance = await contract.getContractBalance();
            remainingClaims = await contract.getRemainingClaimsForFID(0);
        }
        
        const REWARD_AMOUNT = BigInt(8510638297872);
        
        if (contractBalance < REWARD_AMOUNT) {
            showSuccessMessage('😔 Prize pool is empty! Check back later!');
            claimBtn.disabled = false;
            claimBtn.textContent = '💰 Claim ETH Reward';
            return;
        }
        
        if (remainingClaims === 0n) {
            showSuccessMessage('⏰ You already claimed today! Come back tomorrow.');
            claimBtn.disabled = false;
            claimBtn.textContent = '💰 Claim ETH Reward';
            return;
        }
        
        const score = window.gameInstance ? Math.floor(window.gameInstance.score) : 0;
        const gameNonce = Date.now();
        const timestamp = Math.floor(Date.now() / 1000);
        
        claimBtn.textContent = '⏳ Claiming...';
        
        const farcasterProof = await createFarcasterProof(farcasterFID, window.currentAccount.address);
        
        if (isFarcasterEnvironment) {
            const hash = await writeContract(window.walletConfig, { 
                address: GAME_CONTRACT_ADDRESS, 
                abi: GAME_CONTRACT_ABI, 
                functionName: 'claimReward', 
                args: [BigInt(score), BigInt(gameNonce), BigInt(timestamp), BigInt(farcasterFID), farcasterProof] 
            });
            const receipt = await waitForTransactionReceipt(window.walletConfig, { hash });
            if (receipt.status !== 'success') throw new Error('Transaction failed');
        } else {
            const signer = await ethersProvider.getSigner();
            const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, signer);
            const tx = await contract.claimReward(score, gameNonce, timestamp, 0, farcasterProof);
            await tx.wait();
        }
        
        showSuccessMessage(`🎉 Successfully claimed reward! ETH sent to your wallet!`);
        
        document.getElementById('eligibleReward').style.display = 'none';
        const successDiv = document.createElement('div');
        successDiv.className = 'score-reward-info';
        successDiv.innerHTML = `<div style="font-size: 18px; font-weight: 700; margin-bottom: 10px;">✅ Reward Claimed!</div><div>Reward has been sent to your wallet!</div><div style="margin-top: 5px; font-size: 12px; color: rgba(255, 255, 255, 0.7);">Come back tomorrow for another claim!</div>`;
        document.getElementById('scoreRewardSection').appendChild(successDiv);
    } catch (error) {
        console.error('Claim error:', error);
        
        let errorMessage = '❌ Failed to claim reward. ';
        if (error.message && error.message.includes('User rejected')) {
            errorMessage = '⚠️ Transaction cancelled by user';
        } else if (error.message && error.message.includes('FIDAlreadyClaimedToday')) {
            errorMessage = '⏰ You already claimed your reward today! Come back tomorrow.';
        } else if (error.message && error.message.includes('ScoreTooLow')) {
            errorMessage = '❌ Score must be 15 or higher to claim!';
        } else if (error.message && error.message.includes('InsufficientBalance')) {
            errorMessage = '😔 Prize pool is empty! Check back later!';
        } else {
            errorMessage += error.message || 'Please try again.';
        }
        
        showSuccessMessage(errorMessage);
    } finally {
        const claimBtn = document.getElementById('claimScoreBtn');
        if (claimBtn) {
            claimBtn.disabled = false;
            claimBtn.textContent = '💰 Claim ETH Reward';
        }
    }
};

window.showSuccessMessage = function(message) {
    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.textContent = message;
    document.body.appendChild(popup);
    
    setTimeout(() => {
        popup.remove();
    }, 3000);
};

// Initialize on load
(async () => { 
    try { 
        await detectEnvironment(); 
        if (isFarcasterEnvironment) { 
            if (sdk?.actions?.addMiniApp) await sdk.actions.addMiniApp(); 
            sdk.actions.ready({ disableNativeGestures: true }); 
            await fetchFarcasterProfile(); 
            await initializeFarcasterWallet(); 
        } else { 
            await initializeReownWallet(); 
        } 
    } catch (err) {
        console.error('Initialization error:', err);
    } 
})();