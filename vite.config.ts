import path from 'path'
import dts from 'vite-plugin-dts'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
   plugins: [
      vue(),
      dts({
         include: ['src/**/*.{ts,tsx,vue}', 'src/types/**/*.{ts,d.ts}'],
         copyDtsFiles: true,
      }),
   ],
   resolve: {
      alias: {
         '@': path.resolve(__dirname, 'src'),
      },
   },
   build: {
      lib: {
         entry: {
            index: path.resolve(__dirname, 'src/index.ts'),
         },
         formats: ['es'],
         fileName: (format, entryName) => `${entryName}.js`,
      },
      rollupOptions: {
         external: ['vue'],
         output: {
            globals: {
               vue: 'Vue',
            },
         },
      },
   },
})
