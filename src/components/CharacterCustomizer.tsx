import React, { useState } from 'react';
import {
  Sparkles,
  Dices,
  User,
  Scissors,
  Glasses,
  Shirt,
  Shield,
  Check,
} from 'lucide-react';
import {
  CharacterCustomization,
  CharacterGender,
  CharacterRace,
  CharacterBodyType,
  CharacterHairstyle,
  CharacterHairColor,
  CharacterAccessory,
  CharacterFacialHair,
  CharacterClothing,
} from '../types';
import { SKIN_TONES, HAIR_COLORS } from '../utils/characterModel';
import { CharacterPreviewCanvas } from './CharacterPreviewCanvas';
import { soundFx } from '../utils/audio';

interface CharacterCustomizerProps {
  character: CharacterCustomization;
  onChange: (updated: CharacterCustomization) => void;
}

type CustomizerTab = 'identity' | 'hair' | 'accessories' | 'wardrobe';

const GENDER_OPTIONS: { id: CharacterGender; label: string; desc: string }[] = [
  { id: 'male', label: 'Male', desc: 'Broader frame & facial hair options' },
  { id: 'female', label: 'Female', desc: 'Feminine silhouette & tailored build' },
  { id: 'unisex', label: 'Unisex', desc: 'Balanced neutral athletic form' },
];

const BODY_TYPE_OPTIONS: { id: CharacterBodyType; label: string; desc: string }[] = [
  { id: 'athletic', label: 'Athletic', desc: 'Balanced, toned agility' },
  { id: 'muscular', label: 'Muscular', desc: 'Heavy lifter & broad shoulders' },
  { id: 'slim', label: 'Slim', desc: 'Lean & nimble racer profile' },
  { id: 'heavy', label: 'Heavy', desc: 'Sturdy, broad powerhouse' },
];

const HAIRSTYLE_OPTIONS: { id: CharacterHairstyle; label: string }[] = [
  { id: 'quiff', label: 'High Quiff / Pompadour' },
  { id: 'side_part', label: 'Classic Side Part' },
  { id: 'curly_fade', label: 'Curly Taper Fade' },
  { id: 'ponytail', label: 'Ponytail / Braid' },
  { id: 'wavy_long', label: 'Wavy Medium Locks' },
  { id: 'buzz', label: 'Military Buzz Cut' },
  { id: 'bald', label: 'Clean Shaved Scalp' },
];

const ACCESSORY_OPTIONS: { id: CharacterAccessory; label: string; desc: string }[] = [
  { id: 'mechanic_cap', label: 'Mechanic Snapback', desc: 'Reversed tuner cap' },
  { id: 'safety_goggles', label: 'Workshop Goggles', desc: 'Protective eye shield' },
  { id: 'racing_shades', label: 'Black Racing Shades', desc: 'Polarized wayfarer glasses' },
  { id: 'aviator_glasses', label: 'Aviator Frames', desc: 'Classic gold wireframe' },
  { id: 'bandana', label: 'Skull Bandana', desc: 'Street tuner head wrap' },
  { id: 'tool_belt', label: 'Utility Holster Belt', desc: 'Leather pouch & wrench' },
  { id: 'mechanic_gloves', label: 'Padded Work Gloves', desc: 'Reinforced grip gloves' },
  { id: 'none', label: 'None', desc: 'Clean, unaccessorized look' },
];

const FACIAL_HAIR_OPTIONS: { id: CharacterFacialHair; label: string }[] = [
  { id: 'clean', label: 'Clean Shaven' },
  { id: 'stubble', label: '5 O’clock Stubble' },
  { id: 'beard', label: 'Full Groomed Beard' },
  { id: 'goatee', label: 'Chin Goatee' },
  { id: 'mustache', label: 'Tuner Mustache' },
];

const CLOTHING_OPTIONS: { id: CharacterClothing; label: string; desc: string }[] = [
  { id: 'mechanic_overalls', label: 'Mechanic Overalls', desc: 'Heavy-duty shop bib & straps' },
  { id: 'leather_jacket', label: 'Biker Leather Jacket', desc: 'Zip-up moto leather' },
  { id: 'racing_hoodie', label: 'Paddock Racing Hoodie', desc: 'Comfortable cotton fleece' },
  { id: 'tuner_tshirt', label: 'Street Tuner Crewneck', desc: 'Casual workshop tee' },
];

const COLOR_SWATCHES = [
  '#0284c7', // Sky blue
  '#dc2626', // Crimson red
  '#16a34a', // Emerald green
  '#d97706', // Amber gold
  '#9333ea', // Violet purple
  '#ea580c', // Bright orange
  '#27272a', // Stealth black
  '#f8fafc', // Clean white
];

const PANTS_SWATCHES = [
  '#1e293b', // Dark Slate
  '#0f172a', // Midnight Black
  '#1c1917', // Raw Charcoal
  '#1e3a8a', // Deep Indigo Denim
  '#365314', // Olive Drab
  '#78350f', // Work Khaki
];

const RANDOM_NAMES = [
  'Alex Rivera',
  'Marcus Vance',
  'Elena Rostova',
  'Kai Tanaka',
  'Jaxson Cole',
  'Maya Sterling',
  'Leo Martinez',
  'Chloe Dubois',
];

export const CharacterCustomizer: React.FC<CharacterCustomizerProps> = ({
  character,
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<CustomizerTab>('identity');

  const update = <K extends keyof CharacterCustomization>(
    key: K,
    val: CharacterCustomization[K]
  ) => {
    soundFx.playClick();
    onChange({ ...character, [key]: val });
  };

  const handleRandomize = () => {
    soundFx.playSelect();
    const randomGender: CharacterGender = ['male', 'female', 'unisex'][
      Math.floor(Math.random() * 3)
    ] as CharacterGender;
    const races = Object.keys(SKIN_TONES) as CharacterRace[];
    const hairStyles: CharacterHairstyle[] = [
      'buzz',
      'side_part',
      'quiff',
      'ponytail',
      'curly_fade',
      'wavy_long',
    ];
    const hairColors = Object.keys(HAIR_COLORS) as CharacterHairColor[];
    const accessories: CharacterAccessory[] = [
      'mechanic_cap',
      'safety_goggles',
      'racing_shades',
      'aviator_glasses',
      'bandana',
      'tool_belt',
      'mechanic_gloves',
      'none',
    ];
    const clothings: CharacterClothing[] = [
      'mechanic_overalls',
      'leather_jacket',
      'racing_hoodie',
      'tuner_tshirt',
    ];

    const newChar: CharacterCustomization = {
      name: RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)],
      gender: randomGender,
      race: races[Math.floor(Math.random() * races.length)],
      bodyType: ['athletic', 'muscular', 'slim', 'heavy'][
        Math.floor(Math.random() * 4)
      ] as CharacterBodyType,
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      facialHair:
        randomGender === 'female'
          ? 'clean'
          : ['clean', 'stubble', 'beard', 'goatee', 'mustache'][
              Math.floor(Math.random() * 5)
            ] as CharacterFacialHair,
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      clothing: clothings[Math.floor(Math.random() * clothings.length)],
      clothingColor: COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)],
      pantsColor: PANTS_SWATCHES[Math.floor(Math.random() * PANTS_SWATCHES.length)],
    };

    onChange(newChar);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top 3D Character Stage & Header */}
      <div className="relative w-full h-56 sm:h-64 bg-gradient-to-b from-zinc-950 via-[#0d1117] to-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shrink-0 shadow-xl mb-3">
        {/* Interactive 3D Canvas */}
        <CharacterPreviewCanvas character={character} className="w-full h-full" />

        {/* Quick character name badge */}
        <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-700/80 shadow-md">
          <div className="text-[10px] uppercase font-tech text-amber-400 tracking-wider">
            TUNER PROFILE
          </div>
          <div className="text-xs font-bold uppercase font-display text-white">
            {character.name || 'Unnamed Driver'}
          </div>
        </div>

        {/* Randomize Dice Action */}
        <button
          id="btn-randomize-character"
          onClick={handleRandomize}
          className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-amber-500/20 border border-zinc-700 hover:border-amber-500/60 text-zinc-300 hover:text-amber-300 text-xs font-tech uppercase transition-all cursor-pointer shadow-lg backdrop-blur-md"
          title="Roll random appearance"
        >
          <Dices size={14} className="text-amber-400" />
          <span>Randomize</span>
        </button>

        {/* Floating Quick Summary Pills */}
        <div className="absolute bottom-2 right-2 z-10 hidden sm:flex items-center gap-1.5">
          <span className="text-[9px] font-tech uppercase bg-black/60 px-2 py-0.5 rounded-full border border-zinc-800 text-zinc-300">
            {character.gender}
          </span>
          <span className="text-[9px] font-tech uppercase bg-black/60 px-2 py-0.5 rounded-full border border-zinc-800 text-zinc-300">
            {character.bodyType}
          </span>
          <span className="text-[9px] font-tech uppercase bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-400">
            {SKIN_TONES[character.race]?.name}
          </span>
        </div>
      </div>

      {/* Customizer Sub-Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 mb-3 shrink-0">
        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('identity');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'identity'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <User size={13} />
          <span>Identity</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('hair');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'hair'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Scissors size={13} />
          <span>Hair</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('accessories');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'accessories'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Glasses size={13} />
          <span>Gear</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setActiveTab('wardrobe');
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'wardrobe'
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
          }`}
        >
          <Shirt size={13} />
          <span>Attire</span>
        </button>
      </div>

      {/* Tab Panels Content */}
      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 text-xs font-tech">
        {/* ================= IDENTITY TAB ================= */}
        {activeTab === 'identity' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Driver Name */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Driver / Mechanic Call Sign
              </label>
              <input
                id="input-character-name"
                type="text"
                value={character.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Enter character name..."
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-white font-display font-semibold outline-none"
              />
            </div>

            {/* Gender Selection */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Gender & Form
              </label>
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((opt) => {
                  const isSelected = character.gender === opt.id;
                  return (
                    <button
                      key={opt.id}
                      id={`btn-gender-${opt.id}`}
                      onClick={() => update('gender', opt.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-display font-bold uppercase text-xs text-white">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight line-clamp-2">
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Race / Skin Tone */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Race & Complexion (Tone: {SKIN_TONES[character.race]?.name})
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(SKIN_TONES) as CharacterRace[]).map((raceKey) => {
                  const tone = SKIN_TONES[raceKey];
                  const isSelected = character.race === raceKey;
                  return (
                    <button
                      key={raceKey}
                      id={`btn-race-${raceKey}`}
                      onClick={() => update('race', raceKey)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-md'
                          : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                      }`}
                      title={tone.name}
                    >
                      <span
                        className="w-7 h-7 rounded-full shadow-inner border border-white/20"
                        style={{ backgroundColor: tone.css }}
                      />
                      <span className="text-[10px] text-zinc-300 font-tech uppercase text-center truncate w-full">
                        {tone.name.split('/')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body Type Selection */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Body Build & Stature
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BODY_TYPE_OPTIONS.map((b) => {
                  const isSelected = character.bodyType === b.id;
                  return (
                    <button
                      key={b.id}
                      id={`btn-body-${b.id}`}
                      onClick={() => update('bodyType', b.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-display font-bold uppercase text-xs text-white">
                        {b.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{b.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= HAIR TAB ================= */}
        {activeTab === 'hair' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Hair Style */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Hairstyle & Cut
              </label>
              <div className="grid grid-cols-2 gap-2">
                {HAIRSTYLE_OPTIONS.map((h) => {
                  const isSelected = character.hairStyle === h.id;
                  return (
                    <button
                      key={h.id}
                      id={`btn-hair-${h.id}`}
                      onClick={() => update('hairStyle', h.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span className="font-display font-bold uppercase text-xs text-white truncate">
                        {h.label}
                      </span>
                      {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hair Color */}
            {character.hairStyle !== 'bald' && (
              <div>
                <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                  Hair Color Shade ({HAIR_COLORS[character.hairColor]?.name})
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {(Object.keys(HAIR_COLORS) as CharacterHairColor[]).map((hcKey) => {
                    const hc = HAIR_COLORS[hcKey];
                    const isSelected = character.hairColor === hcKey;
                    return (
                      <button
                        key={hcKey}
                        id={`btn-haircolor-${hcKey}`}
                        onClick={() => update('hairColor', hcKey)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 shadow-md'
                            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                        }`}
                        title={hc.name}
                      >
                        <span
                          className="w-6 h-6 rounded-full shadow-inner border border-white/20"
                          style={{ backgroundColor: hc.css }}
                        />
                        <span className="text-[9px] text-zinc-300 font-tech uppercase truncate w-full text-center">
                          {hc.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Facial Hair (for Male or Unisex) */}
            {character.gender !== 'female' && (
              <div>
                <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                  Facial Hair & Grooming
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FACIAL_HAIR_OPTIONS.map((f) => {
                    const isSelected = character.facialHair === f.id;
                    return (
                      <button
                        key={f.id}
                        id={`btn-facial-${f.id}`}
                        onClick={() => update('facialHair', f.id)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                            : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="font-display font-semibold uppercase text-[11px] text-zinc-200">
                          {f.label}
                        </span>
                        {isSelected && <Check size={12} className="text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= ACCESSORIES TAB ================= */}
        {activeTab === 'accessories' && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <label className="text-[11px] uppercase font-tech text-zinc-400 block">
              Driver Accessories & Tuner Gear
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACCESSORY_OPTIONS.map((acc) => {
                const isSelected = character.accessory === acc.id;
                return (
                  <button
                    key={acc.id}
                    id={`btn-acc-${acc.id}`}
                    onClick={() => update('accessory', acc.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start justify-between ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                        : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div>
                      <div className="font-display font-bold uppercase text-xs text-white">
                        {acc.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{acc.desc}</div>
                    </div>
                    {isSelected && <Check size={16} className="text-amber-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= WARDROBE TAB ================= */}
        {activeTab === 'wardrobe' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Clothing Outfit */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Workshop Outfit Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CLOTHING_OPTIONS.map((c) => {
                  const isSelected = character.clothing === c.id;
                  return (
                    <button
                      key={c.id}
                      id={`btn-clothing-${c.id}`}
                      onClick={() => update('clothing', c.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300 shadow-md shadow-amber-500/10'
                          : 'bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="font-display font-bold uppercase text-xs text-white">
                        {c.label}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Outfit Primary Color */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Top / Outerwear Color Palette
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_SWATCHES.map((swatch) => {
                  const isSelected = character.clothingColor.toLowerCase() === swatch.toLowerCase();
                  return (
                    <button
                      key={swatch}
                      onClick={() => update('clothingColor', swatch)}
                      className={`w-8 h-8 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'border-white scale-110 shadow-lg shadow-white/20'
                          : 'border-zinc-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch }}
                    >
                      {isSelected && <Check size={14} className="text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pants / Trouser Color */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Work Pants & Denim Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {PANTS_SWATCHES.map((swatch) => {
                  const isSelected = character.pantsColor.toLowerCase() === swatch.toLowerCase();
                  return (
                    <button
                      key={swatch}
                      onClick={() => update('pantsColor', swatch)}
                      className={`w-8 h-8 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'border-white scale-110 shadow-lg shadow-white/20'
                          : 'border-zinc-700 hover:scale-105'
                      }`}
                      style={{ backgroundColor: swatch }}
                    >
                      {isSelected && <Check size={14} className="text-white drop-shadow" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
