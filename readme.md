async function initializeWallet() {
    try {
        if (typeof sdk !== 'undefined' && sdk.context) {
            farcasterContext = await sdk.context;
        }
        
        window.walletConfig = createConfig({
            chains: [arbitrum],
            connectors: [farcasterMiniApp()],
            transports: {
                [arbitrum.id]: http("https://arb-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY")
            }
        });

        watchAccount(window.walletConfig, {
            onChange: (account) => {
                updateWalletUI(account);
            }
        });

        // AUTO-CONNECT: This is the key addition
        const account = getAccount(window.walletConfig);
        if (account.isConnected) {
            updateWalletUI(account);
        } else {
            // Try auto-connect
            try {
                const result = await connect(window.walletConfig, {
                    connector: farcasterMiniApp()
                });
                updateWalletUI(getAccount(window.walletConfig));
            } catch (error) {
                console.log('Auto-connect failed, manual connection required');
                updateWalletUI(getAccount(window.walletConfig));
            }
        }
    } catch (error) {
        console.error('Failed to initialize wallet:', error);
    }
}