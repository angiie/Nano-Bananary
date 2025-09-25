/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WATERMARK_ENABLED: string
  readonly VITE_WATERMARK_TEXT: string
  readonly VITE_LAOZHANG_API_KEY: string
  readonly VITE_LAOZHANG_BASE_URL: string
  readonly VITE_GEMINI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}