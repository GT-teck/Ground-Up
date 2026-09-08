import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX, Monitor, Sparkles, Sliders, RotateCcw, CheckCircle2, Zap } from 'lucide-react';
import { GameSettings, GraphicsPreset, FpsTarget } from '../types';
import { soundFx } from '../utils/audio';

interface SettingsMenuProps {
  onBack: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

const DEFAULT_SETTINGS: GameSettings = {
  masterVolume: 80,
  musicVolume: 70,
  sfxVolume: 90,
  engineVolume: 85,
  isMuted: false,
  graphicsPreset: 'high',
  targetFps: 60,
  motionBlur: true,
  bloomAndGlow: true,
  antiAliasing: 'taa',
  shadows: 'high',
};

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  onBack,
  soundEnabled,
  onToggleSound,
}) => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState<'audio' | 'graphics'>('audio');
  const [savedNotification, setSavedNotification] = useState<string | null>(null);

  const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'masterVolume') {
        soundFx.volume = (value as number) / 100;
      }
      return updated;
    });

    if (key === 'graphicsPreset' || key === 'targetFps') {
      soundFx.playToggle();
    } else {
      soundFx.playClick();
    }
  };

  const handleReset = () => {
    soundFx.playBack();
    setSettings(DEFAULT_SETTINGS);
    soundFx.volume = 0.8;
    setSavedNotification('Settings restored to factory defaults');
    setTimeout(() => setSavedNotification(null), 3000);
  };

  return (
    <div className="flex-1 flex flex-col p-5 relative overflow-hidden">
      {/* Ambient lighting */}
      <div className="absolute top-10 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800 shrink-0">
        <button
          id="btn-settings-back"
          onClick={() => {
            soundFx.playBack();
            onBack();
          }}
          className="flex items-center gap-2 text-xs font-bold font-tech uppercase text-zinc-400 hover:text-amber-400 transition-colors py-1.5 px-2.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Main Menu</span>
        </button>

        <div className="text-right">
          <div className="text-xs font-bold tracking-widest text-amber-500 uppercase font-display">
            SETTINGS
          </div>
          <div className="text-[10px] text-zinc-400 font-tech uppercase">
            Audio & Graphics Config
          </div>
        </div>
      </div>

      {/* Prototype Advisory Banner */}
      <div className="mt-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-tech flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400 shrink-0" />
          <span>Prototype Menu: Interactive controls preview the engine configurations.</span>
        </div>
        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
          Demo
        </span>
      </div>

      {savedNotification && (
        <div className="mt-2 p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={14} />
          <span>{savedNotification}</span>
        </div>
      )}

      {/* Category Tabs: Audio & Graphics */}
      <div className="grid grid-cols-2 gap-2 mt-3 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 shrink-0">
        <button
          id="tab-settings-audio"
          onClick={() => {
            soundFx.playClick();
            setActiveTab('audio');
          }}
          className={`py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'audio'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Volume2 size={15} />
          AUDIO CONTROLS
        </button>

        <button
          id="tab-settings-graphics"
          onClick={() => {
            soundFx.playClick();
            setActiveTab('graphics');
          }}
          className={`py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'graphics'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Monitor size={15} />
          GRAPHICS QUALITY
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto py-3 pr-1 space-y-4">
        {/* AUDIO TAB */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            {/* Master Mute Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300">
                  {soundEnabled ? <Volume2 size={18} className="text-amber-400" /> : <VolumeX size={18} className="text-zinc-500" />}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase font-display text-white">Audio Output</div>
                  <div className="text-[10px] text-zinc-400 font-tech">Toggle game audio synthesizer</div>
                </div>
              </div>

              <button
                id="btn-toggle-sound-settings"
                onClick={() => {
                  onToggleSound();
                  soundFx.playToggle();
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-tech uppercase transition-all cursor-pointer ${
                  soundEnabled
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-400'
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                }`}
              >
                {soundEnabled ? 'Enabled' : 'Muted'}
              </button>
            </div>

            {/* Slider 1: Master Volume */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase font-display text-zinc-200">
                  Master Volume
                </label>
                <span className="text-xs font-bold font-tech text-amber-400">
                  {settings.masterVolume}%
                </span>
              </div>
              <input
                id="slider-master-volume"
                type="range"
                min="0"
                max="100"
                value={settings.masterVolume}
                onChange={(e) => updateSetting('masterVolume', parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-tech mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Slider 2: Music Volume */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase font-display text-zinc-200">
                  Music / Soundtrack
                </label>
                <span className="text-xs font-bold font-tech text-amber-400">
                  {settings.musicVolume}%
                </span>
              </div>
              <input
                id="slider-music-volume"
                type="range"
                min="0"
                max="100"
                value={settings.musicVolume}
                onChange={(e) => updateSetting('musicVolume', parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-tech mt-1">
                <span>Mute</span>
                <span>Balanced</span>
                <span>Max</span>
              </div>
            </div>

            {/* Slider 3: Sound FX Volume */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase font-display text-zinc-200">
                  Sound Effects (SFX)
                </label>
                <span className="text-xs font-bold font-tech text-amber-400">
                  {settings.sfxVolume}%
                </span>
              </div>
              <input
                id="slider-sfx-volume"
                type="range"
                min="0"
                max="100"
                value={settings.sfxVolume}
                onChange={(e) => updateSetting('sfxVolume', parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-tech mt-1">
                <span>Low</span>
                <span>Standard</span>
                <span>High</span>
              </div>
            </div>

            {/* Slider 4: Engine / Exhaust Sound */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase font-display text-zinc-200 flex items-center gap-1.5">
                  <Zap size={13} className="text-orange-400" />
                  Engine & Exhaust Roar
                </label>
                <span className="text-xs font-bold font-tech text-orange-400">
                  {settings.engineVolume}%
                </span>
              </div>
              <input
                id="slider-engine-volume"
                type="range"
                min="0"
                max="100"
                value={settings.engineVolume}
                onChange={(e) => updateSetting('engineVolume', parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>
          </div>
        )}

        {/* GRAPHICS QUALITY TAB */}
        {activeTab === 'graphics' && (
          <div className="space-y-4">
            {/* Presets: Low, Medium, High, Ultra */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-xs font-bold uppercase font-display text-zinc-200 mb-1">
                Graphics Quality Preset
              </div>
              <div className="text-[10px] text-zinc-400 font-tech mb-3">
                Select performance profile optimized for your mobile device
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {(['low', 'medium', 'high', 'ultra'] as GraphicsPreset[]).map((preset) => {
                  const isSelected = settings.graphicsPreset === preset;
                  return (
                    <button
                      key={preset}
                      id={`btn-preset-${preset}`}
                      onClick={() => updateSetting('graphicsPreset', preset)}
                      className={`py-2 px-1 rounded-lg text-xs font-bold uppercase font-tech transition-all cursor-pointer text-center ${
                        isSelected
                          ? 'bg-amber-500 text-black shadow-md ring-1 ring-amber-400'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target FPS: 30, 60, 120 FPS */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
              <div className="text-xs font-bold uppercase font-display text-zinc-200 mb-1">
                Target Frame Rate
              </div>
              <div className="text-[10px] text-zinc-400 font-tech mb-3">
                Higher framerates provide smoother drifting at the cost of battery life
              </div>

              <div className="grid grid-cols-3 gap-2">
                {([30, 60, 120] as FpsTarget[]).map((fps) => {
                  const isSelected = settings.targetFps === fps;
                  return (
                    <button
                      key={fps}
                      id={`btn-fps-${fps}`}
                      onClick={() => updateSetting('targetFps', fps)}
                      className={`py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md font-black'
                          : 'bg-zinc-800/80 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {fps} FPS
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visual Effects Toggles */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="text-xs font-bold uppercase font-display text-zinc-200 mb-1">
                Post-Processing & Shaders
              </div>

              {/* Motion Blur */}
              <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
                <div>
                  <div className="text-xs font-bold text-zinc-300 font-tech">Motion Blur</div>
                  <div className="text-[10px] text-zinc-500 font-tech">High-speed camera warp</div>
                </div>
                <button
                  id="toggle-motion-blur"
                  onClick={() => updateSetting('motionBlur', !settings.motionBlur)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.motionBlur ? 'bg-amber-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      settings.motionBlur ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Bloom & Glow */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <div>
                  <div className="text-xs font-bold text-zinc-300 font-tech">Bloom & Neon Glow</div>
                  <div className="text-[10px] text-zinc-500 font-tech">Headlight and brake disc glow</div>
                </div>
                <button
                  id="toggle-bloom"
                  onClick={() => updateSetting('bloomAndGlow', !settings.bloomAndGlow)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                    settings.bloomAndGlow ? 'bg-amber-500' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-black transition-transform ${
                      settings.bloomAndGlow ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Dynamic Shadows */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                <div>
                  <div className="text-xs font-bold text-zinc-300 font-tech">Shadow Detail</div>
                  <div className="text-[10px] text-zinc-500 font-tech">Garage lighting resolution</div>
                </div>
                <div className="flex gap-1">
                  {(['off', 'low', 'high'] as const).map((sh) => (
                    <button
                      key={sh}
                      id={`btn-shadow-${sh}`}
                      onClick={() => updateSetting('shadows', sh)}
                      className={`text-[10px] uppercase font-tech font-bold px-2 py-1 rounded transition-colors cursor-pointer ${
                        settings.shadows === sh
                          ? 'bg-amber-500 text-black'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {sh}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between shrink-0">
        <button
          id="btn-settings-reset"
          onClick={handleReset}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 font-tech uppercase py-2 px-3 rounded-lg bg-zinc-900 border border-zinc-800 cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Reset Defaults</span>
        </button>

        <span className="text-[11px] text-amber-500/80 font-tech">
          Changes Saved Automatically
        </span>
      </div>
    </div>
  );
};
