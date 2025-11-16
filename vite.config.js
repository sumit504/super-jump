import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-wallet': ['@reown/appkit', '@reown/appkit-adapter-ethers'],
          'vendor-wagmi': ['@wagmi/core'],
          'vendor-ethers': ['ethers'],
          'vendor-farcaster': ['@farcaster/frame-sdk']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});