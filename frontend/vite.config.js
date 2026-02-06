import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/encode_message': 'http://127.0.0.1:5000',
      '/decode_message': 'http://127.0.0.1:5000'
    }
  }
})
