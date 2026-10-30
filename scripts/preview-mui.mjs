import { createServer } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// Local component review, with no API connection, credentials or application routes.
const app = path.resolve("app");
const server = await createServer({
  configFile: false,
  plugins: [tailwindcss()],
  resolve: { alias: [{ find: "~", replacement: app }], dedupe: ["react", "react-dom"] },
  server: { host: "127.0.0.1", port: 5175, strictPort: true, watch: null },
});
await server.listen();
console.log("MUI component review: http://127.0.0.1:5175/tests/ui/index.html");
