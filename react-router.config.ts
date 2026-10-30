import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

const isVercelBuild = process.env.VERCEL === "1";

export default {
  ssr: true,
  // Vercel uses its own server bundle layout. Self-hosted Docker builds retain
  // React Router's standard build/server/index.js entrypoint.
  ...(isVercelBuild ? { presets: [vercelPreset()] } : {}),
} satisfies Config;
