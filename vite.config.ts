import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      'react-native': path.resolve(__dirname, './src/shims/react-native.ts'),
      'react-native-google-mobile-ads': path.resolve(__dirname, './src/shims/react-native-google-mobile-ads.ts'),
      'expo-notifications': path.resolve(__dirname, './src/shims/expo-notifications.ts'),
    },
  },
  optimizeDeps: {
    exclude: [
      'react-native',
      'react-native-google-mobile-ads',
      'expo-notifications',
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    hmr: false,
  },
});
