import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync, rmSync } from 'fs'
import { buildSync } from 'esbuild'

// Plugin that copies static assets and builds content script + service worker via esbuild
function copyStaticPlugin() {
  return {
    name: 'copy-static',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')

      // Copy manifest.json (already has correct dist-relative paths)
      cpSync(resolve(__dirname, 'manifest.json'), resolve(dist, 'manifest.json'))

      // Copy icons
      const iconsDir = resolve(dist, 'icons')
      mkdirSync(iconsDir, { recursive: true })
      cpSync(resolve(__dirname, 'public/icons'), iconsDir, { recursive: true })

      // Copy content styles
      cpSync(
        resolve(__dirname, 'src/content/content-styles.css'),
        resolve(dist, 'content-styles.css')
      )

      // Build content script as IIFE (bundled, no imports)
      buildSync({
        entryPoints: [resolve(__dirname, 'src/content/content-script.js')],
        bundle: true,
        format: 'iife',
        outfile: resolve(dist, 'content-script.js'),
        target: 'es2020',
        minify: false,
        define: {
          'process.env.NODE_ENV': '"production"',
        },
        logLevel: 'info',
      })

      // Build service worker as ESM bundle
      buildSync({
        entryPoints: [resolve(__dirname, 'src/background/service-worker.js')],
        bundle: true,
        format: 'esm',
        outfile: resolve(dist, 'service-worker.js'),
        target: 'es2020',
        minify: false,
        platform: 'browser',
        define: {
          'process.env.NODE_ENV': '"production"',
        },
        logLevel: 'info',
      })

      // Flatten Vite HTML output: dist/src/sidepanel/index.html → dist/sidepanel.html
      const sidepanelHtml = resolve(dist, 'src/sidepanel/index.html')
      const optionsHtml = resolve(dist, 'src/options/index.html')

      if (existsSync(sidepanelHtml)) {
        let html = readFileSync(sidepanelHtml, 'utf-8')
        // Replace absolute paths with relative for Chrome extension compatibility
        html = html.replace(/\/assets\//g, 'assets/')
        writeFileSync(resolve(dist, 'sidepanel.html'), html)
      }

      if (existsSync(optionsHtml)) {
        let html = readFileSync(optionsHtml, 'utf-8')
        html = html.replace(/\/assets\//g, 'assets/')
        writeFileSync(resolve(dist, 'options.html'), html)
      }

      // Remove the src/ remnant from dist
      const srcDir = resolve(dist, 'src')
      if (existsSync(srcDir)) {
        rmSync(srcDir, { recursive: true, force: true })
      }

      console.log('\n✅ Build complete! dist/ is ready to load as an unpacked extension.')
    },
  }
}

export default defineConfig({
  plugins: [react(), copyStaticPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
})
