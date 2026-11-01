/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // GitHub Pages serves the site from /<repo-name>/. The dev preview build
  // (`--mode dev`, see deploy.yml) is served from /<repo-name>/dev/ instead.
  const isDev = mode === 'dev';
  const base = isDev ? '/nihongo-aidoru/dev/' : '/nihongo-aidoru/';
  return {
    base,
    build: {
      // Two pages: the game, and the ideas page at <base>ideas/.
      rollupOptions: { input: { main: 'index.html', ideas: 'ideas/index.html' } },
    },
    plugins: [
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        manifest: {
          name: isDev ? 'Nihongo Aidoru (dev)' : 'Nihongo Aidoru',
          short_name: isDev ? 'Aidoru dev' : 'Aidoru',
          description: 'A sushi idle game for learning Japanese kana.',
          lang: 'en',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#14121f',
          theme_color: '#14121f',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          // The real site's service worker also covers /dev/; don't answer those pages with the real app.
          navigateFallbackDenylist: isDev ? [] : [/\/dev\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts', expiration: { maxEntries: 30 } },
            },
          ],
        },
      }),
    ],
    test: {
      environment: 'node',
    },
  };
});
