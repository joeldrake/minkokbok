import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

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
  ],
});
