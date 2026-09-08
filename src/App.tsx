/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Screen, CharacterCustomization } from './types';
import { MobileFrame } from './components/MobileFrame';
import { MainMenu } from './components/MainMenu';
import { StartMenu } from './components/StartMenu';
import { SettingsMenu } from './components/SettingsMenu';
import { LeaderboardMenu } from './components/LeaderboardMenu';
import { QuitModal } from './components/QuitModal';
import { WorkshopView } from './components/WorkshopView';
import { soundFx } from './utils/audio';
import { DEFAULT_CHARACTER } from './utils/characterModel';

export default function App() {
  const [screen, setScreen] = useState<Screen>('main');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState<boolean>(false);
  const [isGameExited, setIsGameExited] = useState<boolean>(false);
  const [garageName, setGarageName] = useState<string>('Rust Valley Restorations');
  const [activeCharacter, setActiveCharacter] = useState<CharacterCustomization>(DEFAULT_CHARACTER);

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundFx.enabled = nextState;
  };

  const handleOpenQuitModal = () => {
    setIsQuitModalOpen(true);
  };

  const handleCloseQuitModal = () => {
    setIsQuitModalOpen(false);
  };

  const handleConfirmQuit = () => {
    setIsQuitModalOpen(false);
    setIsGameExited(true);
  };

  const handleResumeGame = () => {
    setIsGameExited(false);
    setScreen('main');
  };

  const handleEnterGarage = (customName?: string, character?: CharacterCustomization) => {
    if (customName) setGarageName(customName);
    if (character) setActiveCharacter(character);
    setScreen('garage');
  };

  return (
    <MobileFrame soundEnabled={soundEnabled} onToggleSound={handleToggleSound}>
      <AnimatePresence mode="wait">
        {screen === 'main' && (
          <motion.div
            key="screen-main"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <MainMenu
              onSelectStart={() => setScreen('start')}
              onSelectSettings={() => setScreen('settings')}
              onSelectLeaderboard={() => setScreen('leaderboard')}
              onSelectQuit={handleOpenQuitModal}
            />
          </motion.div>
        )}

        {screen === 'start' && (
          <motion.div
            key="screen-start"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <StartMenu
              onBack={() => setScreen('main')}
              onEnterGarage={handleEnterGarage}
            />
          </motion.div>
        )}

        {screen === 'garage' && (
          <motion.div
            key="screen-garage"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <WorkshopView
              onBackToMenu={() => setScreen('main')}
              garageName={garageName}
              character={activeCharacter}
            />
          </motion.div>
        )}

        {screen === 'settings' && (
          <motion.div
            key="screen-settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <SettingsMenu
              onBack={() => setScreen('main')}
              soundEnabled={soundEnabled}
              onToggleSound={handleToggleSound}
            />
          </motion.div>
        )}

        {screen === 'leaderboard' && (
          <motion.div
            key="screen-leaderboard"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <LeaderboardMenu onBack={() => setScreen('main')} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quit Modal & Game Exited Screen */}
      <QuitModal
        isOpen={isQuitModalOpen}
        onCancel={handleCloseQuitModal}
        onConfirmQuit={handleConfirmQuit}
        isGameExited={isGameExited}
        onResumeGame={handleResumeGame}
      />
    </MobileFrame>
  );
}


