import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import PropTypes from 'prop-types';

if (typeof window !== 'undefined') {
  (window as any).require = (name: string) => {
    if (name === 'prop-types') return PropTypes;
    return null;
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
