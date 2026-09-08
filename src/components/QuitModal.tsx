import React from 'react';
import { LogOut, X, AlertTriangle, Play } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface QuitModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirmQuit: () => void;
  isGameExited: boolean;
  onResumeGame: () => void;
}

export const QuitModal: React.FC<QuitModalProps> = ({
  isOpen,
  onCancel,
  onConfirmQuit,
  isGameExited,
  onResumeGame,
}) => {
  // If the game is simulated as exited to the device home screen
  if (isGameExited) {
    return (
      <div className="absolute inset-0 bg-[#050608] z-50 flex flex-col items-center justify-between p-6 text-center animate-fade-in">
        <div className="pt-8">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-600 mb-3 shadow-inner">
            <LogOut size={28} />
          </div>
          <h3 className="text-xl font-bold uppercase font-display text-zinc-300">
            Game Suspended
          </h3>
          <p className="text-xs text-zinc-500 font-tech mt-1">
            Ground Up process paused in background
          </p>
        </div>

        <div className="my-auto w-full max-w-xs p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div className="text-xs text-zinc-400 mb-3 font-tech">
            Mobile session saved. Tap below to resume your workshop session.
          </div>
          <button
            id="btn-resume-game-after-quit"
            onClick={() => {
              soundFx.playStartEngine();
              onResumeGame();
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase font-display tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95 transition-all"
          >
            <Play size={18} className="fill-black" />
            RELAUNCH GROUND UP
          </button>
        </div>

        <div className="text-[11px] text-zinc-600 font-tech pb-4">
          Prototype App Lifecycle Manager
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-5 animate-fade-in">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl relative">
        <button
          id="btn-quit-close"
          onClick={() => {
            soundFx.playBack();
            onCancel();
          }}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-800/60 flex items-center justify-center text-red-400">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h4 className="text-base font-bold uppercase font-display text-white">
              QUIT GROUND UP?
            </h4>
            <span className="text-[11px] text-zinc-400 font-tech">Exit session confirmation</span>
          </div>
        </div>

        <p className="text-xs text-zinc-300 mb-5 leading-relaxed font-tech">
          Are you sure you want to close the game? All your workshop settings and progression will be safely preserved in local memory.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            id="btn-quit-cancel"
            onClick={() => {
              soundFx.playClick();
              onCancel();
            }}
            className="py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold uppercase font-display tracking-wider transition-colors cursor-pointer"
          >
            STAY & PLAY
          </button>

          <button
            id="btn-quit-confirm"
            onClick={() => {
              soundFx.playBack();
              onConfirmQuit();
            }}
            className="py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase font-display tracking-wider transition-colors shadow-lg shadow-red-600/30 cursor-pointer"
          >
            EXIT GAME
          </button>
        </div>
      </div>
    </div>
  );
};
