import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // BASE_PATH est défini par le workflow GitHub Pages (ex: /Zeuy/) ; en local le site sert à la racine.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
