import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  ssr: true,
  // Keeps React Router's server output, route assets, and CSS manifests aligned
  // with Vercel's deployment runtime.
  presets: [vercelPreset()],
} satisfies Config;
