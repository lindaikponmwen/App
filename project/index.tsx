import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App.tsx';
import './index.css';
import { SettingsProvider } from './src/contexts/SettingsContext.tsx';
import { FileProvider } from './src/contexts/FileContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <FileProvider>
        <App />
      </FileProvider>
    </SettingsProvider>
  </StrictMode>
);