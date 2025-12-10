import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// --- Developer Tools ---
// Allows the user to type hardReset() in the browser console to wipe state.
(window as any).hardReset = () => {
  try {
    localStorage.removeItem('neuroflow-v1-state');
    console.log('💥 Universe deleted. Reloading...');
    window.location.reload();
  } catch (e) {
    console.error('Failed to clear storage:', e);
  }
};

console.log(
  '%c 🧠 NeuroFlow 3D Loaded \n%c Type "hardReset()" in this console to wipe local storage and restart.', 
  'font-weight: bold; font-size: 16px; color: #22d3ee;', 
  'color: #94a3b8;'
);

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);