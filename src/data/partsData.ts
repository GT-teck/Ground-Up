import { CarPart } from '../types';

export const INITIAL_CAR_PARTS: CarPart[] = [
  {
    id: 'part-radiator',
    name: 'Heavy-Duty Brass Radiator',
    category: 'radiator',
    condition: 35,
    isClean: false,
    isInstalled: true,
    isWorking: false,
    value: 380,
    tier: 'rusty_junk',
    needsWash: true,
    description: 'Caked thick with dried mud and leaves. Coolant blocked until power-washed!',
  },
  {
    id: 'part-battery',
    name: '12V 850 CCA DieHard Battery',
    category: 'battery',
    condition: 12,
    isClean: true,
    isInstalled: true,
    isWorking: false,
    value: 190,
    tier: 'rusty_junk',
    needsCharge: true,
    chargeVoltage: 1.4,
    description: 'Flat at 1.4 Volts. Connect alligator clamps to charge back to 12.6V.',
  },
  {
    id: 'part-block',
    name: '427 CI Iron Big Block V8',
    category: 'engine',
    condition: 20,
    isClean: false,
    isInstalled: true,
    isWorking: false,
    value: 2800,
    tier: 'rusty_junk',
    needsWash: true,
    needsRepair: true,
    description: 'Oil stains and oxidized steel. Needs degreaser wash and workbench rebuild.',
  },
  {
    id: 'part-turbo',
    name: 'Twin-Scroll T3/T4 Turbocharger',
    category: 'turbo',
    condition: 24,
    isClean: false,
    isInstalled: true,
    isWorking: false,
    value: 1450,
    tier: 'rusty_junk',
    needsWash: true,
    needsRepair: true,
    description: 'Seized turbine wheel and rusted exhaust housing. Needs workbench servicing.',
  },
  {
    id: 'part-intake',
    name: 'Dual Holley 4-Barrel Intake',
    category: 'intake',
    condition: 30,
    isClean: false,
    isInstalled: true,
    isWorking: false,
    value: 750,
    tier: 'rusty_junk',
    needsWash: true,
    needsRepair: true,
    description: 'Gummed fuel jets and varnish buildup. Wash clean and tune jets.',
  },
  {
    id: 'part-brakes',
    name: '4-Piston Calipers & Slotted Rotors',
    category: 'brakes',
    condition: 28,
    isClean: false,
    isInstalled: true,
    isWorking: false,
    value: 620,
    tier: 'rusty_junk',
    needsWash: true,
    needsRepair: true,
    description: 'Heavily oxidized rotor faces. Clean rust and resurface on workbench.',
  },
  {
    id: 'part-suspension',
    name: 'Sport Rebound Coilovers',
    category: 'suspension',
    condition: 34,
    isClean: false,
    isInstalled: true,
    isWorking: false,
    value: 840,
    tier: 'rusty_junk',
    needsRepair: true,
    description: 'Stiff, seized shock collars. Needs teardown and seal replacements.',
  },
  {
    id: 'part-wheels',
    name: '15x10 Deep-Dish Steel Rims & Tires',
    category: 'wheel',
    condition: 15,
    isClean: false,
    isInstalled: true,
    isWorking: false,
    value: 550,
    tier: 'rusty_junk',
    needsTireChange: true,
    tireTread: 0,
    description: 'Dry-rotted flat tire. Mount on tire machine to de-bead and install fresh rubber.',
  },
];

export interface JunkyardBeater {
  id: string;
  name: string;
  price: number;
  rustLevel: string;
  salvageEngine: string;
  imageColor: string;
  description: string;
}

export const JUNKYARD_BEATERS: JunkyardBeater[] = [
  {
    id: 'beater-camaro',
    name: '1969 Rebel 427 Hardtop',
    price: 3200,
    rustLevel: 'Heavy Patina / Barn Dirt',
    salvageEngine: '427 Big Block (Seized)',
    imageColor: 'from-amber-800 to-stone-900',
    description: 'Complete rolling shell pulled out of a collapsed hayloft. Matching engine block!',
  },
  {
    id: 'beater-truck',
    name: '1956 Step-Side Workhorse',
    price: 1850,
    rustLevel: 'Surface Rust / Solid Frame',
    salvageEngine: 'Inline-6 Cylinder',
    imageColor: 'from-stone-700 to-zinc-900',
    description: 'Parked behind an abandoned barn for 30 years. Frame rails are remarkably straight.',
  },
  {
    id: 'beater-datsun',
    name: '1973 Z-Coupe Hatch',
    price: 4400,
    rustLevel: 'Rusted Floor Pans',
    salvageEngine: 'L28 Twin-Carb',
    imageColor: 'from-orange-800 to-amber-950',
    description: 'Barn find survivor with rare factory dual carburetors and 5-speed manual.',
  },
];

export interface StorePartItem {
  id: string;
  name: string;
  category: CarPart['category'];
  price: number;
  hpGain: string;
  description: string;
  tier: CarPart['tier'];
}

export const SPEED_STORE_ITEMS: StorePartItem[] = [
  {
    id: 'store-turbo-billet',
    name: 'Garrett Billet GTX4294 Turbo',
    category: 'turbo',
    price: 2400,
    hpGain: '+280 HP',
    description: 'Ceramic ball-bearing cartridge capable of 35 PSI boost pressure.',
    tier: 'race_spec',
  },
  {
    id: 'store-intake-highflow',
    name: 'Edelbrock Tunnel Ram Dual-Quad',
    category: 'intake',
    price: 950,
    hpGain: '+95 HP',
    description: 'Polished aluminum intake manifold for high-RPM breathing.',
    tier: 'performance_sport',
  },
  {
    id: 'store-brakes-wilwood',
    name: 'Wilwood 6-Piston Big Brake Kit',
    category: 'brakes',
    price: 1350,
    hpGain: '+40% Stop Power',
    description: 'Drilled & slotted 14" vented rotors with forged red calipers.',
    tier: 'race_spec',
  },
  {
    id: 'store-coilover-kw',
    name: 'KW 3-Way Inverted Coilovers',
    category: 'suspension',
    price: 1600,
    hpGain: '+Stance & Grip',
    description: 'Fully adjustable ride height, damping, and camber plates.',
    tier: 'performance_sport',
  },
  {
    id: 'store-radiator-mishimoto',
    name: 'Triple-Core Aluminum Racing Radiator',
    category: 'radiator',
    price: 520,
    hpGain: 'Cooling +60%',
    description: 'TIG-welded aircraft aluminum cores with dual electric fans.',
    tier: 'performance_sport',
  },
  {
    id: 'store-battery-optima',
    name: 'Optima YellowTop AGM Battery',
    category: 'battery',
    price: 340,
    hpGain: '12.8V Ready',
    description: 'SpiralCell AGM technology. Pre-charged and deep-cycle ready.',
    tier: 'performance_sport',
  },
];

export const TIRE_SHOP_ITEMS = [
  {
    id: 'tire-drag-slicks',
    name: 'Mickey Thompson 28x10.5 Drag Slicks',
    price: 680,
    gripRating: '★★★★★ (Drag)',
    description: 'Sticky soft compound for maximum launch grip on the quarter-mile.',
  },
  {
    id: 'tire-track-r888',
    name: 'Toyo Proxes R888R Semi-Slicks',
    price: 740,
    gripRating: '★★★★☆ (Track)',
    description: 'High lateral G-force grip for road courses and canyon carving.',
  },
  {
    id: 'tire-street-radial',
    name: 'BFGoodrich Radial T/A Classic',
    price: 420,
    gripRating: '★★★☆☆ (Street)',
    description: 'Raised white letter classic muscle car street tires with long tread life.',
  },
];
