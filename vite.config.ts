import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import { splashScreens } from './scripts/pwa-assets.ts';

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
  ],
  server: {
    // /api/* körs av Workern: starta den med `npm run dev:api`.
    proxy: { '/api': 'http://localhost:8787' },
  },
});
