import { FC } from 'react';

export const App: FC = () => {
  return (
    <div>
      <h1>Main</h1>
      <button
        style={{ display: 'block', marginBottom: 24 }}
        onClick={() => navigator.serviceWorker?.register('../swsr.js', { scope: './target' })}
      >
        register
      </button>
    </div>
  );
};
