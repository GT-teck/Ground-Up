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
  Eye,
  Flame,
  Palette,
} from 'lucide-react';
import {
  CharacterCustomization,
  CharacterGender,
  CharacterRace,
  CharacterBodyType,
  CharacterHairstyle,
  CharacterHairColor,
  CharacterEyeColor,
  CharacterSkinDetail,
  CharacterAccessory,
  CharacterFacialHair,
  CharacterClothing,
} from '../types';
import { SKIN_TONES, HAIR_COLORS, EYE_COLORS } from '../utils/characterModel';
import { CharacterPreviewCanvas } from './CharacterPreviewCanvas';
import { soundFx } from '../utils/audio';

interface CharacterCustomizerProps {
  character: CharacterCustomization;
  onChange: (updated: CharacterCustomization) => void;
}

type CustomizerTab = 'identity' | 'hair' | 'accessories' | 'wardrobe';

const GENDER_OPTIONS: { id: CharacterGender; label: string; desc: string }[] = [
  { id: 'male', label: 'Male', desc: 'Broader frame, athletic build & facial hair options' },
  { id: 'female', label: 'Female', desc: 'Feminine silhouette, tailored waist & curated styling' },
  { id: 'unisex', label: 'Unisex', desc: 'Neutral, agile athletic driver profile' },
];

const BODY_TYPE_OPTIONS: { id: CharacterBodyType; label: string; desc: string }[] = [
  { id: 'athletic', label: 'Athletic', desc: 'Balanced, toned motorsport agility' },
  { id: 'muscular', label: 'Muscular', desc: 'Heavy lifter & broad deltoid shoulders' },
  { id: 'slim', label: 'Slim', desc: 'Lean & nimble street racer profile' },
  { id: 'heavy', label: 'Heavy', desc: 'Sturdy, broad workshop powerhouse' },
];

const SKIN_DETAIL_OPTIONS: { id: CharacterSkinDetail; label: string; desc: string }[] = [
  { id: 'clean', label: 'Clean Skin', desc: 'Pristine, fresh complexion' },
  { id: 'grease_smudge', label: 'Mechanic Grease', desc: 'Authentic shop soot & grease smear' },
  { id: 'tattoos', label: 'Tuner Ink Sleeve', desc: 'Mechanical tribal sleeve tattoos' },
  { id: 'freckles', label: 'Subtle Freckles', desc: 'Natural sun-kissed facial freckles' },
];

const HAIRSTYLE_OPTIONS: { id: CharacterHairstyle; label: string; category: string }[] = [
  { id: 'quiff', label: 'High Quiff / Pompadour', category: 'Modern' },
  { id: 'side_part', label: 'Barber Razor Side Part', category: 'Classic' },
  { id: 'curly_fade', label: 'Curly Sponge Fade', category: 'Textured' },
  { id: 'dreadlocks', label: 'Twisted Dreadlocks & Cuffs', category: 'Textured' },
  { id: 'undercut', label: 'Swept Tuner Undercut', category: 'Street' },
  { id: 'ponytail', label: 'High Ponytail / Topknot', category: 'Long' },
  { id: 'wavy_long', label: 'Wavy Layered Locks', category: 'Long' },
  { id: 'bob_cut', label: 'Asymmetric Bob Cut', category: 'Short' },
  { id: 'afro_taper', label: 'Volumetric Afro Taper', category: 'Textured' },
  { id: 'buzz', label: 'Military Buzz Fade', category: 'Short' },
  { id: 'bald', label: 'Clean Shaved Scalp', category: 'Short' },
];

const ACCESSORY_OPTIONS: { id: CharacterAccessory; label: string; desc: string }[] = [
  { id: 'mechanic_cap', label: 'Tuner Snapback', desc: 'Reversed tuner cap with embroidered logo' },
  { id: 'safety_goggles', label: 'Workshop Safety Goggles', desc: 'Polycarbonate eye protection with amber tint' },
  { id: 'racing_shades', label: 'Polarized Racing Shades', desc: 'Aerodynamic sport wrap-around sunglasses' },
  { id: 'aviator_glasses', label: 'Gold Wireframe Aviators', desc: 'Classic double-bridge tinted aviators' },
  { id: 'headphones', label: 'Over-Ear Tuner Cans', desc: 'Padded noise-canceling headphones around neck' },
  { id: 'chain_necklace', label: 'Cuban Link Chain', desc: 'Titanium polished curb chain necklace' },
  { id: 'face_mask', label: 'Neoprene Filter Mask', desc: 'Workshop dust & paint spray respirator' },
  { id: 'bandana', label: 'Skull Bandana Headband', desc: 'Street tuner knotted headband' },
  { id: 'tool_belt', label: 'Heavy Duty Tool Holster', desc: 'Saddle leather pouch & chrome wrench' },
  { id: 'mechanic_gloves', label: 'Armored Mechanic Gloves', desc: 'Reinforced impact knuckle work gloves' },
  { id: 'none', label: 'No Accessory', desc: 'Clean, unembellished driver look' },
];

const FACIAL_HAIR_OPTIONS: { id: CharacterFacialHair; label: string }[] = [
  { id: 'clean', label: 'Clean Shaven' },
  { id: 'stubble', label: '5 O’Clock Stubble' },
  { id: 'beard', label: 'Full Sculpted Beard' },
  { id: 'goatee', label: 'Chiseled Goatee' },
  { id: 'mustache', label: 'Tuner Chevron Stache' },
  { id: 'horseshoe', label: 'Vintage Horseshoe Stache' },
  { id: 'van_dyke', label: 'Sharp Van Dyke' },
];

const CLOTHING_OPTIONS: { id: CharacterClothing; label: string; desc: string }[] = [
  { id: 'mechanic_overalls', label: 'Mechanic Overalls', desc: 'Heavy canvas shop bib, brass snaps & tool pockets' },
  { id: 'racing_suit', label: 'Pro FIA Racing Suit', desc: 'Fireproof jumpsuit with sponsor vertical stripes' },
  { id: 'leather_jacket', label: 'Biker Moto Leather', desc: 'Cafe racer leather with asymmetric zipper' },
  { id: 'utility_vest', label: 'Tactical Shop Vest', desc: 'Multi-pocket utility vest over fitted Henley' },
  { id: 'racing_hoodie', label: 'Paddock Racing Hoodie', desc: 'Heavyweight two-tone fleece with drawstrings' },
  { id: 'tuner_tshirt', label: 'Street Tuner Crewneck', desc: 'Relaxed workshop tee with rolled cuffs' },
];

const COLOR_SWATCHES = [
  { hex: '#0284c7', label: 'Tuner Blue' },
  { hex: '#dc2626', label: 'Apex Crimson' },
  { hex: '#16a34a', label: 'Racing Green' },
  { hex: '#d97706', label: 'Amber Gold' },
  { hex: '#9333ea', label: 'Nitro Violet' },
  { hex: '#ea580c', label: 'Volcanic Orange' },
  { hex: '#27272a', label: 'Stealth Matte Black' },
  { hex: '#f8fafc', label: 'Pure White' },
];

const PANTS_SWATCHES = [
  { hex: '#1e293b', label: 'Work Slate' },
  { hex: '#0f172a', label: 'Midnight Black' },
  { hex: '#1c1917', label: 'Raw Charcoal' },
  { hex: '#1e3a8a', label: 'Indigo Denim' },
  { hex: '#365314', label: 'Olive Canvas' },
  { hex: '#78350f', label: 'Khaki Duck' },
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
  'Ryder Hayes',
  'Sora Takahashi',
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
    const eyeColors = Object.keys(EYE_COLORS) as CharacterEyeColor[];
    const skinDetails: CharacterSkinDetail[] = ['clean', 'grease_smudge', 'tattoos', 'freckles'];
    const hairStyles: CharacterHairstyle[] = [
      'quiff',
      'side_part',
      'curly_fade',
      'dreadlocks',
      'undercut',
      'ponytail',
      'wavy_long',
      'bob_cut',
      'afro_taper',
      'buzz',
    ];
    const hairColors = Object.keys(HAIR_COLORS) as CharacterHairColor[];
    const accessories: CharacterAccessory[] = [
      'mechanic_cap',
      'safety_goggles',
      'racing_shades',
      'aviator_glasses',
      'headphones',
      'chain_necklace',
      'face_mask',
      'bandana',
      'tool_belt',
      'mechanic_gloves',
      'none',
    ];
    const clothings: CharacterClothing[] = [
      'mechanic_overalls',
      'racing_suit',
      'leather_jacket',
      'utility_vest',
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
      eyeColor: eyeColors[Math.floor(Math.random() * eyeColors.length)],
      skinDetail: skinDetails[Math.floor(Math.random() * skinDetails.length)],
      hairStyle: hairStyles[Math.floor(Math.random() * hairStyles.length)],
      hairColor: hairColors[Math.floor(Math.random() * hairColors.length)],
      facialHair:
        randomGender === 'female'
          ? 'clean'
          : ['clean', 'stubble', 'beard', 'goatee', 'mustache', 'horseshoe', 'van_dyke'][
              Math.floor(Math.random() * 7)
            ] as CharacterFacialHair,
      accessory: accessories[Math.floor(Math.random() * accessories.length)],
      clothing: clothings[Math.floor(Math.random() * clothings.length)],
      clothingColor: COLOR_SWATCHES[Math.floor(Math.random() * COLOR_SWATCHES.length)].hex,
      pantsColor: PANTS_SWATCHES[Math.floor(Math.random() * PANTS_SWATCHES.length)].hex,
    };

    onChange(newChar);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top 3D Character Stage & Header */}
      <div className="relative w-full h-56 sm:h-64 bg-gradient-to-b from-zinc-950 via-[#0d1117] to-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden shrink-0 shadow-2xl mb-3">
        {/* Interactive 3D Canvas with Camera Focus & Poses */}
        <CharacterPreviewCanvas character={character} className="w-full h-full" />

        {/* Quick character name badge */}
        <div className="absolute top-2 left-2 z-10 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-700/80 shadow-md">
          <div className="text-[10px] uppercase font-tech text-amber-400 tracking-wider flex items-center gap-1">
            <Sparkles size={10} />
            <span>TUNER PROFILE</span>
          </div>
          <div className="text-xs font-bold uppercase font-display text-white truncate max-w-[140px] sm:max-w-[180px]">
            {character.name || 'Unnamed Driver'}
          </div>
        </div>

        {/* Randomize Dice Action */}
        <button
          id="btn-randomize-character"
          onClick={handleRandomize}
          className="absolute top-2 right-2 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-amber-500/20 border border-zinc-700 hover:border-amber-500/60 text-zinc-300 hover:text-amber-300 text-xs font-tech uppercase transition-all cursor-pointer shadow-lg backdrop-blur-md"
          title="Roll random appearance & gear"
        >
          <Dices size={14} className="text-amber-400" />
          <span>Randomize</span>
        </button>

        {/* Floating Quick Summary Pills */}
        <div className="absolute bottom-2 right-2 z-10 hidden sm:flex items-center gap-1.5">
          <span className="text-[9px] font-tech uppercase bg-black/70 px-2 py-0.5 rounded-full border border-zinc-800 text-zinc-300">
            {character.gender}
          </span>
          <span className="text-[9px] font-tech uppercase bg-black/70 px-2 py-0.5 rounded-full border border-zinc-800 text-zinc-300">
            {character.bodyType}
          </span>
          <span className="text-[9px] font-tech uppercase bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/40 text-amber-400">
            {SKIN_TONES[character.race]?.name}
          </span>
          {character.eyeColor && (
            <span className="text-[9px] font-tech uppercase bg-sky-500/20 px-2 py-0.5 rounded-full border border-sky-500/40 text-sky-400">
              {EYE_COLORS[character.eyeColor]?.name}
            </span>
          )}
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
          <span>Hair & Face</span>
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
              <div className="flex gap-2">
                <input
                  id="input-character-name"
                  type="text"
                  maxLength={24}
                  value={character.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Enter name..."
                  className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-tech focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const rnd = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
                    update('name', rnd);
                  }}
                  className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 text-xs cursor-pointer font-tech"
                  title="Randomize name"
                >
                  Random
                </button>
              </div>
            </div>

            {/* Gender / Form */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Physique & Form
              </label>
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map((g) => {
                  const isSelected = character.gender === g.id;
                  return (
                    <button
                      key={g.id}
                      onClick={() => update('gender', g.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-display font-bold text-xs uppercase text-amber-300">
                        {g.label}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                        {g.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body Type */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Body Stature & Build
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {BODY_TYPE_OPTIONS.map((b) => {
                  const isSelected = character.bodyType === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => update('bodyType', b.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-display font-bold text-xs uppercase text-amber-300">
                        {b.label}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                        {b.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Race / Complexion */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Race & Skin Tone
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(Object.keys(SKIN_TONES) as CharacterRace[]).map((raceKey) => {
                  const tone = SKIN_TONES[raceKey];
                  const isSelected = character.race === raceKey;
                  return (
                    <button
                      key={raceKey}
                      onClick={() => update('race', raceKey)}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/50 shrink-0 shadow-inner"
                        style={{ backgroundColor: tone.css }}
                      />
                      <span className="text-[11px] font-tech truncate">{tone.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Eye Color */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Eye Color
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(Object.keys(EYE_COLORS) as CharacterEyeColor[]).map((eyeKey) => {
                  const eye = EYE_COLORS[eyeKey];
                  const isSelected = (character.eyeColor || 'brown') === eyeKey;
                  return (
                    <button
                      key={eyeKey}
                      onClick={() => update('eyeColor', eyeKey)}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/60 shrink-0 shadow-inner flex items-center justify-center"
                        style={{ backgroundColor: eye.css }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-black" />
                      </span>
                      <span className="text-[10px] font-tech truncate">{eye.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Skin Details (Grease, Tattoos, Freckles) */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Mechanic Complexion Details
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SKIN_DETAIL_OPTIONS.map((sd) => {
                  const isSelected = (character.skinDetail || 'clean') === sd.id;
                  return (
                    <button
                      key={sd.id}
                      onClick={() => update('skinDetail', sd.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-display font-bold text-xs uppercase text-amber-300">
                        {sd.label}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                        {sd.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= HAIR & FACE TAB ================= */}
        {activeTab === 'hair' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Hairstyles Grid */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] uppercase font-tech text-zinc-400">
                  Sculpted Hairstyle ({HAIRSTYLE_OPTIONS.length} Cuts)
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {HAIRSTYLE_OPTIONS.map((h) => {
                  const isSelected = character.hairStyle === h.id;
                  return (
                    <button
                      key={h.id}
                      onClick={() => update('hairStyle', h.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-tech text-xs font-bold text-zinc-200">{h.label}</div>
                        <div className="text-[9px] text-zinc-400 uppercase">{h.category}</div>
                      </div>
                      {isSelected && <Check size={14} className="text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hair Color Palette */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Hair Color & Tuner Dyes
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(Object.keys(HAIR_COLORS) as CharacterHairColor[]).map((hairKey) => {
                  const hair = HAIR_COLORS[hairKey];
                  const isSelected = character.hairColor === hairKey;
                  return (
                    <button
                      key={hairKey}
                      onClick={() => update('hairColor', hairKey)}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/60 shrink-0 shadow-inner"
                        style={{ backgroundColor: hair.css }}
                      />
                      <span className="text-[10px] font-tech truncate">{hair.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Facial Hair (Hidden if female for clean UI) */}
            {character.gender !== 'female' && (
              <div>
                <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                  Facial Hair & Grooming
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FACIAL_HAIR_OPTIONS.map((f) => {
                    const isSelected = character.facialHair === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => update('facialHair', f.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <div className="font-tech text-xs font-bold text-zinc-200">{f.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= ACCESSORIES / GEAR TAB ================= */}
        {activeTab === 'accessories' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1">
              Driver & Mechanic Accessories ({ACCESSORY_OPTIONS.length} Items)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ACCESSORY_OPTIONS.map((acc) => {
                const isSelected = character.accessory === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => update('accessory', acc.id)}
                    className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                        : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div>
                      <div className="font-display font-bold text-xs uppercase text-amber-300">
                        {acc.label}
                      </div>
                      <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                        {acc.desc}
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="text-amber-400 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= WARDROBE / ATTIRE TAB ================= */}
        {activeTab === 'wardrobe' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            {/* Clothing Cut */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Workshop & Track Wardrobe
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CLOTHING_OPTIONS.map((c) => {
                  const isSelected = character.clothing === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => update('clothing', c.id)}
                      className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <div>
                        <div className="font-display font-bold text-xs uppercase text-amber-300">
                          {c.label}
                        </div>
                        <div className="text-[10px] text-zinc-400 leading-tight mt-0.5">
                          {c.desc}
                        </div>
                      </div>
                      {isSelected && <Check size={14} className="text-amber-400 shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Top / Primary Clothing Color */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Primary Top / Outfit Color
              </label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {COLOR_SWATCHES.map((swatch) => {
                  const isSelected = character.clothingColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.hex}
                      onClick={() => update('clothingColor', swatch.hex)}
                      className={`h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-400 scale-105 shadow-md shadow-amber-500/20 ring-2 ring-amber-400/40'
                          : 'border-zinc-700 hover:border-zinc-500'
                      }`}
                      style={{ backgroundColor: swatch.hex }}
                      title={swatch.label}
                    >
                      {isSelected && (
                        <Check
                          size={14}
                          className={
                            swatch.hex === '#f8fafc' || swatch.hex === '#d97706'
                              ? 'text-black'
                              : 'text-white'
                          }
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pants Color */}
            <div>
              <label className="text-[11px] uppercase font-tech text-zinc-400 block mb-1.5">
                Trousers / Work Pants Color
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PANTS_SWATCHES.map((swatch) => {
                  const isSelected = character.pantsColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.hex}
                      onClick={() => update('pantsColor', swatch.hex)}
                      className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white ring-1 ring-amber-400/40'
                          : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      <span
                        className="w-5 h-5 rounded-full border border-black/60 shrink-0 shadow-inner"
                        style={{ backgroundColor: swatch.hex }}
                      />
                      <span className="text-[10px] font-tech truncate">{swatch.label}</span>
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
