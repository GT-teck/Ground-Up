export type Screen = 'main' | 'start' | 'settings' | 'leaderboard' | 'garage';

export type StartSubView = 'choose' | 'load_save' | 'start_new';

export type LeaderboardCategory = 'top_speed' | 'most_sold_cars' | 'money_earned';

export type PartCategory = 'engine' | 'turbo' | 'intake' | 'radiator' | 'battery' | 'brakes' | 'suspension' | 'wheel';

export interface CarPart {
  id: string;
  name: string;
  category: PartCategory;
  condition: number; // 0 to 100%
  isClean: boolean;
  isInstalled: boolean;
  isWorking: boolean;
  value: number;
  description: string;
  tier?: 'rusty_junk' | 'oem_repaired' | 'performance_sport' | 'race_spec';
  needsWash?: boolean;
  needsRepair?: boolean;
  needsCharge?: boolean;
  needsTireChange?: boolean;
  chargeVoltage?: number; // for battery: e.g. 0V to 12.6V
  tireTread?: number; // for wheels: 0 to 100%
}

export type WorkstationType = 'wash' | 'workbench' | 'battery' | 'tire_machine';

export type PlayerControlMode = 'on_foot' | 'driving';

export type OpenWorldLocationId = 'garage' | 'junkyard' | 'speed_shop' | 'tire_shop' | 'budget_buyer' | 'elite_buyer';

export type MapLocation = 'garage' | 'junkyard' | 'parts_store' | 'tire_shop' | 'paint_shop' | 'car_buyer';

export type CameraPerspective = 'fps' | 'third_person';

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  scoreDisplay: string;
  scoreNumeric: number;
  subtitle: string;
  carModel: string;
  badge?: string;
  isCurrentUser?: boolean;
}

export type CharacterGender = 'male' | 'female' | 'unisex';
export type CharacterBodyType = 'athletic' | 'muscular' | 'slim' | 'heavy';
export type CharacterRace = 'fair' | 'tan' | 'warm_brown' | 'deep_bronze' | 'golden_fair';
export type CharacterHairstyle = 'buzz' | 'side_part' | 'quiff' | 'ponytail' | 'curly_fade' | 'wavy_long' | 'bald';
export type CharacterHairColor = 'black' | 'dark_brown' | 'chestnut' | 'blonde' | 'auburn' | 'silver' | 'electric_blue';
export type CharacterAccessory = 'mechanic_cap' | 'safety_goggles' | 'racing_shades' | 'aviator_glasses' | 'bandana' | 'tool_belt' | 'mechanic_gloves' | 'none';
export type CharacterFacialHair = 'clean' | 'stubble' | 'beard' | 'goatee' | 'mustache';
export type CharacterClothing = 'mechanic_overalls' | 'leather_jacket' | 'racing_hoodie' | 'tuner_tshirt';

export interface CharacterCustomization {
  name: string;
  gender: CharacterGender;
  race: CharacterRace;
  bodyType: CharacterBodyType;
  hairStyle: CharacterHairstyle;
  hairColor: CharacterHairColor;
  facialHair: CharacterFacialHair;
  accessory: CharacterAccessory;
  clothing: CharacterClothing;
  clothingColor: string; // hex
  pantsColor: string; // hex
}

export interface SaveSlot {
  id: string;
  title: string;
  carModel: string;
  carThumbnailClass: string;
  playtime: string;
  cash: number;
  completionPercent: number;
  lastPlayed: string;
  isEmpty?: boolean;
  character?: CharacterCustomization;
}

export type GraphicsPreset = 'low' | 'medium' | 'high' | 'ultra';
export type FpsTarget = 30 | 60 | 120;

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  engineVolume: number;
  isMuted: boolean;
  graphicsPreset: GraphicsPreset;
  targetFps: FpsTarget;
  motionBlur: boolean;
  bloomAndGlow: boolean;
  antiAliasing: 'off' | 'fxaa' | 'taa';
  shadows: 'off' | 'low' | 'high';
}

