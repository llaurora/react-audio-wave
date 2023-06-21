import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
    mode: "development",
    plugins: [react()],
    server: {
        port: 8080,
    },
});
