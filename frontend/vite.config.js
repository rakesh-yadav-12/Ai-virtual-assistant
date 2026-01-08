import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://ai-virtual-assistant-20b.onrender.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[PROXY] ${req.method} ${req.url}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`[PROXY RESPONSE] ${req.url} -> ${proxyRes.statusCode}`);
            
            // Fix cookie domain/path issues
            const setCookieHeaders = proxyRes.headers['set-cookie'];
            if (setCookieHeaders) {
              setCookieHeaders.forEach((cookie, i) => {
                // Fix cookie domain and security settings
                const newCookie = cookie
                  .replace(/Domain=.*?;/i, '') // Remove domain restriction
                  .replace(/Secure;/i, '') // Remove Secure flag for local dev
                  .replace(/SameSite=Strict/i, 'SameSite=Lax'); // Change SameSite
                proxyRes.headers['set-cookie'][i] = newCookie;
              });
            }
          });
        },
      }
    },
    // Allow all origins during development
    cors: {
      origin: '*',
      credentials: true,
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
