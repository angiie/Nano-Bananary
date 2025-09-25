import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'import.meta.env.VITE_LAOZHANG_API_KEY': JSON.stringify(env.LAOZHANG_API_KEY),
        'import.meta.env.VITE_LAOZHANG_BASE_URL': JSON.stringify(env.LAOZHANG_BASE_URL),
        'import.meta.env.VITE_WATERMARK_ENABLED': JSON.stringify(env.WATERMARK_ENABLED),
        'import.meta.env.VITE_WATERMARK_TEXT': JSON.stringify(env.WATERMARK_TEXT)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
