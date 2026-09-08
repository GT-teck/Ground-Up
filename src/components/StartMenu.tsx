import React, { useState } from 'react';
import { ArrowLeft, FolderOpen, PlusCircle, Car, Clock, DollarSign, CheckCircle2, ChevronRight, Play } from 'lucide-react';
import { SaveSlot, StartSubView } from '../types';
import { INITIAL_SAVE_SLOTS, STARTER_CARS } from '../data/gameData';
import { soundFx } from '../utils/audio';

interface StartMenuProps {
  onBack: () => void;
  onEnterGarage?: (garageName?: string) => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({ onBack, onEnterGarage }) => {
  const [subView, setSubView] = useState<StartSubView>('choose');
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>(INITIAL_SAVE_SLOTS);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('slot-1');
  const [selectedStarterCarId, setSelectedStarterCarId] = useState<string>('rebel-69');
  const [garageName, setGarageName] = useState<string>('Rust Valley Restorations');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleSelectSlot = (slot: SaveSlot) => {
    if (slot.isEmpty) {
      soundFx.playClick();
      setSubView('start_new');
      return;
    }
    soundFx.playSelect();
    setSelectedSlotId(slot.id);
  };

  const handleLaunchLoadedSave = () => {
    soundFx.playStartEngine();
    const slot = saveSlots.find((s) => s.id === selectedSlotId);
    setFeedbackMessage(`Entering Garage Workshop... Loading "${slot?.title || 'Profile'}"!`);
    setTimeout(() => {
      onEnterGarage?.(slot?.title || garageName);
    }, 600);
  };

  const handleLaunchNewGame = () => {
    soundFx.playStartEngine();
    const car = STARTER_CARS.find((c) => c.id === selectedStarterCarId);
    setFeedbackMessage(`Entering Workshop Bay with "${car?.name}"!`);
    setTimeout(() => {
      onEnterGarage?.(garageName);
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col p-5 relative overflow-hidden">
      {/* Ambient background accents */}
      <div className="absolute top-10 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
        <button
          id="btn-start-back"
          onClick={() => {
            soundFx.playBack();
            if (subView !== 'choose') {
              setSubView('choose');
            } else {
              onBack();
            }
          }}
          className="flex items-center gap-2 text-xs font-bold font-tech uppercase text-zinc-400 hover:text-amber-400 transition-colors py-1.5 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>{subView === 'choose' ? 'Main Menu' : 'Back'}</span>
        </button>

        <div className="text-right">
          <div className="text-xs font-bold tracking-widest text-amber-500 uppercase font-display">
            CAMPAIGN
          </div>
          <div className="text-[10px] text-zinc-400 font-tech uppercase">
            {subView === 'choose' ? 'Select Mode' : subView === 'load_save' ? 'Load Save' : 'Start New Career'}
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {feedbackMessage && (
        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-950/90 to-zinc-900 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2.5 shadow-xl animate-fade-in z-20">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold uppercase font-display block text-emerald-200">System Notification</span>
            <span>{feedbackMessage}</span>
          </div>
        </div>
      )}

      {/* VIEW 1: Initial Start Menu with the 2 PRIMARY OPTIONS */}
      {subView === 'choose' && (
        <div className="flex-1 flex flex-col justify-center py-6 gap-5">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-black italic tracking-wide uppercase font-display text-white">
              PROJECT SETUP
            </h2>
            <p className="text-xs text-zinc-400 font-tech mt-1 uppercase tracking-wider">
              Choose how you want to build your garage empire
            </p>
          </div>

          {/* Option 1: LOAD SAVE */}
          <button
            id="btn-option-load-save"
            onClick={() => {
              soundFx.playSelect();
              setSubView('load_save');
            }}
            className="group relative w-full p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 hover:from-zinc-850 hover:to-zinc-900 border-2 border-zinc-800 hover:border-amber-500/60 rounded-2xl transition-all duration-200 text-left cursor-pointer shadow-lg hover:shadow-amber-500/10 active:scale-[0.99]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <FolderOpen size={26} />
                </div>
                <div>
                  <div className="text-xl font-bold tracking-wide uppercase font-display text-white group-hover:text-amber-300 transition-colors flex items-center gap-2">
                    LOAD SAVE
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 font-tech px-2 py-0.5 rounded-full uppercase border border-amber-500/30">
                      2 Saved
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-tech mt-1">
                    Resume an existing garage build, fleet of cars, and cash balance.
                  </p>
                </div>
              </div>
              <ChevronRight className="text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all mt-3" />
            </div>

            {/* Teaser snapshot */}
            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-tech">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Car size={13} className="text-amber-400" />
                Latest: 1993 Twin-Cam Hatch
              </span>
              <span className="text-emerald-400 font-bold">$142,800</span>
            </div>
          </button>

          {/* Option 2: START NEW */}
          <button
            id="btn-option-start-new"
            onClick={() => {
              soundFx.playSelect();
              setSubView('start_new');
            }}
            className="group relative w-full p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 hover:from-zinc-850 hover:to-zinc-900 border-2 border-zinc-800 hover:border-orange-500/60 rounded-2xl transition-all duration-200 text-left cursor-pointer shadow-lg hover:shadow-orange-500/10 active:scale-[0.99]"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-13 h-13 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
                  <PlusCircle size={26} />
                </div>
                <div>
                  <div className="text-xl font-bold tracking-wide uppercase font-display text-white group-hover:text-orange-300 transition-colors flex items-center gap-2">
                    START NEW
                    <span className="text-[10px] bg-orange-500/20 text-orange-400 font-tech px-2 py-0.5 rounded-full uppercase border border-orange-500/30">
                      Fresh Run
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-tech mt-1">
                    Acquire your first rust-bucket chassis and build your reputation from scratch.
                  </p>
                </div>
              </div>
              <ChevronRight className="text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-1 transition-all mt-3" />
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400 font-tech">
              <span>Choose from 3 Starter Project Cars</span>
              <span className="text-amber-400 font-bold">$15,000 Seed Capital</span>
            </div>
          </button>
        </div>
      )}

      {/* VIEW 2: LOAD SAVE Sub-screen */}
      {subView === 'load_save' && (
        <div className="flex-1 flex flex-col justify-between py-3 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold uppercase font-display text-white">
                SELECT SAVE PROFILE
              </h3>
              <span className="text-[11px] text-zinc-400 font-tech">3 Slots Available</span>
            </div>

            <div className="flex flex-col gap-3">
              {saveSlots.map((slot) => {
                const isSelected = selectedSlotId === slot.id && !slot.isEmpty;
                return (
                  <div
                    key={slot.id}
                    id={`save-slot-${slot.id}`}
                    onClick={() => handleSelectSlot(slot)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      slot.isEmpty
                        ? 'border-dashed border-zinc-800 bg-zinc-950/40 hover:border-zinc-700'
                        : isSelected
                        ? 'border-amber-500 bg-amber-950/20 shadow-md shadow-amber-500/10'
                        : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-sm font-bold font-display uppercase ${isSelected ? 'text-amber-300' : 'text-zinc-200'}`}>
                        {slot.title}
                      </span>
                      {slot.isEmpty ? (
                        <span className="text-[10px] font-tech text-zinc-500 uppercase bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          Empty
                        </span>
                      ) : (
                        <span className="text-[10px] font-tech text-amber-400 font-bold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-500/30">
                          {slot.completionPercent}% Career
                        </span>
                      )}
                    </div>

                    {!slot.isEmpty ? (
                      <div>
                        <div className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-2">
                          <Car size={13} className="text-amber-400" />
                          {slot.carModel}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-tech text-zinc-400 pt-2 border-t border-zinc-800/80">
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-zinc-500" />
                            Time: {slot.playtime}
                          </span>
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <DollarSign size={11} />
                            ${slot.cash.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-500 font-tech py-2 text-center">
                        + Tap to start a fresh campaign in this slot
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <button
              id="btn-confirm-load-save"
              onClick={handleLaunchLoadedSave}
              className="w-full h-13 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-black uppercase font-display tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer active:scale-95 transition-all"
            >
              <Play size={18} className="fill-black" />
              LOAD SELECTED SAVE
            </button>
          </div>
        </div>
      )}

      {/* VIEW 3: START NEW Sub-screen */}
      {subView === 'start_new' && (
        <div className="flex-1 flex flex-col justify-between py-2 overflow-y-auto">
          <div>
            <div className="mb-3">
              <h3 className="text-lg font-bold uppercase font-display text-white">
                START NEW CAREER
              </h3>
              <p className="text-xs text-zinc-400 font-tech">Name your workshop and choose your starting project</p>
            </div>

            {/* Garage Name Input */}
            <div className="mb-4">
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1">
                Workshop / Tuner Name
              </label>
              <input
                id="input-garage-name"
                type="text"
                value={garageName}
                onChange={(e) => setGarageName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-display font-semibold outline-none"
                placeholder="Enter Garage Name..."
              />
            </div>

            {/* Starter Vehicle Picker */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-2">
                Select Starter Chassis (Budget: $15,000)
              </label>

              <div className="flex flex-col gap-2.5">
                {STARTER_CARS.map((car) => {
                  const isSelected = selectedStarterCarId === car.id;
                  return (
                    <div
                      key={car.id}
                      id={`starter-car-${car.id}`}
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedStarterCarId(car.id);
                      }}
                      className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-950/20 shadow-md shadow-orange-500/10'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${car.color}`} />
                          <span className={`text-xs font-bold uppercase font-display ${isSelected ? 'text-orange-300' : 'text-zinc-200'}`}>
                            {car.name}
                          </span>
                        </div>
                        <span className="text-[10px] font-tech text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                          {car.difficulty}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-400 font-tech mt-1">{car.tagline}</p>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 pt-2 border-t border-zinc-800 text-[10px] font-tech text-zinc-400">
                        <span>HP: <strong className="text-zinc-200">{car.hp}</strong></span>
                        <span>Weight: <strong className="text-zinc-200">{car.weight}</strong></span>
                        <span>Tuning: <strong className="text-amber-400">{car.potential}</strong></span>
                        {'condition' in car && (
                          <span className="text-amber-300 font-semibold bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {car.condition}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-auto">
            <button
              id="btn-confirm-start-new"
              onClick={handleLaunchNewGame}
              className="w-full h-13 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black font-black uppercase font-display tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 cursor-pointer active:scale-95 transition-all"
            >
              <Play size={18} className="fill-black" />
              COMMENCE PROJECT BUILD
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
