import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Tailwind CSS v4: no tailwind.config.js, no PostCSS — the plugin does everything.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
