import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'react-vendor': ['react', 'react-dom', 'zustand'],
          'three-react': ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
