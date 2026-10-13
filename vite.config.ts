import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const backendUrl = env.VITE_API_URL || "http://localhost:8000";

  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
      dedupe: ["react", "react-dom", "react-router"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router"],
    },
    server: {
      proxy: {
        // Only proxy API endpoints to backend
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        "/sanctum": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        "/broadcasting": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },
        // Frontend routes are handled by React Router, not proxied
        // /login, /register, /logout are frontend routes
      },
    },
  };
});
