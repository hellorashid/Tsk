/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASIC_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
