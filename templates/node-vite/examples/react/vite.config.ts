import path from 'node:path';
import usePlugin from '@tomjs/vite-plugin-template';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      // https://github.com/facebook/react/issues/24928#issuecomment-2267624188
      react: path.resolve(process.cwd(), 'node_modules/react'),
    },
  },
  plugins: [react(), usePlugin()],
});
