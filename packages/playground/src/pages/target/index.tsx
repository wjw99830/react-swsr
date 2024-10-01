import { createRoot, hydrateRoot } from 'react-dom/client';
import { RenderingTarget } from '@react-swsr/runtime';
import App from './app';

const root = document.getElementById('root')!;
if (RenderingTarget) {
  console.log('swsr');
  console.log('RenderingTarget:', RenderingTarget);
  hydrateRoot(root, <App />);
} else {
  console.log('csr');
  createRoot(root).render(<App />);
}
