/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEV_WALLET?: string;
  readonly VITE_REOWN_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  ethereum?: import("ethers").Eip1193Provider;
}
