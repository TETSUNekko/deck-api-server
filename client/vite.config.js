import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: "/holotcgtw/", // 👈 這是你的 GitHub Pages 專案路徑
  plugins: [react()],
});
