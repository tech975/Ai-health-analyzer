import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { trackWebVitals } from './utils/performance'

// Initialize performance monitoring in production
if (import.meta.env.PROD) {
  trackWebVitals();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)