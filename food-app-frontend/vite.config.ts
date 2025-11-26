import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [
        svgr(),
        react(),
        mode === 'development' && componentTagger(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
            },
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'Food Ordering App',
                short_name: 'FoodApp',
                description: 'Order food from your favorite restaurants',
                theme_color: '#00000000',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ],
                screenshots: [
                    {
                        src: "screenshot-mobile.png",
                        sizes: "473x840",
                        type: "image/png",
                        form_factor: "narrow" // for mobile
                    },
                    {
                        src: "screenshot-desktop.png",
                        sizes: "1920X966",
                        type: "image/png",
                        form_factor: "wide" // for desktop
                    }
                ],

            }
        })
    ].filter(Boolean),
    server: {
        host: "::",
        port: 8080,
        proxy: {
            '/api': {
                target: 'http://localhost:8000',
                changeOrigin: true,
                secure: false,
            }
        }
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
}));
