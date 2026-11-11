import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const vendorChunkGroups = [
  {
    name: 'vendor-charts',
    packages: ['chart.js', 'react-chartjs-2', 'recharts'],
  },
  {
    name: 'vendor-documents',
    packages: ['jspdf', 'html2canvas', 'xlsx'],
  },
]

const getVendorChunk = (id) => {
  if (!id.includes('node_modules')) return undefined

  const normalizedId = id.replace(/\\/g, '/')
  const group = vendorChunkGroups.find(({ packages }) =>
    packages.some((packageName) => normalizedId.includes(`/node_modules/${packageName}/`))
  )

  return group?.name
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {

         target: 'ws://127.0.0.1:5000',   // was: http://localhost:5000
        //target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,

        configure: (proxy) => {
    proxy.on('error', (err) => {
      if (err.code !== 'ECONNRESET') {
        console.log('[ws proxy error]', err)
      }
    })
  },
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: getVendorChunk,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
