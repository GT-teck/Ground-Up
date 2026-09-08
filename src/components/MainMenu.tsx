import React, { useState } from 'react';
import { Play, Settings as SettingsIcon, Trophy, LogOut, Wrench, Gauge, Flame, Sparkles, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { BarnGarage3D } from './BarnGarage3D';
import { soundFx } from '../utils/audio';

interface MainMenuProps {
  onSelectStart: () => void;
  onSelectSettings: () => void;
  onSelectLeaderboard: () => void;
  onSelectQuit: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  onSelectStart,
  onSelectSettings,
  onSelectLeaderboard,
  onSelectQuit,
}) => {
  const [isFullscreenGarage, setIsFullscreenGarage] = useState<boolean>(false);
  const [revCounter, setRevCounter] = useState<number>(0);

  const handleRev = () => {
    setRevCounter((prev) => prev + 1);
  };

  return (
    <div className="flex-1 flex flex-col justify-between relative overflow-hidden bg-[#090b0e]">
      {/* Top Header Bar: Game Title & Restoration Badge */}
      <header className="relative z-20 px-4 pt-3 pb-2 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-600 to-amber-900 border border-amber-500/40 flex items-center justify-center shadow-inner">
            <Wrench size={16} className="text-amber-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tight uppercase font-display leading-none text-white drop-shadow-md">
              GROUND <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">UP</span>
            </h1>
            <div className="text-[10px] text-amber-400/80 font-badge tracking-wider uppercase">
              Barn Find & Restoration Shop
            </div>
          </div>
        </div>

        {/* Viewport Mode Toggle (Split / Expanded 3D Bay) */}
        <button
          id="btn-toggle-garage-view"
          onClick={() => {
            soundFx.playClick();
            setIsFullscreenGarage(!isFullscreenGarage);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/90 border border-zinc-700/80 hover:border-amber-500/60 text-zinc-300 hover:text-amber-400 text-[11px] font-tech transition-all cursor-pointer shadow-sm"
          title={isFullscreenGarage ? 'Show Menu Buttons' : 'Full 3D Garage View'}
        >
          {isFullscreenGarage ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          <span>{isFullscreenGarage ? 'Menu' : '3D Bay'}</span>
        </button>
      </header>

      {/* 3D Barn Garage Viewport */}
      <div
        className={`relative transition-all duration-300 overflow-hidden ${
          isFullscreenGarage ? 'flex-1 min-h-0' : 'h-64 sm:h-72 shrink-0 border-b border-zinc-800/80'
        }`}
      >
        <BarnGarage3D onRev={handleRev} isInteractive={true} />

        {/* Interactive hint tag */}
        <div className="absolute top-8 left-3 pointer-events-none z-10 flex items-center gap-1.5 text-[9px] font-tech uppercase text-zinc-400 bg-black/40 px-2 py-0.5 rounded border border-white/5">
          <span>Drag 360° to inspect chassis</span>
        </div>
      </div>

      {/* Floating HUD over 3D Bay when in Expanded View */}
      {isFullscreenGarage && (
        <div className="absolute bottom-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
          <button
            id="btn-dock-quick-start"
            onClick={() => {
              soundFx.playStartEngine();
              onSelectStart();
            }}
            className="flex-1 mr-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase font-display tracking-wider rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all text-sm"
          >
            <Play size={16} className="fill-black" />
            ENTER RESTORATION GARAGE
          </button>

          <button
            id="btn-collapse-garage"
            onClick={() => setIsFullscreenGarage(false)}
            className="px-3.5 py-3 bg-zinc-900/90 border border-zinc-700 hover:border-zinc-500 text-zinc-200 rounded-xl text-xs font-display uppercase font-bold cursor-pointer"
          >
            Menu
          </button>
        </div>
      )}

      {/* Standard Menu Buttons (Visible when not in full 3D bay) */}
      {!isFullscreenGarage && (
        <div className="flex-1 flex flex-col justify-between p-4 relative z-20 overflow-y-auto">
          {/* Quick Barn Status strip */}
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-zinc-950/70 border border-zinc-800/80 text-[11px] font-tech text-zinc-400 mb-3 shrink-0">
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Chassis: 1969 Rebel 427 V8
            </span>
            <span className="text-zinc-500">Shop Fund: <strong className="text-emerald-400">$168,400</strong></span>
          </div>

          {/* THE 4 MAIN BUTTONS */}
          <div className="flex flex-col gap-2.5 my-auto">
            {/* 1. START BUTTON */}
            <button
              id="btn-main-start"
              onClick={() => {
                soundFx.playStartEngine();
                onSelectStart();
              }}
              className="group relative w-full h-15 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-[0.98] transition-all duration-150 rounded-xl p-[2px] shadow-[0_6px_20px_rgba(245,158,11,0.3)] cursor-pointer text-left overflow-hidden"
            >
              <div className="w-full h-full bg-[#181510]/85 group-hover:bg-[#181510]/60 transition-colors rounded-[10px] px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-bold shadow-md group-hover:scale-105 transition-transform shrink-0">
                    <Play size={18} className="fill-black ml-0.5" />
                  </div>
                  <div>
                    <div className="text-lg font-black italic tracking-wide uppercase font-display text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      START GAME
                      <Sparkles size={13} className="text-amber-400" />
                    </div>
                    <div className="text-[11px] text-amber-200/80 font-tech uppercase tracking-wider">
                      Load Saved Build • Start New Project
                    </div>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:translate-x-1 transition-transform shrink-0">
                  <span className="text-sm font-bold">›</span>
                </div>
              </div>
            </button>

            {/* 2. SETTINGS BUTTON */}
            <button
              id="btn-main-settings"
              onClick={() => {
                soundFx.playSelect();
                onSelectSettings();
              }}
              className="group relative w-full h-13 bg-zinc-900/90 hover:bg-zinc-800/90 active:scale-[0.98] border border-zinc-800 hover:border-zinc-700 transition-all duration-150 rounded-xl px-4 flex items-center justify-between cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-300 group-hover:text-amber-400 group-hover:border-amber-500/40 transition-colors shrink-0">
                  <SettingsIcon size={17} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold tracking-wide uppercase font-display text-zinc-100 group-hover:text-amber-400 transition-colors">
                    SETTINGS
                  </div>
                  <div className="text-[10px] text-zinc-400 font-tech">
                    Audio Volumes & Graphics Quality
                  </div>
                </div>
              </div>

              <span className="text-zinc-500 group-hover:text-zinc-300 text-base transition-transform group-hover:translate-x-1">
                ›
              </span>
            </button>

            {/* 3. LEADERBOARD BUTTON */}
            <button
              id="btn-main-leaderboard"
              onClick={() => {
                soundFx.playSelect();
                onSelectLeaderboard();
              }}
              className="group relative w-full h-13 bg-zinc-900/90 hover:bg-zinc-800/90 active:scale-[0.98] border border-zinc-800 hover:border-zinc-700 transition-all duration-150 rounded-xl px-4 flex items-center justify-between cursor-pointer shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
                  <Trophy size={17} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold tracking-wide uppercase font-display text-zinc-100 group-hover:text-amber-400 transition-colors">
                    LEADERBOARD
                  </div>
                  <div className="text-[10px] text-zinc-400 font-tech">
                    Top Speed • Most Sold Cars • Money Earned
                  </div>
                </div>
              </div>

              <span className="text-zinc-500 group-hover:text-zinc-300 text-base transition-transform group-hover:translate-x-1">
                ›
              </span>
            </button>

            {/* 4. QUIT BUTTON */}
            <button
              id="btn-main-quit"
              onClick={() => {
                soundFx.playBack();
                onSelectQuit();
              }}
              className="group relative w-full h-11 bg-zinc-950/60 hover:bg-red-950/30 active:scale-[0.98] border border-zinc-800/80 hover:border-red-800/50 transition-all duration-150 rounded-xl px-4 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-red-400 transition-colors shrink-0">
                  <LogOut size={14} />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold tracking-wide uppercase font-display text-zinc-400 group-hover:text-red-300 transition-colors">
                    QUIT GAME
                  </div>
                </div>
              </div>

              <span className="text-zinc-600 group-hover:text-red-400 text-[10px] font-tech tracking-wider uppercase">
                Exit App
              </span>
            </button>
          </div>

          {/* Footer build tag */}
          <footer className="pt-2 flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-800/60 shrink-0">
            <span className="font-tech">GROUND UP • V0.2.0-ALPHA</span>
            <span className="text-zinc-400 flex items-center gap-1 font-tech">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              BARN GARAGE ENGINE ACTIVE
            </span>
          </footer>
        </div>
      )}
    </div>
  );
};
