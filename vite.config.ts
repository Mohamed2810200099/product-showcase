import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Load all env vars (no prefix) into process.env so server routes can read
  // SUPABASE_SERVICE_ROLE_KEY and other non-VITE secrets. This does NOT leak
  // them to the client bundle (we don't add them to envDefine).
  const serverEnv = loadEnv(mode ?? "development", process.cwd(), "");
  Object.assign(process.env, serverEnv);

  return {
    vite: {
      resolve: {
        alias: {
          "entities/lib/decode.js": path.resolve(__dirname, "node_modules/entities/lib/decode.js"),
          "entities/lib/encode.js": path.resolve(__dirname, "node_modules/entities/lib/encode.js"),
          "entities": path.resolve(__dirname, "node_modules/entities"),
        },
      },
    },
  };
});
