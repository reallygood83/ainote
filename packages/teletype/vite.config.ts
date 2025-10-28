import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { plugin as Markdown, Mode } from 'vite-plugin-markdown'
import * as path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [Markdown({ mode: [Mode.MARKDOWN, Mode.HTML] }), svelte()],
  resolve: {
    alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }]
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'teletype',
      fileName: (format) => `teletype.${format}.js`
    }
  }
})
