import React, { useState } from 'react';
import { Smartphone, Monitor, Volume2, VolumeX, Battery, Wifi, RotateCw } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface MobileFrameProps {
  children: React.ReactNode;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({
  children,
  soundEnabled,
  onToggleSound,
}) => {
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(true);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleToggleOrientation = () => {
    soundFx.playClick();
    setOrientation((prev) => (prev === 'portrait' ? 'landscape' : 'portrait'));
  };

  return (
    <div className="min-h-screen w-full bg-[#08090c] text-zinc-100 flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 overflow-hidden relative selection:bg-amber-500 selection:text-black">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-garage-grid opacity-60" />
      </div>

      {/* Top utility bar on desktop / preview mode */}
      <header className={`w-full ${orientation === 'landscape' ? 'max-w-4xl' : 'max-w-md'} hidden sm:flex items-center justify-between px-3 py-2 text-xs text-zinc-400 z-20 mb-2 transition-all duration-300`}>
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-semibold tracking-wider text-zinc-300 font-display">GROUND UP • BARN FIND RESTORATION</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-orientation-toggle"
            onClick={handleToggleOrientation}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 hover:text-amber-400 transition-colors cursor-pointer"
            title="Toggle Landscape / Portrait orientation"
          >
            <RotateCw size={12} className="text-amber-400" />
            <span className="capitalize">{orientation}</span>
          </button>

          <button
            id="btn-sound-toggle-header"
            onClick={() => {
              onToggleSound();
              soundFx.playToggle();
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 hover:text-amber-400 transition-colors cursor-pointer"
            title="Toggle Menu Sound Synthesis"
          >
            {soundEnabled ? <Volume2 size={13} className="text-amber-400" /> : <VolumeX size={13} className="text-zinc-500" />}
            <span>{soundEnabled ? 'Audio ON' : 'Muted'}</span>
          </button>

          <button
            id="btn-frame-mode-toggle"
            onClick={() => {
              setDeviceFrameMode(!deviceFrameMode);
              soundFx.playClick();
            }}
            className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800 hover:border-amber-500/50 hover:text-amber-400 transition-colors cursor-pointer"
            title="Switch phone frame simulation vs full viewport"
          >
            {deviceFrameMode ? <Smartphone size={13} className="text-amber-400" /> : <Monitor size={13} />}
            <span>{deviceFrameMode ? 'Phone Frame' : 'Full Screen'}</span>
          </button>
        </div>
      </header>

      {/* Main Container - Phone chassis or full screen */}
      <main
        className={`w-full relative z-10 transition-all duration-300 ${
          deviceFrameMode
            ? orientation === 'landscape'
              ? 'sm:max-w-[840px] sm:h-[500px] sm:max-h-[92vh] sm:rounded-[36px] sm:border-[8px] sm:border-zinc-800/90 sm:shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden'
              : 'sm:max-w-[420px] sm:h-[880px] sm:max-h-[92vh] sm:rounded-[44px] sm:border-[8px] sm:border-zinc-800/90 sm:shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.08)] overflow-hidden'
            : 'w-full h-screen max-w-4xl sm:rounded-2xl sm:border sm:border-zinc-800 overflow-hidden'
        } bg-[#0e1117] flex flex-col`}
      >
        {/* Mobile Device Status Bar */}
        <div className="w-full flex items-center justify-between px-6 pt-3 pb-1 text-[11px] font-semibold text-zinc-400 select-none shrink-0 z-30">
          <span className="font-tech tracking-wider">{currentTime}</span>
          
          {/* Dynamic Island / Speaker notch simulation */}
          <div className="w-24 h-4 bg-black/80 rounded-full flex items-center justify-center gap-1.5 border border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            <span className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700/60 flex items-center justify-center">
              <span className="w-1 h-1 rounded-full bg-blue-900/60" />
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Wifi size={12} className="text-zinc-400" />
            <span className="text-[10px] font-tech text-amber-400">5G</span>
            <Battery size={13} className="text-zinc-400" />
          </div>
        </div>

        {/* Screen Content Wrapper */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col scrollbar-thin scrollbar-thumb-zinc-800">
          {children}
        </div>

        {/* Mobile Home Bar Indicator */}
        <div className="w-full py-2 flex items-center justify-center shrink-0 z-30 pointer-events-none bg-gradient-to-t from-black/60 to-transparent">
          <div className="w-32 h-1 bg-zinc-600/70 rounded-full" />
        </div>
      </main>
    </div>
  );
};
