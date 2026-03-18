import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.scss';
import './i18n/config';
import AppWithLanguage from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithLanguage />
  </StrictMode>
);
