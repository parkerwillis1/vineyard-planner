import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import fs from 'node:fs'

// Load OpenET API key from .env.local at config time
function loadOpenETKey() {
  try {
    const envPath = path.resolve(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      const match = envContent.match(/VITE_OPENET_API_KEY=(.+)/)
      if (match) {
        return match[1].trim()
      }
    }
  } catch (err) {
    console.error('Error loading OpenET API key:', err)
  }
  return null
}

const openETKey = loadOpenETKey()

// Debug: Log the API key at startup (first 20 chars only)
if (openETKey) {
  console.log(`✅ OpenET API Key loaded: ${openETKey.substring(0, 20)}...`)
} else {
  console.error('❌ Failed to load OpenET API key from .env.local')
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  server: {
    proxy: {
      // Proxy OpenET API requests to avoid CORS issues in development
      '/api/openet': {
        target: 'https://openet-api.org',
        changeOrigin: true,
        secure: true,
        timeout: 120000, // 2 minute timeout for slow API responses
        rewrite: (path) => path.replace(/^\/api\/openet/, '/raster/timeseries/point'),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add OpenET API key - NOTE: OpenET uses direct key, NOT "Bearer" prefix
            if (openETKey) {
              proxyReq.setHeader('Authorization', openETKey)
              console.log('🔑 OpenET Proxy: Adding API key, forwarding to openet-api.org')
            } else {
              console.error('❌ OpenET Proxy: API key not found in .env.local')
            }
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`✅ OpenET Proxy: Response received - ${proxyRes.statusCode}`)
          });
          proxy.on('error', (err, req, res) => {
            console.error('❌ OpenET Proxy error:', err.message)
          });
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    // Improve build performance and optimize output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Code splitting configuration
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code into separate chunk
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Split UI components into separate chunk
          ui: ['lucide-react'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
})
