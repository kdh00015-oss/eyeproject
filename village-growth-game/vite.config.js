import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// GitHub Pages 프로젝트 사이트 주소가 /eyeproject/ 이므로 base를 맞춘다.
// (로컬 dev 서버에서는 '/' 로 동작)
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/eyeproject/' : '/',
  plugins: [react()],
})
