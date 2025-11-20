// main.js - Entry point with proper npm imports
import { createAppKit } from '@reown/appkit'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { ethers } from 'ethers'
import { Game } from './game.js'
import { 
    GAME_CONTRACT_ADDRESS, 
    GAME_CONTRACT_ABI, 
    NEYNAR_API_KEY, 
    REOWN_PROJECT_ID 
} from './config.js'

// Global state
let appKitModal = null
let ethersProvider = null
let farcasterFID = 0
let userProfile = null

window.walletConfig = null
window.isWalletConnected = false
window.currentAccount = null

// Initialize Reown Wallet
async function initializeReownWallet() {
    try {
        const adapter = new EthersAdapter()
        
        const baseChain = {
            id: 8453,
            name: 'Base',
            network: 'base',
            nativeCurrency: {
                decimals: 18,
                name: 'Ethereum',
                symbol: 'ETH',
            },
            rpcUrls: {
                default: { http: ['https://mainnet.base.org'] },
                public: { http: ['https://mainnet.base.org'] },
            },
            blockExplorers: {
                default: { name: 'BaseScan', url: 'https://basescan.org' },
            },
        }
        
        appKitModal = createAppKit({ 
            adapters: [adapter], 
            projectId: REOWN_PROJECT_ID, 
            networks: [baseChain], 
            metadata: { 
                name: 'Super Jump', 
                description: 'Jump game on Base', 
                url: window.location.origin, 
                icons: ['https://super-jump-opal.vercel.app/image.png'] 
            }, 
            features: { analytics: false }
        })

        appKitModal.subscribeState((state) => {
            if (state.open === false && !state.loading) {
                setTimeout(() => checkConnection(), 500)
            }
        })

        async function checkConnection() {
            try {
                const walletProvider = appKitModal.getWalletProvider()
                if (walletProvider) {
                    ethersProvider = new ethers.BrowserProvider(walletProvider)
                    const signer = await ethersProvider.getSigner()
                    const address = await signer.getAddress()
                    
                    if (address) {
                        console.log('✅ Wallet connected:', address)
                        window.currentAccount = { address: address, isConnected: true }
                        window.isWalletConnected = true
                        updateWalletUI({ isConnected: true, address: address })
                        return true
                    }
                }
            } catch (error) {
                console.log('No wallet connected')
            }
            
            window.currentAccount = null
            window.isWalletConnected = false
            ethersProvider = null
            updateWalletUI({ isConnected: false })
            return false
        }

        setTimeout(() => checkConnection(), 1000)
        console.log('✅ Reown initialized')
        
        // Show demo profile
        userProfile = { display_name: "Demo Player", username: "player", pfp_url: null }
        farcasterFID = 0
        updateProfileUI()
        
    } catch (error) { 
        console.error('Failed to initialize Reown:', error) 
    }
}

function updateProfileUI() {
    if (!userProfile) return
    const headerAvatar = document.getElementById('profileAvatar')
    if (userProfile.pfp_url) {
        headerAvatar.innerHTML = `<img src="${userProfile.pfp_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`
    } else {
        headerAvatar.textContent = userProfile.display_name ? userProfile.display_name.charAt(0).toUpperCase() : '?'
    }
    const profileUsername = document.getElementById('profileUsername')
    profileUsername.textContent = userProfile.display_name || 'Anonymous Player'
    document.getElementById('profileHeader').style.display = 'flex'
}

function updateWalletUI(account) {
    if (account && account.isConnected && account.address) {
        window.isWalletConnected = true
        window.currentAccount = account
        document.getElementById('walletIndicator').classList.add('connected')
        document.getElementById('walletStatus').textContent = 'Connected'
        document.getElementById('walletInfo').style.display = 'block'
        document.getElementById('walletAddress').textContent = `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
        document.getElementById('connectBtn').style.display = 'none'
        document.getElementById('playBtn').disabled = false
        checkPrizePoolStatus()
    } else {
        window.isWalletConnected = false
        window.currentAccount = null
        document.getElementById('walletIndicator').classList.remove('connected')
        document.getElementById('walletStatus').textContent = 'Not Connected'
        document.getElementById('walletInfo').style.display = 'none'
        document.getElementById('connectBtn').style.display = 'inline-block'
        document.getElementById('playBtn').disabled = true
    }
}

async function checkPrizePoolStatus() {
    try {
        let contractBalance
        if (ethersProvider) { 
            const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, ethersProvider) 
            contractBalance = await contract.getContractBalance() 
        }
        
        const REWARD_AMOUNT = BigInt(8510638297872)
        const rewardsAvailable = contractBalance / REWARD_AMOUNT
        
        const statusDiv = document.getElementById('prizePoolStatus')
        if (statusDiv) {
            if (contractBalance < REWARD_AMOUNT) {
                statusDiv.innerHTML = '😔 Prize pool empty, play for fun!'
                statusDiv.style.color = '#10b981'
            } else if (rewardsAvailable < 10n) {
                statusDiv.innerHTML = `⚡ Prize pool low - ${rewardsAvailable} rewards left!`
                statusDiv.style.color = '#EAB308'
            } else {
                statusDiv.innerHTML = `✅ Prize pool active - ${rewardsAvailable}+ rewards available!`
                statusDiv.style.color = '#10b981'
            }
        }
    } catch (error) {
        console.error('Failed to check prize pool:', error)
    }
}

// Export functions to window for onclick handlers
window.getFarcasterFID = () => farcasterFID

window.connectWallet = async function() {
    try {
        console.log('Opening Reown modal...')
        await appKitModal.open()
        
        const checkInterval = setInterval(async () => {
            const state = appKitModal.getState()
            
            if (state.open === false && !state.loading) {
                clearInterval(checkInterval)
                
                try {
                    const walletProvider = appKitModal.getWalletProvider()
                    if (walletProvider) {
                        ethersProvider = new ethers.BrowserProvider(walletProvider)
                        const signer = await ethersProvider.getSigner()
                        const address = await signer.getAddress()
                        
                        if (address) {
                            console.log('✅ Connected:', address)
                            window.currentAccount = { address: address, isConnected: true }
                            window.isWalletConnected = true
                            updateWalletUI({ isConnected: true, address: address })
                        }
                    }
                } catch (error) {
                    console.log('User closed modal without connecting')
                }
            }
        }, 500)
        
        setTimeout(() => clearInterval(checkInterval), 10000)
    } catch (error) { 
        console.error('Connect wallet error:', error)
        showSuccessMessage('❌ Failed to connect wallet') 
    }
}

window.startGameFromMenu = async function() {
    if (!window.isWalletConnected || !window.currentAccount) {
        alert('Please connect your wallet first!')
        return
    }

    try {
        const playBtn = document.getElementById('playBtn')
        playBtn.disabled = true
        playBtn.innerHTML = 'Confirming... <div style="display: inline-block; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; width: 16px; height: 16px; animation: spin 1s linear infinite; margin-left: 10px;"></div>'

        if (!ethersProvider) {
            const walletProvider = appKitModal.getWalletProvider()
            if (walletProvider) ethersProvider = new ethers.BrowserProvider(walletProvider)
            else throw new Error('No wallet provider available')
        }
        const signer = await ethersProvider.getSigner() 
        const contract = new ethers.Contract(GAME_CONTRACT_ADDRESS, GAME_CONTRACT_ABI, signer) 
        const tx = await contract.startGame(0) 
        await tx.wait()

        document.getElementById('mainMenu').style.display = 'none'
        document.getElementById('profileHeader').style.display = 'none'
        document.getElementById('leaderboardBtn').style.display = 'none'
        
        if (!window.gameInstance) {
            window.gameInstance = new Game(document.getElementById('gameCanvas'))
        }
        window.gameInstance.startGame()

    } catch (error) {
        console.error('Failed to start game:', error)
        
        const playBtn = document.getElementById('playBtn')
        playBtn.disabled = false
        playBtn.textContent = 'Play Game'
        
        let errorMessage = '❌ Failed to start game. Please try again.'
        if (error.message.includes('User rejected')) {
            errorMessage = '❌ Transaction rejected. Please try again.'
        }
        showSuccessMessage(errorMessage)
    }
}

function showSuccessMessage(message) {
    const popup = document.createElement('div')
    popup.className = 'success-popup'
    popup.textContent = message
    document.body.appendChild(popup)
    
    setTimeout(() => {
        popup.remove()
    }, 3000)
}

window.showSuccessMessage = showSuccessMessage

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeReownWallet()
    
    const canvas = document.getElementById('gameCanvas')
    window.gameInstance = new Game(canvas)
    document.getElementById('leaderboardBtn').style.display = 'block'
})

// Export provider for other modules
export { ethersProvider, appKitModal }