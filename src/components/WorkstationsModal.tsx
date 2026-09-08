import React, { useState, useEffect } from 'react';
import { X, Droplets, Wrench, Zap, Disc3, CheckCircle2, RotateCw, Gauge, Sparkles, ArrowRight } from 'lucide-react';
import { CarPart, WorkstationType } from '../types';
import { soundFx } from '../utils/audio';

interface WorkstationsModalProps {
  stationType: WorkstationType | null;
  onClose: () => void;
  parts: CarPart[];
  onUpdatePart: (updatedPart: CarPart) => void;
  cash: number;
  onAddCash: (amount: number) => void;
}

export const WorkstationsModal: React.FC<WorkstationsModalProps> = ({
  stationType,
  onClose,
  parts,
  onUpdatePart,
  cash,
}) => {
  if (!stationType) return null;

  // Selected part for current station
  const eligibleParts = parts.filter((p) => {
    if (stationType === 'wash') return p.needsWash || !p.isClean;
    if (stationType === 'workbench') return p.needsRepair || p.condition < 100;
    if (stationType === 'battery') return p.category === 'battery';
    if (stationType === 'tire_machine') return p.category === 'wheel';
    return true;
  });

  const [selectedPartId, setSelectedPartId] = useState<string>(
    eligibleParts[0]?.id || parts[0]?.id || ''
  );

  const activePart = parts.find((p) => p.id === selectedPartId);

  // Station specific minigame states
  // 1. Wash Station
  const [washProgress, setWashProgress] = useState<number>(activePart?.isClean ? 100 : 0);
  const [isWashing, setIsWashing] = useState<boolean>(false);

  // 2. Workbench Repair
  const [repairProgress, setRepairProgress] = useState<number>(activePart?.condition || 25);
  const [isRepairing, setIsRepairing] = useState<boolean>(false);

  // 3. Battery Charger
  const [clampsConnected, setClampsConnected] = useState<boolean>(false);
  const [batteryVoltage, setBatteryVoltage] = useState<number>(activePart?.chargeVoltage || 1.4);
  const [isCharging, setIsCharging] = useState<boolean>(false);

  // 4. Tire Machine
  const [tireStep, setTireStep] = useState<'bead_break' | 'turntable' | 'inflate' | 'complete'>('bead_break');
  const [tirePsi, setTirePsi] = useState<number>(0);

  // Update states when switching active part
  useEffect(() => {
    if (activePart) {
      setWashProgress(activePart.isClean ? 100 : 15);
      setRepairProgress(activePart.condition);
      setBatteryVoltage(activePart.chargeVoltage || 1.4);
      if (activePart.needsTireChange) {
        setTireStep('bead_break');
        setTirePsi(0);
      } else {
        setTireStep('complete');
        setTirePsi(32);
      }
    }
  }, [selectedPartId]);

  // WASH STATION LOGIC
  const handleTriggerWash = () => {
    if (!activePart || washProgress >= 100) return;
    setIsWashing(true);
    soundFx.playPressureWash();

    const next = Math.min(100, washProgress + 25);
    setWashProgress(next);

    if (next >= 100) {
      soundFx.playCashChime();
      onUpdatePart({
        ...activePart,
        isClean: true,
        needsWash: false,
        condition: Math.min(100, activePart.condition + 15),
      });
    }

    setTimeout(() => setIsWashing(false), 260);
  };

  // WORKBENCH REPAIR LOGIC
  const handleTriggerRepair = () => {
    if (!activePart || repairProgress >= 100) return;
    setIsRepairing(true);
    soundFx.playImpactWrench();

    const next = Math.min(100, repairProgress + 20);
    setRepairProgress(next);

    if (next >= 100) {
      soundFx.playCashChime();
      onUpdatePart({
        ...activePart,
        condition: 100,
        needsRepair: false,
        isWorking: true,
      });
    }

    setTimeout(() => setIsRepairing(false), 240);
  };

  // BATTERY CHARGER LOGIC
  const handleToggleClamps = () => {
    soundFx.playBatterySpark();
    const nextClamps = !clampsConnected;
    setClampsConnected(nextClamps);

    if (nextClamps && batteryVoltage < 12.6) {
      setIsCharging(true);
      const interval = setInterval(() => {
        setBatteryVoltage((prev) => {
          if (prev >= 12.6) {
            clearInterval(interval);
            setIsCharging(false);
            soundFx.playCashChime();
            if (activePart) {
              onUpdatePart({
                ...activePart,
                chargeVoltage: 12.6,
                condition: 100,
                needsCharge: false,
                isWorking: true,
              });
            }
            return 12.6;
          }
          return parseFloat((prev + 1.6).toFixed(1));
        });
      }, 350);
    }
  };

  // TIRE MACHINE LOGIC
  const handleTireMachineAction = () => {
    soundFx.playTireMachine();

    if (tireStep === 'bead_break') {
      setTireStep('turntable');
    } else if (tireStep === 'turntable') {
      setTireStep('inflate');
    } else if (tireStep === 'inflate') {
      setTirePsi(32);
      setTireStep('complete');
      soundFx.playCashChime();
      if (activePart) {
        onUpdatePart({
          ...activePart,
          condition: 100,
          needsTireChange: false,
          tireTread: 100,
          isWorking: true,
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 select-none animate-fade-in">
      <div className="w-full max-w-xl bg-[#12151b] border-2 border-zinc-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              {stationType === 'wash' && <Droplets size={18} className="text-cyan-400" />}
              {stationType === 'workbench' && <Wrench size={18} className="text-amber-400" />}
              {stationType === 'battery' && <Zap size={18} className="text-yellow-400" />}
              {stationType === 'tire_machine' && <Disc3 size={18} className="text-orange-400" />}
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase font-display text-white">
                {stationType === 'wash' && 'PARTS WASHING BAY'}
                {stationType === 'workbench' && 'REPAIR & FABRICATION BENCH'}
                {stationType === 'battery' && 'HIGH-AMP BATTERY CHARGER'}
                {stationType === 'tire_machine' && 'PNEUMATIC TIRE MACHINE'}
              </h2>
              <p className="text-[10px] text-zinc-400 font-tech">
                {stationType === 'wash' && 'Pressure wash grease, barn dust, and clogged mud off components'}
                {stationType === 'workbench' && 'Resurface, unseize, and rebuild worn parts to 100% condition'}
                {stationType === 'battery' && 'Clamp heavy-duty terminals and charge dead cells to 12.6V'}
                {stationType === 'tire_machine' && 'Break bead, spin rim, and mount fresh high-performance rubber'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundFx.playBack();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Part Selection Bar */}
          <div>
            <span className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
              Select Component for this Station ({eligibleParts.length} available)
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
              {eligibleParts.map((part) => {
                const isSelected = part.id === selectedPartId;
                return (
                  <button
                    key={part.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedPartId(part.id);
                    }}
                    className={`px-3 py-2 rounded-xl border text-left shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-950/30 text-amber-200'
                        : 'border-zinc-800 bg-zinc-900/70 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-bold font-display uppercase truncate max-w-[140px]">
                      {part.name}
                    </div>
                    <div className="text-[10px] font-tech text-zinc-400 flex items-center gap-2 mt-0.5">
                      <span>Condition: {part.condition}%</span>
                      {part.needsWash && <span className="text-cyan-400">Dirty</span>}
                      {part.needsRepair && <span className="text-amber-400">Needs Fix</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Part Card */}
          {activePart && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-tech uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  {activePart.category.toUpperCase()}
                </span>
                <h3 className="text-base font-bold font-display text-white mt-1">
                  {activePart.name}
                </h3>
                <p className="text-[11px] text-zinc-400 font-tech mt-0.5">{activePart.description}</p>
              </div>

              <div className="text-right shrink-0">
                <div className="text-[10px] text-zinc-500 uppercase font-tech">Value</div>
                <div className="text-sm font-bold text-emerald-400 font-display">
                  ${activePart.value}
                </div>
              </div>
            </div>
          )}

          {/* STATION INTERACTIVE MINIGAMES */}

          {/* 1. WASH STATION VIEW */}
          {stationType === 'wash' && (
            <div className="bg-[#0b0e14] border border-cyan-900/40 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {isWashing && (
                <div className="absolute inset-0 bg-cyan-500/10 animate-pulse pointer-events-none" />
              )}

              <div className="relative mb-4">
                <div
                  className={`w-32 h-32 rounded-2xl flex items-center justify-center border-4 transition-all duration-300 ${
                    washProgress >= 100
                      ? 'bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : 'bg-gradient-to-br from-stone-900 to-amber-950 border-amber-800'
                  }`}
                >
                  <Droplets
                    size={48}
                    className={`transition-all duration-300 ${
                      washProgress >= 100 ? 'text-cyan-300 scale-110' : 'text-amber-700'
                    }`}
                  />
                </div>

                {washProgress >= 100 && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-black p-1 rounded-full shadow-md">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>

              <div className="w-full max-w-xs mb-4">
                <div className="flex justify-between text-[11px] font-tech text-zinc-400 mb-1">
                  <span>CLEANING STATUS</span>
                  <span className={washProgress >= 100 ? 'text-emerald-400 font-bold' : 'text-cyan-400 font-bold'}>
                    {washProgress}% {washProgress >= 100 ? 'MINT CLEAN' : 'MUD & GREASE'}
                  </span>
                </div>
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${washProgress}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleTriggerWash}
                disabled={washProgress >= 100}
                className={`px-6 py-3 rounded-xl font-bold font-display uppercase tracking-wider text-sm flex items-center gap-2 cursor-pointer transition-all ${
                  washProgress >= 100
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white shadow-lg shadow-cyan-500/25'
                }`}
              >
                <Droplets size={16} />
                {washProgress >= 100 ? 'PART FULLY WASHED' : 'BLAST PRESSURE WASHER'}
              </button>
            </div>
          )}

          {/* 2. REPAIR WORKBENCH VIEW */}
          {stationType === 'workbench' && (
            <div className="bg-[#0b0e14] border border-amber-900/40 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {isRepairing && (
                <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none" />
              )}

              <div className="relative mb-4">
                <div
                  className={`w-32 h-32 rounded-2xl flex items-center justify-center border-4 transition-all duration-300 ${
                    repairProgress >= 100
                      ? 'bg-gradient-to-br from-amber-600/30 to-orange-600/30 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                      : 'bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-700'
                  }`}
                >
                  <Wrench
                    size={48}
                    className={`transition-all duration-300 ${
                      repairProgress >= 100 ? 'text-amber-300 scale-110' : 'text-zinc-500'
                    }`}
                  />
                </div>

                {repairProgress >= 100 && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-black p-1 rounded-full shadow-md">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>

              <div className="w-full max-w-xs mb-4">
                <div className="flex justify-between text-[11px] font-tech text-zinc-400 mb-1">
                  <span>PART DURABILITY / CONDITION</span>
                  <span className={repairProgress >= 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {repairProgress}% {repairProgress >= 100 ? 'RESTORED' : 'WORN / SEIZED'}
                  </span>
                </div>
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${repairProgress}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleTriggerRepair}
                disabled={repairProgress >= 100}
                className={`px-6 py-3 rounded-xl font-bold font-display uppercase tracking-wider text-sm flex items-center gap-2 cursor-pointer transition-all ${
                  repairProgress >= 100
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 active:scale-95 text-black shadow-lg shadow-amber-500/25'
                }`}
              >
                <Wrench size={16} />
                {repairProgress >= 100 ? '100% FACTORY REBUILT' : 'TORQUE & RESURFACE'}
              </button>
            </div>
          )}

          {/* 3. BATTERY CHARGER VIEW */}
          {stationType === 'battery' && (
            <div className="bg-[#0b0e14] border border-yellow-900/40 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
              {/* Analog Voltage Dial */}
              <div className="w-40 h-28 bg-zinc-950 border-2 border-zinc-800 rounded-t-full p-4 flex flex-col items-center justify-end relative shadow-inner mb-3">
                <div className="text-2xl font-black font-display text-yellow-400">
                  {batteryVoltage.toFixed(1)} <span className="text-sm">VOLTS</span>
                </div>
                <div className="text-[10px] font-tech text-zinc-500 uppercase">
                  Target: 12.6V Heavy Crank
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-xs font-tech text-zinc-300">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      clampsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                    }`}
                  />
                  <span>{clampsConnected ? 'CLAMPS ON (RED+/BLK-)' : 'CLAMPS DETACHED'}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-tech text-zinc-300">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      batteryVoltage >= 12.6 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-700'
                    }`}
                  />
                  <span>{batteryVoltage >= 12.6 ? 'FULL CHARGE' : 'CHARGING'}</span>
                </div>
              </div>

              <button
                onClick={handleToggleClamps}
                className={`px-6 py-3 rounded-xl font-bold font-display uppercase tracking-wider text-sm flex items-center gap-2 cursor-pointer transition-all ${
                  clampsConnected
                    ? batteryVoltage >= 12.6
                      ? 'bg-emerald-600 text-black cursor-default'
                      : 'bg-yellow-500 text-black animate-pulse'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-yellow-500/40'
                }`}
              >
                <Zap size={16} />
                {batteryVoltage >= 12.6
                  ? 'BATTERY FULLY CHARGED (12.6V)'
                  : clampsConnected
                  ? 'CHARGING CELLS...'
                  : 'ATTACH CHARGER CLAMPS'}
              </button>
            </div>
          )}

          {/* 4. TIRE MACHINE VIEW */}
          {stationType === 'tire_machine' && (
            <div className="bg-[#0b0e14] border border-orange-900/40 rounded-xl p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="relative mb-3">
                <div className="w-32 h-32 rounded-full border-8 border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-2xl">
                  <Disc3
                    size={64}
                    className={`text-amber-500 ${
                      tireStep === 'turntable' ? 'animate-spin' : ''
                    }`}
                  />
                </div>

                {tireStep === 'complete' && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-black p-1 rounded-full shadow-md">
                    <CheckCircle2 size={16} />
                  </div>
                )}
              </div>

              {/* Step instructions */}
              <div className="text-xs font-bold font-display text-white uppercase mb-1">
                {tireStep === 'bead_break' && 'Step 1: Press Pneumatic Bead Breaker'}
                {tireStep === 'turntable' && 'Step 2: Spin Turntable to Demount Worn Rubber'}
                {tireStep === 'inflate' && 'Step 3: Mount Fresh Compound & Inflate to 32 PSI'}
                {tireStep === 'complete' && 'Step 4: Wheel Mounted & Balanced!'}
              </div>

              <div className="text-[11px] font-tech text-zinc-400 mb-4">
                Tire Pressure: <strong className="text-amber-400">{tirePsi} PSI</strong> • Compound: Racing Slick
              </div>

              <button
                onClick={handleTireMachineAction}
                disabled={tireStep === 'complete'}
                className={`px-6 py-3 rounded-xl font-bold font-display uppercase tracking-wider text-sm flex items-center gap-2 cursor-pointer transition-all ${
                  tireStep === 'complete'
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 active:scale-95 text-black shadow-lg shadow-orange-500/25'
                }`}
              >
                <Disc3 size={16} />
                {tireStep === 'bead_break' && '1. BREAK BEAD'}
                {tireStep === 'turntable' && '2. SPIN TURNTABLE'}
                {tireStep === 'inflate' && '3. INFLATE TO 32 PSI'}
                {tireStep === 'complete' && 'TIRE READY FOR INSTALL'}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-zinc-900 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400 font-tech shrink-0">
          <span>TIPS: Repaired parts increase your car restoration % and vehicle resale value!</span>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
