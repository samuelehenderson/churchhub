import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { loadChurches } from './data/store.js';
import './styles/global.css';

// Kick off the initial church fetch in the background. Components will
// re-render via the useChurches() hook when the data arrives.
loadChurches();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
