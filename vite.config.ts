
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // 确保 process.env 在浏览器中可用，用于读取 Vercel 的环境变量
    'process.env': process.env
  }
})
