import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';   // 👈 importante
import App from './App.js';
import '../src/components/styles/UI.css';
import reportWebVitals from './reportWebVitals.js';
import { NubeProvider } from './contexts/nubecontext.js'; // Use the new relative path

// Importar helper de migración para exponer funciones globalmente
import './utils/globalMigrationHelper.js';

export { default } from './components/lobby/lobby.jsx';
export { default as GameForm } from './components/UI/formularioradar.jsx';
export { default as GameBoard } from './components/lobby/PPT/gameboard.jsx';
export { default as VideoPlayer } from './components/UI/videoplayer.jsx';
export { default as PiedraPapelTijeras } from './components/lobby/PPT/piedrapapeltijeras.jsx';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <NubeProvider>
      <App />
    </NubeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
