// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import Lobby from './components/lobby/lobby.jsx';
import SimonDice from './components/lobby/simondice/simon.jsx';
import PiedraPapelTijeras from './components/lobby/PPT/piedrapapeltijeras.jsx';
import Tateti from './components/lobby/tateti/tateti.jsx'
import SpaceInvaders from './components/lobby/spaceinvaders/SpaceInvaders.js';
// import Game1942 from './components/lobby/1942/Game1942.jsx';
import Nube from './components/UI/nube.jsx';
import LoadingScreen from './components/UI/LoadingScreen.jsx';
import CustomCursor from './components/UI/CustomCursor.jsx'; // NUEVO
import { useNube } from './contexts/nubecontext.js';

function App() {
  const [currentView, setCurrentView] = useState('lobby');
  const [pendingView, setPendingView] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { showNube, setShowNube } = useNube();

  const handleLoadComplete = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    if (showNube && pendingView) {
      const timer = setTimeout(() => {
        setCurrentView(pendingView);
        setPendingView(null);
        setIsTransitioning(false);
        setTimeout(() => {
          setShowNube(false);
        }, 100);
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [showNube, pendingView, setShowNube]);

  const handleTransition = useCallback((projectId) => {
    console.log('Iniciando transición a:', projectId);
    setIsTransitioning(true);
    setPendingView(projectId);
    setShowNube(true);
  }, [setShowNube]);

  const renderCurrentView = ({ isLoading }) => {
    switch (currentView) {
      case 'lobby':
        return <Lobby onNavigate={handleTransition} animate={!isLoading} isTransitioning={isTransitioning} />;
      case 'simondice': 
        return <SimonDice onBack={() => handleTransition('lobby')} />;
      case 'piedrapapeltijeras':
        return <PiedraPapelTijeras onBack={() => handleTransition('lobby')} />;
      case 'tateti':
        return <Tateti onBack={() => handleTransition('lobby')} />;
      case 'spaceinvaders':
        return <SpaceInvaders onBack={() => handleTransition('lobby')} />;
      // case 'game1942':
      //   return <Game1942 onBack={() => handleTransition('lobby')} />;
      default:
        return (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Proyecto en Desarrollo
              </h2>
              <p className="text-gray-600 mb-6">
                El proyecto "{currentView}" aún no está implementado.
              </p>
              <button
                onClick={() => handleTransition('lobby')}
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Volver al Lobby
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <CustomCursor /> {/* NUEVO - cursor personalizado */}
      {isLoading && <LoadingScreen onLoadComplete={handleLoadComplete} />}
      
      <div style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease-in' }}>
        <Nube />
        {renderCurrentView({ isLoading })}
      </div>
    </>
  );
}

export default App;