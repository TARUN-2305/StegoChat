import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all addresses
    proxy: {
      '/encode_message': 'http://127.0.0.1:5000',
      '/decode_message': 'http://127.0.0.1:5000',
      '/messages': 'http://127.0.0.1:5000',
      '/storage': 'http://127.0.0.1:5000',
      '/auth': 'http://127.0.0.1:5000',
      '/attack_image': 'http://127.0.0.1:5000',
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        ws: true
      }
    }
  }
})
