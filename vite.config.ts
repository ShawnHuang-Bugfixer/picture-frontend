import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8123',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }

          if (id.includes('ant-design-vue/es/')) {
            const antSegment = id.split('ant-design-vue/es/')[1]?.split('/')[0]
            if (antSegment) {
              return `vendor-ant-${antSegment.replace(/[^a-zA-Z0-9_-]/g, '')}`
            }
          }

          if (id.includes('@ant-design/icons-vue') || id.includes('@ant-design/icons-svg')) {
            return 'vendor-ant-icons'
          }

          if (id.includes('vue-echarts')) {
            return 'vendor-vue-echarts'
          }

          if (id.includes('echarts/lib/chart') || id.includes('echarts/charts')) {
            return 'vendor-echarts-charts'
          }

          if (id.includes('echarts/lib/component') || id.includes('echarts/components')) {
            return 'vendor-echarts-components'
          }

          if (id.includes('echarts/lib/core') || id.includes('echarts/core')) {
            return 'vendor-echarts-core'
          }

          if (id.includes('echarts/lib/renderer') || id.includes('echarts/renderers') || id.includes('echarts')) {
            return 'vendor-echarts-misc'
          }

          if (
            id.includes('vue-cropper') ||
            id.includes('cropper') ||
            id.includes('qrcode') ||
            id.includes('file-saver')
          ) {
            return 'vendor-media'
          }

          if (
            id.includes('/vue/') ||
            id.includes('vue-router') ||
            id.includes('pinia') ||
            id.includes('@vue')
          ) {
            return 'vendor-vue'
          }

          return 'vendor-misc'
        },
      },
    },
  },
})
