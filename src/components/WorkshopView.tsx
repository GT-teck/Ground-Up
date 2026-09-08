import React, { useState } from 'react';
import {
  ArrowLeft,
  Wrench,
  Droplets,
  Zap,
  Disc3,
  MapPin,
  Camera,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Plus,
  Trash2,
  Volume2,
  ShoppingBag,
  Layers,
  X,
  Sparkles,
  Car,
} from 'lucide-react';
import { CarPart, WorkstationType } from '../types';
import { INITIAL_CAR_PARTS, StorePartItem, JunkyardBeater } from '../data/partsData';
import { OpenWorld3D } from './OpenWorld3D';
import { WorkstationsModal } from './WorkstationsModal';
import { TownMapModal } from './TownMapModal';
import { soundFx } from '../utils/audio';

interface WorkshopViewProps {
  onBackToMenu: () => void;
  garageName?: string;
}

export const WorkshopView: React.FC<WorkshopViewProps> = ({
  onBackToMenu,
  garageName = 'Rust Valley Restorations',
}) => {
  const [cash, setCash] = useState<number>(142800);
  const [parts, setParts] = useState<CarPart[]>(INITIAL_CAR_PARTS);
  const [activeStation, setActiveStation] = useState<WorkstationType | null>(null);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);
  const [mapTab, setMapTab] = useState<'junkyard' | 'parts_store' | 'tire_shop' | 'buyers'>('junkyard');
  const [isPartsDrawerOpen, setIsPartsDrawerOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Calculate restoration progress
  const workingParts = parts.filter(
    (p) => p.isInstalled && p.condition >= 80 && p.isClean && !p.needsCharge && !p.needsTireChange
  );
  const completionPercent = Math.round((workingParts.length / parts.length) * 100);

  // Toggle Part Installation (Quick pull / install)
  const handleToggleInstall = (partId: string) => {
    soundFx.playImpactWrench();
    setParts((prev) =>
      prev.map((p) => {
        if (p.id === partId) {
          const nextState = !p.isInstalled;
          showToast(nextState ? `Installed ${p.name} onto chassis` : `Pulled ${p.name} to garage bay`);
          return { ...p, isInstalled: nextState };
        }
        return p;
      })
    );
  };

  // Update part after using workstation
  const handleUpdatePart = (updatedPart: CarPart) => {
    setParts((prev) => prev.map((p) => (p.id === updatedPart.id ? updatedPart : p)));
    showToast(`${updatedPart.name} serviced at workstation!`);
  };

  // Buying part from speed store
  const handleBuyPart = (item: StorePartItem) => {
    if (cash < item.price) return;
    setCash((prev) => prev - item.price);

    const newPart: CarPart = {
      id: `part-${Date.now()}`,
      name: item.name,
      category: item.category,
      condition: 100,
      isClean: true,
      isInstalled: false,
      isWorking: true,
      value: item.price,
      tier: item.tier,
      description: item.description,
    };

    setParts((prev) => [...prev, newPart]);
    showToast(`Purchased ${item.name} from Speed Shop!`);
  };

  // Towing beater car from junkyard
  const handleTowBeater = (beater: JunkyardBeater) => {
    if (cash < beater.price) return;
    setCash((prev) => prev - beater.price);
    // Reset to junkyard project parts
    setParts(INITIAL_CAR_PARTS);
    showToast(`Towed ${beater.name} to your garage jack stands!`);
    setIsMapOpen(false);
  };

  // Selling car to budget or elite buyer
  const handleSellCar = (buyerType: 'budget' | 'elite') => {
    const payout =
      buyerType === 'elite'
        ? Math.round(28000 + completionPercent * 240)
        : Math.round(4500 + completionPercent * 95);

    setCash((prev) => prev + payout);
    showToast(`Vehicle sold to ${buyerType === 'elite' ? 'Elite Collector' : "Rusty Pete's"} for +$${payout.toLocaleString()}!`);
    // Re-seed new project car
    setParts(INITIAL_CAR_PARTS);
    setIsMapOpen(false);
  };

  // Handle in-world open map shop trigger
  const handleOpenMapShop = (tab: 'junkyard' | 'parts_store' | 'tire_shop' | 'buyers') => {
    setMapTab(tab);
    setIsMapOpen(true);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-black flex flex-col">
      {/* TOP COMPACT HUD */}
      <header className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-none">
        {/* Back Button & Title */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            id="btn-back-to-menu"
            onClick={() => {
              soundFx.playBack();
              onBackToMenu();
            }}
            className="w-9 h-9 rounded-xl bg-black/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-lg backdrop-blur-md"
            title="Return to Main Menu"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-700/80 shadow-lg">
            <div className="text-xs font-bold uppercase font-display text-white flex items-center gap-1.5">
              <span>{garageName}</span>
              <span className="text-[10px] font-tech text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                OPEN WORLD
              </span>
            </div>
            <div className="text-[10px] text-zinc-400 font-tech">
              Bankroll: <strong className="text-emerald-400 font-display font-bold">${cash.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Action Controls: Parts Drawer & Town Map */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Open Parts & Chassis Drawer */}
          <button
            id="btn-open-parts-drawer"
            onClick={() => {
              soundFx.playClick();
              setIsPartsDrawerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-amber-500/40 hover:border-amber-400 text-xs font-display font-bold uppercase tracking-wider text-amber-400 transition-all cursor-pointer shadow-lg backdrop-blur-md"
          >
            <Wrench size={14} />
            <span>PARTS ({completionPercent}%)</span>
          </button>

          {/* Quick Town Map Button */}
          <button
            id="btn-open-town-map"
            onClick={() => {
              soundFx.playClick();
              setMapTab('junkyard');
              setIsMapOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black text-xs font-display font-black uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-amber-500/20"
          >
            <MapPin size={14} className="fill-black" />
            <span className="hidden sm:inline">TOWN MAP</span>
          </button>
        </div>
      </header>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-40 bg-black/90 border border-amber-500/60 px-4 py-2 rounded-full text-xs font-tech text-amber-300 shadow-2xl flex items-center gap-2 animate-fade-in pointer-events-none backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* FULLSCREEN 3D OPEN WORLD ENGINE (GTA V STYLE: WALK ON FOOT & DRIVE CAR) */}
      <div className="w-full h-full flex-1 relative">
        <OpenWorld3D
          parts={parts}
          cash={cash}
          onOpenStation={(station) => setActiveStation(station)}
          onOpenMapShop={handleOpenMapShop}
          garageName={garageName}
        />
      </div>

      {/* PARTS & CHASSIS MANAGEMENT MODAL / DRAWER */}
      {isPartsDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 select-none animate-fade-in">
          <div className="w-full max-w-xl bg-[#101319] border-2 border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            {/* Header */}
            <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Layers size={17} />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase font-display text-white flex items-center gap-2">
                    VEHICLE PARTS & CHASSIS
                    <span className="text-[10px] font-tech text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      {completionPercent}% RESTORED
                    </span>
                  </h2>
                  <p className="text-[10px] text-zinc-400 font-tech">
                    Install or remove parts • Walk to garage stations to service damaged components
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  soundFx.playBack();
                  setIsPartsDrawerOpen(false);
                }}
                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick Station Access inside Drawer */}
            <div className="p-3 bg-zinc-950/60 border-b border-zinc-800/80 flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-[10px] font-tech text-zinc-400 uppercase shrink-0">
                Garage Stations:
              </span>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveStation('wash');
                  setIsPartsDrawerOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-[11px] font-tech text-cyan-300 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Droplets size={12} />
                Wash Bay
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveStation('workbench');
                  setIsPartsDrawerOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-[11px] font-tech text-amber-300 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Wrench size={12} />
                Workbench
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveStation('battery');
                  setIsPartsDrawerOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-yellow-950/40 hover:bg-yellow-900/60 border border-yellow-500/30 text-[11px] font-tech text-yellow-300 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Zap size={12} />
                Battery Charger
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setActiveStation('tire_machine');
                  setIsPartsDrawerOpen(false);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-orange-950/40 hover:bg-orange-900/60 border border-orange-500/30 text-[11px] font-tech text-orange-300 flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Disc3 size={12} />
                Tire Machine
              </button>
            </div>

            {/* Parts List */}
            <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-2">
              {parts.map((part) => (
                <div
                  key={part.id}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between ${
                    part.isInstalled
                      ? 'bg-zinc-900/80 border-zinc-800'
                      : 'bg-amber-950/20 border-dashed border-amber-500/40'
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-badge uppercase px-1.5 py-0.2 rounded ${
                          part.isInstalled
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {part.isInstalled ? 'ON CHASSIS' : 'IN BAY'}
                      </span>
                      <span className="text-xs font-bold font-display uppercase text-zinc-100 truncate">
                        {part.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-tech text-zinc-400 mt-1">
                      <span>
                        Health:{' '}
                        <strong className={part.condition >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
                          {part.condition}%
                        </strong>
                      </span>
                      <span>•</span>
                      {part.needsWash ? (
                        <span className="text-cyan-400">Needs Wash</span>
                      ) : (
                        <span className="text-zinc-500">Clean</span>
                      )}
                      {part.needsCharge && (
                        <span>
                          • <strong className="text-yellow-400">Dead 0V</strong>
                        </span>
                      )}
                      {part.needsTireChange && (
                        <span>
                          • <strong className="text-orange-400">Flat Bead</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pull / Install Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleInstall(part.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition-all cursor-pointer ${
                        part.isInstalled
                          ? 'bg-zinc-800 hover:bg-red-950/60 border border-zinc-700 hover:border-red-500/40 text-zinc-300 hover:text-red-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-black shadow-md shadow-emerald-600/20'
                      }`}
                    >
                      {part.isInstalled ? 'Pull' : 'Install'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4 WORKSTATIONS INTERACTIVE MODALS */}
      <WorkstationsModal
        activeStation={activeStation}
        onClose={() => setActiveStation(null)}
        parts={parts}
        onUpdatePart={handleUpdatePart}
      />

      {/* TOWN MAP & COMMERCIAL SHOPS (JUNKYARD, SPEED SHOP, TIRE SHOP, BUYERS) */}
      <TownMapModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        cash={cash}
        onBuyPart={handleBuyPart}
        onTowBeater={handleTowBeater}
        onSellCar={handleSellCar}
        carCompletionPercent={completionPercent}
        initialTab={mapTab}
      />
    </div>
  );
};
