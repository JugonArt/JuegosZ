import React, { useState } from 'react';
import bgm from '../../../utils/backgroundMusic.js';
import Nube from '../../UI/nube.jsx';
import GameMenu from './GameMenu.jsx';
import SinglePlayerGame from './SinglePlayerGame.jsx';
import MultiplayerGame from './MultiplayerGame.jsx';
import styles from '../../styles/tateti/tateti.module.css';

const Tateti = ({ onBack }) => {
  const [currentView, setCurrentView] = useState('menu');
  const [playerName, setPlayerName] = useState('');
  const [player1Name, setPlayer1Name] = useState('');
  const [player2Name, setPlayer2Name] = useState('');

  const handleSinglePlayer = (name) => {
    setPlayerName(name);
    // Attempt to start BGM in the direct user gesture that opens the game so
    // browsers treat playback as user-initiated and don't block it.
    try { bgm.init(); bgm.play(); } catch (e) {}
    setCurrentView('singlePlayer');
  };

  const handleMultiplayer = (p1Name, p2Name) => {
    setPlayer1Name(p1Name);
    setPlayer2Name(p2Name);
    try { bgm.init(); bgm.play(); } catch (e) {}
    setCurrentView('multiplayer');
  };

  const handleBack = (targetView = 'menu') => {
    if (targetView === 'playerSelect') {
      setCurrentView('menu');
    } else {
      setCurrentView(targetView);
    }
  };

  const handleBackToLobby = () => {
    setCurrentView('menu');
    setPlayerName('');
    setPlayer1Name('');
    setPlayer2Name('');
    onBack();
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'singlePlayer':
        return (
          <SinglePlayerGame 
            onBack={handleBack}
            onBackToLobby={handleBackToLobby}
            playerName={playerName}
          />
        );
      case 'multiplayer':
        return (
          <MultiplayerGame 
            onBack={handleBack}
            onBackToLobby={handleBackToLobby}
            player1Name={player1Name}
            player2Name={player2Name}
          />
        );
      default:
        return (
          <GameMenu
            onSinglePlayer={handleSinglePlayer}
            onMultiplayer={handleMultiplayer}
            onBack={handleBackToLobby}
          />
        );
    }
  };

  return (
    <div className={styles.tatetiContainer}>
      <Nube />
      {renderCurrentView()}
    </div>
  );
};

export default Tateti;
