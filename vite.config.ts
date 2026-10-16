import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { splashScreens } from './scripts/pwa-assets.ts';
import { logoSvg } from './src/theme/logo.ts';

/** iOS startskärmar: en <link> per skärmstorlek. Bilderna skapas med `npm run pwa-assets`. */
function appleSplashScreens(): Plugin {
  return {
    name: 'apple-splash-screens',
    transformIndexHtml: () =>
      splashScreens().map(({ href, media }) => ({
        tag: 'link',
        attrs: { rel: 'apple-touch-startup-image', href, media },
        injectTo: 'head',
      })),
  };
}

/** Logotypen i index.htmls statiska skal, samma som BrandLogo.vue ritar. */
function appShellLogo(): Plugin {
  return {
    name: 'app-shell-logo',
    transformIndexHtml: (html) =>
      html.replace(
        '<!-- app-shell-logo -->',
        logoSvg({ cover: 'var(--mk-logo-cover)', spine: 'var(--mk-logo-spine)', band: 'var(--mk-logo-band)' }),
      ),
  };
}

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // Web Awesome-komponenter är webbkomponenter, inte Vue-komponenter.
          isCustomElement: (tag) => tag.startsWith('wa-'),
        },
      },
    }),
    appleSplashScreens(),
    appShellLogo(),
    // Service worker: appen startar utan nät (recepten finns redan lokalt via Dexie).
    // Ny version installeras i bakgrunden och aktiveras när man trycker Uppdatera, se UpdatePrompt.vue.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      // Manifestet finns redan i public/
      manifest: false,
      workbox: {
        // Startskärmarna (flera MB) behövs bara vid installation och tas inte med
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'icons/*.png', 'apple-touch-icon.png', 'manifest.webmanifest'],
        navigateFallback: '/index.html',
        // Workern svarar på dessa, de ska alltid gå mot nätet
        navigateFallbackDenylist: [/^\/api\//, /^\/og\//],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Ikonerna i wa-icon hämtas från Font Awesome
            urlPattern: ({ url }) => url.origin === 'https://ka-f.fontawesome.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'icons',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    // /api/* körs av Workern: starta den med `npm run dev:api`.
    proxy: { '/api': 'http://localhost:8787' },
  },
});
