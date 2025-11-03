import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/configurator-stalls-revit/', // GitHub Pages repo name
})

