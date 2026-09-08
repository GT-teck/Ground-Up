import * as THREE from 'three';
import {
  CharacterCustomization,
  CharacterRace,
  CharacterHairColor,
  CharacterEyeColor,
  CharacterPreviewPose,
} from '../types';

export const SKIN_TONES: Record<CharacterRace, { hex: number; name: string; css: string; subHex: number }> = {
  fair: { hex: 0xf6d6bd, name: 'Fair / Ivory', css: '#f6d6bd', subHex: 0xfce7d2 },
  tan: { hex: 0xdf9f7a, name: 'Tan / Olive', css: '#df9f7a', subHex: 0xe8ad89 },
  warm_brown: { hex: 0xa66c48, name: 'Warm Bronze', css: '#a66c48', subHex: 0xb57b56 },
  deep_bronze: { hex: 0x5a3928, name: 'Deep Espresso', css: '#5a3928', subHex: 0x6e4732 },
  golden_fair: { hex: 0xf5ce9f, name: 'Golden Almond', css: '#f5ce9f', subHex: 0xfae0b8 },
};

export const HAIR_COLORS: Record<CharacterHairColor, { hex: number; name: string; css: string }> = {
  black: { hex: 0x18181b, name: 'Jet Black', css: '#18181b' },
  dark_brown: { hex: 0x382214, name: 'Dark Chocolate', css: '#382214' },
  chestnut: { hex: 0x6e3b1c, name: 'Chestnut Brown', css: '#6e3b1c' },
  blonde: { hex: 0xeab308, name: 'Golden Honey Blonde', css: '#eab308' },
  auburn: { hex: 0x991b1b, name: 'Auburn Copper', css: '#991b1b' },
  silver: { hex: 0x94a3b8, name: 'Silver Platinum', css: '#94a3b8' },
  electric_blue: { hex: 0x06b6d4, name: 'Tuner Cyan', css: '#06b6d4' },
  neon_pink: { hex: 0xec4899, name: 'Neon Sakura Pink', css: '#ec4899' },
  acid_green: { hex: 0x84cc16, name: 'Acid Racing Green', css: '#84cc16' },
  purple: { hex: 0x8b5cf6, name: 'Royal Tuner Purple', css: '#8b5cf6' },
};

export const EYE_COLORS: Record<CharacterEyeColor, { hex: number; name: string; css: string }> = {
  brown: { hex: 0x452312, name: 'Warm Brown', css: '#452312' },
  hazel: { hex: 0x78562d, name: 'Golden Hazel', css: '#78562d' },
  blue: { hex: 0x2563eb, name: 'Sapphire Blue', css: '#2563eb' },
  green: { hex: 0x16a34a, name: 'Emerald Green', css: '#16a34a' },
  gray: { hex: 0x64748b, name: 'Steel Gray', css: '#64748b' },
  amber: { hex: 0xd97706, name: 'Amber Gold', css: '#d97706' },
};

export const DEFAULT_CHARACTER: CharacterCustomization = {
  name: 'Alex Rivera',
  gender: 'male',
  race: 'tan',
  bodyType: 'athletic',
  eyeColor: 'brown',
  skinDetail: 'grease_smudge',
  hairStyle: 'quiff',
  hairColor: 'dark_brown',
  facialHair: 'stubble',
  accessory: 'mechanic_cap',
  clothing: 'mechanic_overalls',
  clothingColor: '#0284c7', // vibrant mechanic blue
  pantsColor: '#1e293b', // dark work slate
};

export interface CharacterRig {
  group: THREE.Group;
  updateAnimation: (dt: number, isMoving: boolean, isSprinting: boolean) => void;
  setPose: (pose: CharacterPreviewPose) => void;
  dispose: () => void;
}

/**
 * Creates procedural high-resolution textures for eyes, fabric weave, and tattoos.
 */
function createProceduralTextures(
  eyeColorHex: number,
  skinDetail?: string
) {
  // 1. High Detail Eye Texture (Canvas)
  const eyeCanvas = document.createElement('canvas');
  eyeCanvas.width = 128;
  eyeCanvas.height = 128;
  const ctx = eyeCanvas.getContext('2d');
  if (ctx) {
    // Sclera base
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 128, 128);

    // Subtle edge shading
    const radGrd = ctx.createRadialGradient(64, 64, 25, 64, 64, 60);
    radGrd.addColorStop(0, 'rgba(255,255,255,0)');
    radGrd.addColorStop(1, 'rgba(226,232,240,0.8)');
    ctx.fillStyle = radGrd;
    ctx.fillRect(0, 0, 128, 128);

    // Iris outer limbal ring
    ctx.beginPath();
    ctx.arc(64, 64, 38, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();

    // Iris main color
    const eyeColorCss = '#' + eyeColorHex.toString(16).padStart(6, '0');
    const irisGrd = ctx.createRadialGradient(64, 64, 10, 64, 64, 36);
    irisGrd.addColorStop(0, '#ffffff');
    irisGrd.addColorStop(0.3, eyeColorCss);
    irisGrd.addColorStop(0.9, eyeColorCss);
    irisGrd.addColorStop(1, '#020617');
    ctx.beginPath();
    ctx.arc(64, 64, 36, 0, Math.PI * 2);
    ctx.fillStyle = irisGrd;
    ctx.fill();

    // Pupil
    ctx.beginPath();
    ctx.arc(64, 64, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#000000';
    ctx.fill();

    // Specular gleam dot
    ctx.beginPath();
    ctx.arc(55, 52, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();
  }

  const eyeTexture = new THREE.CanvasTexture(eyeCanvas);
  eyeTexture.wrapS = THREE.ClampToEdgeWrapping;
  eyeTexture.wrapT = THREE.ClampToEdgeWrapping;

  // 2. Fabric Twill / Denim Canvas Bump Map
  const twillCanvas = document.createElement('canvas');
  twillCanvas.width = 64;
  twillCanvas.height = 64;
  const tCtx = twillCanvas.getContext('2d');
  if (tCtx) {
    tCtx.fillStyle = '#808080';
    tCtx.fillRect(0, 0, 64, 64);
    tCtx.strokeStyle = '#606060';
    tCtx.lineWidth = 1;
    for (let i = -64; i < 128; i += 4) {
      tCtx.beginPath();
      tCtx.moveTo(i, 0);
      tCtx.lineTo(i + 64, 64);
      tCtx.stroke();
    }
  }
  const twillBumpMap = new THREE.CanvasTexture(twillCanvas);
  twillBumpMap.wrapS = THREE.RepeatWrapping;
  twillBumpMap.wrapT = THREE.RepeatWrapping;
  twillBumpMap.repeat.set(8, 8);

  return { eyeTexture, twillBumpMap };
}

/**
 * Procedurally builds an ultra-high-fidelity articulated human character mesh
 * with natural anatomy, defined facial contours, high-tier styling, and multi-pose animation.
 */
export function createHumanCharacter(config: CharacterCustomization): CharacterRig {
  const root = new THREE.Group();
  root.name = 'HighQualityHumanCharacter';

  // Body scale modifiers
  let shoulderWidthScale = 1.0;
  let chestDepthScale = 1.0;
  let limbThicknessScale = 1.0;
  let waistWidthScale = 1.0;
  let heightScale = 1.0;

  if (config.bodyType === 'muscular') {
    shoulderWidthScale = 1.25;
    chestDepthScale = 1.2;
    limbThicknessScale = 1.18;
    waistWidthScale = 1.06;
  } else if (config.bodyType === 'slim') {
    shoulderWidthScale = 0.9;
    chestDepthScale = 0.86;
    limbThicknessScale = 0.86;
    waistWidthScale = 0.84;
    heightScale = 1.02;
  } else if (config.bodyType === 'heavy') {
    shoulderWidthScale = 1.18;
    chestDepthScale = 1.34;
    limbThicknessScale = 1.22;
    waistWidthScale = 1.32;
    heightScale = 0.98;
  }

  if (config.gender === 'female') {
    shoulderWidthScale *= 0.88;
    waistWidthScale *= 0.84;
    chestDepthScale *= 0.94;
  }

  // Textures
  const eyeColorKey = config.eyeColor || 'brown';
  const eyeHex = EYE_COLORS[eyeColorKey]?.hex || 0x452312;
  const { eyeTexture, twillBumpMap } = createProceduralTextures(eyeHex, config.skinDetail);

  // Materials with PBR Settings
  const skinToneInfo = SKIN_TONES[config.race] || SKIN_TONES.tan;
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinToneInfo.hex,
    roughness: 0.58,
    metalness: 0.02,
  });

  const skinDarkMat = new THREE.MeshStandardMaterial({
    color: skinToneInfo.subHex,
    roughness: 0.65,
    metalness: 0.02,
  });

  const hairColorInfo = HAIR_COLORS[config.hairColor] || HAIR_COLORS.dark_brown;
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColorInfo.hex,
    roughness: 0.68,
    metalness: 0.12,
  });

  const clothColorHex = parseInt(config.clothingColor.replace('#', '0x'), 16) || 0x0284c7;
  const clothMat = new THREE.MeshStandardMaterial({
    color: clothColorHex,
    roughness: 0.62,
    metalness: 0.05,
    bumpMap: twillBumpMap,
    bumpScale: 0.015,
  });

  const pantsColorHex = parseInt(config.pantsColor.replace('#', '0x'), 16) || 0x1e293b;
  const pantsMat = new THREE.MeshStandardMaterial({
    color: pantsColorHex,
    roughness: 0.75,
    metalness: 0.05,
    bumpMap: twillBumpMap,
    bumpScale: 0.02,
  });

  const bootLeatherMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.45,
    metalness: 0.15,
  });

  const bootSoleMat = new THREE.MeshStandardMaterial({
    color: 0x0a0a0a,
    roughness: 0.85,
    metalness: 0.1,
  });

  const metalChromeMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.92,
    roughness: 0.18,
  });

  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.85,
    roughness: 0.3,
  });

  const eyeMaterial = new THREE.MeshStandardMaterial({
    map: eyeTexture,
    roughness: 0.1,
    metalness: 0.05,
  });

  const lipsMat = new THREE.MeshStandardMaterial({
    color: config.gender === 'female' ? 0xb91c1c : 0xa65042,
    roughness: 0.4,
    metalness: 0.05,
  });

  // ==========================================
  // 1. PELVIS / HIPS
  // ==========================================
  const pelvis = new THREE.Group();
  pelvis.position.set(0, 0.96 * heightScale, 0);
  root.add(pelvis);

  const hipWidth = 0.3 * waistWidthScale;
  const hipDepth = 0.23 * chestDepthScale;
  const pelvisMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(hipWidth * 0.48, hipWidth * 0.52, 0.2, 16),
    pantsMat
  );
  pelvisMesh.castShadow = true;
  pelvis.add(pelvisMesh);

  // Heavy Duty Leather Work Belt & Brass/Steel Buckle
  const beltMesh = new THREE.Mesh(
    new THREE.BoxGeometry(hipWidth + 0.025, 0.055, hipDepth + 0.025),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
  );
  beltMesh.position.y = 0.08;
  pelvis.add(beltMesh);

  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.085, 0.065, 0.035),
    metalChromeMat
  );
  buckle.position.set(0, 0.08, hipDepth * 0.52);
  pelvis.add(buckle);

  // Belt Loops around waist
  [-hipWidth * 0.42, -hipWidth * 0.18, hipWidth * 0.18, hipWidth * 0.42].forEach((bx) => {
    const loop = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.065, 0.015),
      pantsMat
    );
    loop.position.set(bx, 0.08, hipDepth * 0.52);
    pelvis.add(loop);
  });

  // Tool Belt Accessory
  if (config.accessory === 'tool_belt') {
    const pouch = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.14, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 })
    );
    pouch.position.set(hipWidth * 0.55, 0.02, 0.03);
    pouch.castShadow = true;
    pelvis.add(pouch);

    // Realistic chrome combination wrench
    const wrenchShaft = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.18, 0.015),
      metalChromeMat
    );
    wrenchShaft.position.set(hipWidth * 0.55, 0.12, 0.03);
    wrenchShaft.rotation.z = 0.25;
    pelvis.add(wrenchShaft);

    // Tape measure clip on opposite side
    const tapeMeasure = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.065, 0.05),
      new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.2 })
    );
    tapeMeasure.position.set(-hipWidth * 0.53, 0.04, 0.02);
    pelvis.add(tapeMeasure);
  }

  // ==========================================
  // 2. TORSO & ABDOMEN & CHEST
  // ==========================================
  const torso = new THREE.Group();
  torso.position.set(0, 0.12, 0);
  pelvis.add(torso);

  const chestW = (config.gender === 'female' ? 0.33 : 0.38) * shoulderWidthScale;
  const chestD = 0.25 * chestDepthScale;
  const chestH = 0.45;

  // Sculpted anatomical torso (ribcage taper)
  const chestMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(chestW * 0.52, hipWidth * 0.48, chestH, 20),
    clothMat
  );
  chestMesh.position.y = chestH * 0.5;
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Female bust shaping or male pectoral contours
  if (config.gender === 'female') {
    const bustMesh = new THREE.Mesh(
      new THREE.SphereGeometry(chestW * 0.32, 16, 12),
      clothMat
    );
    bustMesh.scale.set(1.15, 0.75, 0.95);
    bustMesh.position.set(0, chestH * 0.65, chestD * 0.32);
    torso.add(bustMesh);
  } else {
    // Pectoral definition plates
    [-chestW * 0.22, chestW * 0.22].forEach((px) => {
      const pec = new THREE.Mesh(
        new THREE.BoxGeometry(chestW * 0.38, 0.13, 0.04),
        clothMat
      );
      pec.position.set(px, chestH * 0.68, chestD * 0.48);
      torso.add(pec);
    });
  }

  // Clavicle / Collarbone accent
  const collarBone = new THREE.Mesh(
    new THREE.TorusGeometry(chestW * 0.32, 0.015, 8, 16, Math.PI * 0.8),
    skinDarkMat
  );
  collarBone.position.set(0, chestH * 0.94, chestD * 0.28);
  collarBone.rotation.x = Math.PI * 0.45;
  torso.add(collarBone);

  // Grease smudge on clothes / chest if selected
  if (config.skinDetail === 'grease_smudge') {
    const greaseSmudge = new THREE.Mesh(
      new THREE.CircleGeometry(0.045, 8),
      new THREE.MeshBasicMaterial({ color: 0x18181b, transparent: true, opacity: 0.45 })
    );
    greaseSmudge.position.set(chestW * 0.2, chestH * 0.5, chestD * 0.51);
    torso.add(greaseSmudge);
  }

  // --- Clothing Specific Details ---
  if (config.clothing === 'mechanic_overalls') {
    // Heavy canvas bib
    const bib = new THREE.Mesh(
      new THREE.BoxGeometry(chestW * 0.72, chestH * 0.65, 0.035),
      pantsMat
    );
    bib.position.set(0, chestH * 0.45, chestD * 0.49);
    torso.add(bib);

    // Front pencil pocket on bib
    const pocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.1, 0.02),
      pantsMat
    );
    pocket.position.set(0, chestH * 0.46, chestD * 0.51);
    torso.add(pocket);

    // Overalls straps & Brass buckles
    [-chestW * 0.26, chestW * 0.26].forEach((sx) => {
      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(0.042, chestH * 0.95, 0.025),
        pantsMat
      );
      strap.position.set(sx, chestH * 0.5, chestD * 0.5);
      torso.add(strap);

      const brassBuckle = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.035, 0.03),
        brassMat
      );
      brassBuckle.position.set(sx, chestH * 0.72, chestD * 0.52);
      torso.add(brassBuckle);
    });
  } else if (config.clothing === 'leather_jacket') {
    // Motorcycle zip & asymmetric lapel
    const zipLine = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, chestH * 0.85, 0.035),
      metalChromeMat
    );
    zipLine.position.set(0.02, chestH * 0.48, chestD * 0.51);
    torso.add(zipLine);

    // Wide leather collar lapels
    const lapelLeft = new THREE.Mesh(
      new THREE.BoxGeometry(chestW * 0.25, 0.16, 0.03),
      clothMat
    );
    lapelLeft.position.set(-chestW * 0.22, chestH * 0.82, chestD * 0.52);
    lapelLeft.rotation.z = 0.35;
    torso.add(lapelLeft);

    const lapelRight = new THREE.Mesh(
      new THREE.BoxGeometry(chestW * 0.25, 0.16, 0.03),
      clothMat
    );
    lapelRight.position.set(chestW * 0.22, chestH * 0.82, chestD * 0.52);
    lapelRight.rotation.z = -0.35;
    torso.add(lapelRight);

    // Metallic snaps
    [-0.08, 0.08].forEach((nx) => {
      const snap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.012, 0.012, 0.02, 8),
        metalChromeMat
      );
      snap.rotation.x = Math.PI / 2;
      snap.position.set(nx, chestH * 0.82, chestD * 0.54);
      torso.add(snap);
    });
  } else if (config.clothing === 'racing_hoodie') {
    // Kangaroo pocket
    const pouch = new THREE.Mesh(
      new THREE.BoxGeometry(chestW * 0.65, 0.16, 0.045),
      clothMat
    );
    pouch.position.set(0, chestH * 0.28, chestD * 0.5);
    torso.add(pouch);

    // Hood drawstrings with metal aglets
    [-0.04, 0.04].forEach((dx) => {
      const string = new THREE.Mesh(
        new THREE.CylinderGeometry(0.005, 0.005, 0.18, 6),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
      );
      string.position.set(dx, chestH * 0.72, chestD * 0.52);
      torso.add(string);

      const aglet = new THREE.Mesh(
        new THREE.CylinderGeometry(0.007, 0.007, 0.025, 6),
        metalChromeMat
      );
      aglet.position.set(dx, chestH * 0.62, chestD * 0.52);
      torso.add(aglet);
    });

    // Resting hood on back
    const hoodRest = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 10),
      clothMat
    );
    hoodRest.scale.set(1.15, 0.7, 0.75);
    hoodRest.position.set(0, chestH * 0.88, -chestD * 0.45);
    torso.add(hoodRest);
  } else if (config.clothing === 'racing_suit') {
    // FIA Racing Jumpsuit with dual vertical sponsor bands & collar
    const bandLeft = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, chestH * 0.9, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    bandLeft.position.set(-chestW * 0.28, chestH * 0.5, chestD * 0.51);
    torso.add(bandLeft);

    const bandRight = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, chestH * 0.9, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b })
    );
    bandRight.position.set(chestW * 0.28, chestH * 0.5, chestD * 0.51);
    torso.add(bandRight);

    // Racing collar with velcro tab
    const raceCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.13, 0.06, 16),
      clothMat
    );
    raceCollar.position.set(0, chestH + 0.02, 0);
    torso.add(raceCollar);
  } else if (config.clothing === 'utility_vest') {
    // Multi-pocket tactical shop vest over long sleeve
    const vestMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(chestW * 0.54, hipWidth * 0.5, chestH * 0.9, 16),
      new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.7 })
    );
    vestMesh.position.y = chestH * 0.48;
    torso.add(vestMesh);

    // Dual cargo pockets
    [-chestW * 0.22, chestW * 0.22].forEach((vx) => {
      const pocket = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.12, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.8 })
      );
      pocket.position.set(vx, chestH * 0.32, chestD * 0.52);
      torso.add(pocket);
    });

    // Brass D-ring
    const dRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.018, 0.005, 6, 10),
      brassMat
    );
    dRing.position.set(chestW * 0.25, chestH * 0.65, chestD * 0.52);
    torso.add(dRing);
  }

  // ==========================================
  // 3. NECK & HIGH-FIDELITY HEAD & FACE
  // ==========================================
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.09, 0.13, 16),
    skinMat
  );
  neck.position.set(0, chestH + 0.06, 0);
  torso.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, chestH + 0.23, 0);
  torso.add(headGroup);

  // Skull / Cranium with organic proportions (24 segments for smooth shading)
  const skull = new THREE.Mesh(
    new THREE.SphereGeometry(0.145, 24, 20),
    skinMat
  );
  skull.scale.set(0.94, 1.1, 1.02);
  skull.castShadow = true;
  headGroup.add(skull);

  // Sculpted Jawline & Chin
  const jaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.09, 0.11),
    skinMat
  );
  jaw.position.set(0, -0.095, 0.05);
  jaw.rotation.x = -0.15;
  headGroup.add(jaw);

  // Defined Cheekbones & Brow Ridge
  const browRidge = new THREE.Mesh(
    new THREE.BoxGeometry(0.15, 0.035, 0.06),
    skinMat
  );
  browRidge.position.set(0, 0.065, 0.125);
  headGroup.add(browRidge);

  // Sculpted Ears (with inner pinna/lobe depth)
  [-0.142, 0.142].forEach((ex) => {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 12, 10),
      skinMat
    );
    ear.scale.set(0.35, 1.3, 0.75);
    ear.position.set(ex, 0.01, 0.01);
    headGroup.add(ear);
  });

  // High Detail Sculpted Nose
  const noseBridge = new THREE.Mesh(
    new THREE.BoxGeometry(0.026, 0.06, 0.045),
    skinMat
  );
  noseBridge.position.set(0, 0.02, 0.148);
  noseBridge.rotation.x = -0.1;
  headGroup.add(noseBridge);

  const noseTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.022, 12, 10),
    skinMat
  );
  noseTip.scale.set(1.0, 0.85, 1.1);
  noseTip.position.set(0, -0.015, 0.165);
  headGroup.add(noseTip);

  // Nostrils
  [-0.014, 0.014].forEach((nx) => {
    const nostril = new THREE.Mesh(
      new THREE.SphereGeometry(0.009, 8, 8),
      skinDarkMat
    );
    nostril.position.set(nx, -0.022, 0.155);
    headGroup.add(nostril);
  });

  // Eyes with 3D eyeballs & eyelids
  [-0.048, 0.048].forEach((eyeX) => {
    const eyeball = new THREE.Mesh(
      new THREE.SphereGeometry(0.024, 16, 14),
      eyeMaterial
    );
    eyeball.scale.set(0.95, 0.7, 0.55);
    eyeball.position.set(eyeX, 0.038, 0.136);
    eyeball.rotation.y = (eyeX > 0 ? -1 : 1) * 0.05;
    headGroup.add(eyeball);

    // Upper Eyelid crease
    const upperLid = new THREE.Mesh(
      new THREE.TorusGeometry(0.024, 0.005, 6, 12, Math.PI * 0.9),
      skinDarkMat
    );
    upperLid.position.set(eyeX, 0.046, 0.142);
    upperLid.rotation.z = eyeX > 0 ? -0.1 : 0.1;
    headGroup.add(upperLid);

    // Eyebrow (textured arch)
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.014, 0.018),
      hairMat
    );
    brow.position.set(eyeX, 0.068, 0.136);
    brow.rotation.z = (eyeX > 0 ? -1 : 1) * 0.14;
    headGroup.add(brow);
  });

  // Sculpted Lips
  const upperLip = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.014, 0.02),
    lipsMat
  );
  upperLip.position.set(0, -0.046, 0.145);
  headGroup.add(upperLip);

  const lowerLip = new THREE.Mesh(
    new THREE.BoxGeometry(0.046, 0.016, 0.02),
    lipsMat
  );
  lowerLip.position.set(0, -0.062, 0.142);
  headGroup.add(lowerLip);

  // Skin detail: Mechanic grease smear or Freckles
  if (config.skinDetail === 'grease_smudge') {
    const faceGrease = new THREE.Mesh(
      new THREE.CircleGeometry(0.025, 8),
      new THREE.MeshBasicMaterial({ color: 0x18181b, transparent: true, opacity: 0.5 })
    );
    faceGrease.position.set(0.07, -0.02, 0.138);
    faceGrease.rotation.y = 0.5;
    headGroup.add(faceGrease);
  } else if (config.skinDetail === 'freckles') {
    [-0.04, -0.02, 0.02, 0.04].forEach((fx, i) => {
      const freckle = new THREE.Mesh(
        new THREE.CircleGeometry(0.003, 6),
        new THREE.MeshBasicMaterial({ color: 0x78350f, transparent: true, opacity: 0.7 })
      );
      freckle.position.set(fx, 0.005 + (i % 2) * 0.008, 0.155);
      headGroup.add(freckle);
    });
  }

  // --- Facial Hair ---
  if (config.gender !== 'female') {
    if (config.facialHair === 'stubble') {
      const stubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.148, 16, 14, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.32),
        new THREE.MeshStandardMaterial({
          color: hairColorInfo.hex,
          roughness: 0.95,
          opacity: 0.55,
          transparent: true,
        })
      );
      stubble.position.set(0, -0.015, 0.01);
      headGroup.add(stubble);
    } else if (config.facialHair === 'beard') {
      const fullBeard = new THREE.Mesh(
        new THREE.BoxGeometry(0.13, 0.14, 0.13),
        hairMat
      );
      fullBeard.position.set(0, -0.09, 0.08);
      headGroup.add(fullBeard);
    } else if (config.facialHair === 'goatee') {
      const goatee = new THREE.Mesh(
        new THREE.BoxGeometry(0.065, 0.08, 0.065),
        hairMat
      );
      goatee.position.set(0, -0.09, 0.105);
      headGroup.add(goatee);
    } else if (config.facialHair === 'mustache') {
      const stache = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.024, 0.028),
        hairMat
      );
      stache.position.set(0, -0.034, 0.154);
      headGroup.add(stache);
    } else if (config.facialHair === 'horseshoe') {
      // Rugged biker / vintage tuner horseshoe
      const topStache = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.022, 0.028),
        hairMat
      );
      topStache.position.set(0, -0.034, 0.154);
      headGroup.add(topStache);

      [-0.035, 0.035].forEach((hx) => {
        const sideBars = new THREE.Mesh(
          new THREE.BoxGeometry(0.018, 0.06, 0.02),
          hairMat
        );
        sideBars.position.set(hx, -0.07, 0.142);
        headGroup.add(sideBars);
      });
    } else if (config.facialHair === 'van_dyke') {
      // Sharp pointed Van Dyke mustache & chin tuft
      const sharpStache = new THREE.Mesh(
        new THREE.BoxGeometry(0.085, 0.02, 0.025),
        hairMat
      );
      sharpStache.position.set(0, -0.034, 0.154);
      headGroup.add(sharpStache);

      const chinTuft = new THREE.Mesh(
        new THREE.ConeGeometry(0.02, 0.06, 8),
        hairMat
      );
      chinTuft.position.set(0, -0.1, 0.11);
      chinTuft.rotation.x = Math.PI;
      headGroup.add(chinTuft);
    }
  }

  // ==========================================
  // 4. HIGH-QUALITY SCULPTED HAIRSTYLES
  // ==========================================
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  if (config.hairStyle === 'buzz') {
    const buzzCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.152, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hairMat
    );
    buzzCap.scale.set(0.96, 1.06, 1.02);
    hairGroup.add(buzzCap);
  } else if (config.hairStyle === 'quiff') {
    // Base hair cap
    const baseCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.153, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat
    );
    hairGroup.add(baseCap);

    // Textured sweeping Pompadour Quiff volume
    const quiffTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.165, 0.1, 0.22),
      hairMat
    );
    quiffTop.position.set(0, 0.155, 0.035);
    quiffTop.rotation.x = -0.22;
    hairGroup.add(quiffTop);

    // Front crest curl
    const frontCrest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.075, 0.15, 12),
      hairMat
    );
    frontCrest.position.set(0, 0.18, 0.1);
    frontCrest.rotation.z = Math.PI / 2;
    hairGroup.add(frontCrest);
  } else if (config.hairStyle === 'side_part') {
    const partCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.154, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat
    );
    hairGroup.add(partCap);

    const sweepVolume = new THREE.Mesh(
      new THREE.BoxGeometry(0.19, 0.07, 0.23),
      hairMat
    );
    sweepVolume.position.set(0.035, 0.145, 0.015);
    sweepVolume.rotation.z = -0.16;
    hairGroup.add(sweepVolume);
  } else if (config.hairStyle === 'ponytail') {
    const ponyCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.153, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    hairGroup.add(ponyCap);

    // Ponytail trailing down
    const tailMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.02, 0.38, 12),
      hairMat
    );
    tailMesh.position.set(0, 0.01, -0.21);
    tailMesh.rotation.x = 0.65;
    hairGroup.add(tailMesh);

    // Hair tie / scrunchie
    const tie = new THREE.Mesh(
      new THREE.TorusGeometry(0.048, 0.016, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 })
    );
    tie.position.set(0, 0.11, -0.165);
    tie.rotation.x = 0.65;
    hairGroup.add(tie);
  } else if (config.hairStyle === 'wavy_long') {
    const longBase = new THREE.Mesh(
      new THREE.SphereGeometry(0.155, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    hairGroup.add(longBase);

    // Left and Right sweeping shoulder locks
    [-0.145, 0.145].forEach((lx) => {
      const lock = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.03, 0.42, 10),
        hairMat
      );
      lock.position.set(lx, -0.09, 0.02);
      lock.rotation.z = (lx > 0 ? -1 : 1) * 0.18;
      hairGroup.add(lock);
    });
  } else if (config.hairStyle === 'curly_fade') {
    const fadeBase = new THREE.Mesh(
      new THREE.SphereGeometry(0.152, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.46),
      hairMat
    );
    hairGroup.add(fadeBase);

    // Multi-curl clusters
    for (let c = 0; c < 12; c++) {
      const curl = new THREE.Mesh(
        new THREE.SphereGeometry(0.045, 8, 8),
        hairMat
      );
      curl.position.set(
        Math.sin(c * 1.3) * 0.09,
        0.135 + Math.cos(c * 0.8) * 0.025,
        Math.cos(c * 1.3) * 0.09
      );
      hairGroup.add(curl);
    }
  } else if (config.hairStyle === 'dreadlocks') {
    // Base scalp
    const dBase = new THREE.Mesh(
      new THREE.SphereGeometry(0.153, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hairMat
    );
    hairGroup.add(dBase);

    // 10 hanging dreadlock strands around head with silver beads
    for (let d = 0; d < 8; d++) {
      const angle = (d / 8) * Math.PI * 2;
      const dreadStrand = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.016, 0.28, 8),
        hairMat
      );
      dreadStrand.position.set(
        Math.sin(angle) * 0.14,
        0.02,
        Math.cos(angle) * 0.14
      );
      dreadStrand.rotation.z = Math.sin(angle) * 0.2;
      dreadStrand.rotation.x = Math.cos(angle) * 0.2;
      hairGroup.add(dreadStrand);

      // Silver metal cuffs on every other dreadlock
      if (d % 2 === 0) {
        const bead = new THREE.Mesh(
          new THREE.CylinderGeometry(0.026, 0.026, 0.03, 8),
          metalChromeMat
        );
        bead.position.set(
          Math.sin(angle) * 0.14,
          -0.03,
          Math.cos(angle) * 0.14
        );
        hairGroup.add(bead);
      }
    }
  } else if (config.hairStyle === 'undercut') {
    // Tapered shaved sides
    const underCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.152, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.44),
      hairMat
    );
    hairGroup.add(underCap);

    // Long swept top fringe
    const sweptTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.08, 0.24),
      hairMat
    );
    sweptTop.position.set(0.03, 0.16, 0.02);
    sweptTop.rotation.z = -0.22;
    sweptTop.rotation.x = -0.1;
    hairGroup.add(sweptTop);
  } else if (config.hairStyle === 'bob_cut') {
    // Chic angular bob
    const bobCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.156, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
      hairMat
    );
    hairGroup.add(bobCap);

    [-0.145, 0.145].forEach((bx) => {
      const bobSide = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.26, 0.18),
        hairMat
      );
      bobSide.position.set(bx, -0.02, 0.02);
      hairGroup.add(bobSide);
    });
  } else if (config.hairStyle === 'afro_taper') {
    const afroVolume = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 18, 16),
      hairMat
    );
    afroVolume.scale.set(1.05, 1.1, 1.05);
    afroVolume.position.set(0, 0.06, 0);
    hairGroup.add(afroVolume);
  }

  // ==========================================
  // 5. HIGH-QUALITY ACCESSORIES & MOTOR GEAR
  // ==========================================
  if (config.accessory === 'mechanic_cap') {
    const capGroup = new THREE.Group();
    // Crown
    const crown = new THREE.Mesh(
      new THREE.SphereGeometry(0.162, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.48),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
    );
    capGroup.add(crown);

    // Button on top of cap
    const capButton = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.01, 8),
      brassMat
    );
    capButton.position.y = 0.162;
    capGroup.add(capButton);

    // Curved tuner brim (worn backward)
    const brim = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.024, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 })
    );
    brim.position.set(0, 0.115, -0.17);
    brim.rotation.x = 0.22;
    capGroup.add(brim);

    headGroup.add(capGroup);
  } else if (config.accessory === 'safety_goggles') {
    const gogglesGroup = new THREE.Group();
    gogglesGroup.position.set(0, 0.115, 0.04);

    // Elastic adjustable strap
    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.155, 0.02, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 })
    );
    strap.rotation.x = Math.PI / 2;
    gogglesGroup.add(strap);

    // Twin amber-tinted industrial lenses with rubber gaskets
    [-0.052, 0.052].forEach((gx) => {
      const gasket = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.035, 16),
        new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.6 })
      );
      gasket.rotation.x = Math.PI / 2;
      gasket.position.set(gx, 0.02, 0.14);
      gogglesGroup.add(gasket);

      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.025, 16),
        new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          transparent: true,
          opacity: 0.8,
          roughness: 0.1,
          metalness: 0.25,
        })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(gx, 0.02, 0.152);
      gogglesGroup.add(lens);
    });

    headGroup.add(gogglesGroup);
  } else if (config.accessory === 'racing_shades') {
    const shadesGroup = new THREE.Group();
    shadesGroup.position.set(0, 0.038, 0.125);

    // Aerodynamic wraparound frame
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.028, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.7 })
    );
    shadesGroup.add(frame);

    // Mirrored iridium lenses
    [-0.05, 0.05].forEach((sx) => {
      const lens = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.03, 0.02),
        new THREE.MeshStandardMaterial({
          color: 0x0284c7,
          metalness: 0.95,
          roughness: 0.05,
        })
      );
      lens.position.set(sx, 0, 0.032);
      shadesGroup.add(lens);
    });

    headGroup.add(shadesGroup);
  } else if (config.accessory === 'aviator_glasses') {
    const aviatorGroup = new THREE.Group();
    aviatorGroup.position.set(0, 0.038, 0.132);

    [-0.05, 0.05].forEach((ax) => {
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.028, 0.005, 8, 16),
        brassMat
      );
      rim.position.set(ax, 0, 0.015);
      aviatorGroup.add(rim);

      const lens = new THREE.Mesh(
        new THREE.CircleGeometry(0.026, 12),
        new THREE.MeshStandardMaterial({
          color: 0x78350f,
          transparent: true,
          opacity: 0.65,
          roughness: 0.1,
          metalness: 0.5,
        })
      );
      lens.position.set(ax, 0, 0.015);
      aviatorGroup.add(lens);
    });

    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.005, 0.005),
      brassMat
    );
    bridge.position.set(0, 0.016, 0.015);
    aviatorGroup.add(bridge);

    headGroup.add(aviatorGroup);
  } else if (config.accessory === 'headphones') {
    // Over-ear workshop / tuner DJ headphones resting around neck
    const phonesGroup = new THREE.Group();
    phonesGroup.position.set(0, -0.08, 0);

    const headband = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.022, 8, 24, Math.PI * 1.1),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 })
    );
    headband.rotation.z = Math.PI * 0.95;
    headband.rotation.x = Math.PI / 2;
    phonesGroup.add(headband);

    // Earcups
    [-0.14, 0.14].forEach((px) => {
      const cup = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.035, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3, metalness: 0.6 })
      );
      cup.rotation.z = Math.PI / 2;
      cup.position.set(px, -0.01, 0.02);
      phonesGroup.add(cup);

      const cushion = new THREE.Mesh(
        new THREE.TorusGeometry(0.04, 0.015, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.8 })
      );
      cushion.rotation.y = Math.PI / 2;
      cushion.position.set(px * 0.95, -0.01, 0.02);
      phonesGroup.add(cushion);
    });

    headGroup.add(phonesGroup);
  } else if (config.accessory === 'chain_necklace') {
    const chain = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.01, 8, 24, Math.PI * 1.1),
      metalChromeMat
    );
    chain.position.set(0, -0.08, 0.02);
    chain.rotation.x = Math.PI * 0.45;
    chain.rotation.z = Math.PI * 0.95;
    headGroup.add(chain);
  } else if (config.accessory === 'bandana') {
    const bandana = new THREE.Mesh(
      new THREE.TorusGeometry(0.155, 0.026, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.75 })
    );
    bandana.rotation.x = Math.PI / 2;
    bandana.position.set(0, 0.09, 0);
    headGroup.add(bandana);
  } else if (config.accessory === 'face_mask') {
    // Tuner neoprene filter mask
    const mask = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.07, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 })
    );
    mask.position.set(0, -0.04, 0.15);
    headGroup.add(mask);

    // Filter valve
    const valve = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12),
      metalChromeMat
    );
    valve.rotation.x = Math.PI / 2;
    valve.position.set(0.03, -0.04, 0.17);
    headGroup.add(valve);
  }

  // ==========================================
  // 6. ARTICULATED HIGH-DETAIL LIMBS (ARMS & LEGS)
  // ==========================================
  const armThickness = 0.075 * limbThicknessScale;
  const legThickness = 0.095 * limbThicknessScale;

  const gloveMat = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.65,
    metalness: 0.15,
  });

  const activeHandMat = config.accessory === 'mechanic_gloves' ? gloveMat : skinMat;

  // --- LEFT ARM ---
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-chestW * 0.58, chestH * 0.92, 0);
  torso.add(leftArmPivot);

  // Anatomical shoulder deltoid cap (smooth bridge to torso)
  const leftDeltoid = new THREE.Mesh(
    new THREE.SphereGeometry(armThickness * 1.15, 14, 12),
    clothMat
  );
  leftDeltoid.scale.set(1.0, 1.25, 1.0);
  leftArmPivot.add(leftDeltoid);

  const leftUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(armThickness * 0.95, armThickness * 0.85, 0.28, 12),
    clothMat
  );
  leftUpperArm.position.y = -0.14;
  leftUpperArm.castShadow = true;
  leftArmPivot.add(leftUpperArm);

  const leftForearmPivot = new THREE.Group();
  leftForearmPivot.position.set(0, -0.28, 0);
  leftArmPivot.add(leftForearmPivot);

  // Forearm (skin or sleeve depending on clothing)
  const leftForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(armThickness * 0.85, armThickness * 0.72, 0.26, 12),
    skinMat
  );
  leftForearm.position.y = -0.13;
  leftForearm.castShadow = true;
  leftForearmPivot.add(leftForearm);

  // Mechanic Tattoos on Forearm
  if (config.skinDetail === 'tattoos') {
    const tatBand = new THREE.Mesh(
      new THREE.CylinderGeometry(armThickness * 0.86, armThickness * 0.73, 0.16, 12),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 })
    );
    tatBand.position.y = -0.12;
    leftForearmPivot.add(tatBand);
  }

  // Sculpted Hand (Palm + Thumb + 4 Curled Fingers)
  const leftHandGroup = new THREE.Group();
  leftHandGroup.position.set(0, -0.28, 0);
  leftForearmPivot.add(leftHandGroup);

  const leftPalm = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.075, 0.035),
    activeHandMat
  );
  leftPalm.position.set(0, -0.03, 0.01);
  leftHandGroup.add(leftPalm);

  // Thumb
  const leftThumb = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.012, 0.045, 8),
    activeHandMat
  );
  leftThumb.position.set(0.035, -0.02, 0.02);
  leftThumb.rotation.z = -0.4;
  leftHandGroup.add(leftThumb);

  // Knuckle armor if wearing mechanic gloves
  if (config.accessory === 'mechanic_gloves') {
    const knuckleGuard = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.018, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
    );
    knuckleGuard.position.set(0, -0.045, 0.025);
    leftHandGroup.add(knuckleGuard);
  }

  // --- RIGHT ARM ---
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(chestW * 0.58, chestH * 0.92, 0);
  torso.add(rightArmPivot);

  const rightDeltoid = new THREE.Mesh(
    new THREE.SphereGeometry(armThickness * 1.15, 14, 12),
    clothMat
  );
  rightDeltoid.scale.set(1.0, 1.25, 1.0);
  rightArmPivot.add(rightDeltoid);

  const rightUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(armThickness * 0.95, armThickness * 0.85, 0.28, 12),
    clothMat
  );
  rightUpperArm.position.y = -0.14;
  rightUpperArm.castShadow = true;
  rightArmPivot.add(rightUpperArm);

  const rightForearmPivot = new THREE.Group();
  rightForearmPivot.position.set(0, -0.28, 0);
  rightArmPivot.add(rightForearmPivot);

  const rightForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(armThickness * 0.85, armThickness * 0.72, 0.26, 12),
    skinMat
  );
  rightForearm.position.y = -0.13;
  rightForearm.castShadow = true;
  rightForearmPivot.add(rightForearm);

  const rightHandGroup = new THREE.Group();
  rightHandGroup.position.set(0, -0.28, 0);
  rightForearmPivot.add(rightHandGroup);

  const rightPalm = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.075, 0.035),
    activeHandMat
  );
  rightPalm.position.set(0, -0.03, 0.01);
  rightHandGroup.add(rightPalm);

  const rightThumb = new THREE.Mesh(
    new THREE.CylinderGeometry(0.014, 0.012, 0.045, 8),
    activeHandMat
  );
  rightThumb.position.set(-0.035, -0.02, 0.02);
  rightThumb.rotation.z = 0.4;
  rightHandGroup.add(rightThumb);

  if (config.accessory === 'mechanic_gloves') {
    const knuckleGuard = new THREE.Mesh(
      new THREE.BoxGeometry(0.065, 0.018, 0.015),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
    );
    knuckleGuard.position.set(0, -0.045, 0.025);
    rightHandGroup.add(knuckleGuard);
  }

  // --- LEFT LEG ---
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-hipWidth * 0.28, -0.06, 0);
  pelvis.add(leftLegPivot);

  const leftThigh = new THREE.Mesh(
    new THREE.CylinderGeometry(legThickness, legThickness * 0.85, 0.44, 14),
    pantsMat
  );
  leftThigh.position.y = -0.22;
  leftThigh.castShadow = true;
  leftLegPivot.add(leftThigh);

  const leftKneePivot = new THREE.Group();
  leftKneePivot.position.set(0, -0.44, 0);
  leftLegPivot.add(leftKneePivot);

  // Patella knee cap
  const leftPatella = new THREE.Mesh(
    new THREE.SphereGeometry(legThickness * 0.7, 10, 8),
    pantsMat
  );
  leftPatella.scale.set(1.0, 1.1, 0.6);
  leftPatella.position.set(0, 0, legThickness * 0.35);
  leftKneePivot.add(leftPatella);

  const leftCalf = new THREE.Mesh(
    new THREE.CylinderGeometry(legThickness * 0.85, legThickness * 0.74, 0.42, 14),
    pantsMat
  );
  leftCalf.position.y = -0.21;
  leftCalf.castShadow = true;
  leftKneePivot.add(leftCalf);

  // Multi-tier Heavy Work Boot
  const leftBootGroup = new THREE.Group();
  leftBootGroup.position.set(0, -0.42, 0.03);
  leftKneePivot.add(leftBootGroup);

  // Lugged rubber sole
  const leftSole = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.035, 0.24),
    bootSoleMat
  );
  leftSole.position.set(0, -0.02, 0.02);
  leftBootGroup.add(leftSole);

  // Boot upper leather
  const leftBootUpper = new THREE.Mesh(
    new THREE.BoxGeometry(0.115, 0.12, 0.22),
    bootLeatherMat
  );
  leftBootUpper.position.set(0, 0.04, 0.02);
  leftBootUpper.castShadow = true;
  leftBootGroup.add(leftBootUpper);

  // Steel toe cap
  const leftToeCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.5 })
  );
  leftToeCap.scale.set(0.95, 0.65, 1.1);
  leftToeCap.position.set(0, 0.01, 0.09);
  leftBootGroup.add(leftToeCap);

  // --- RIGHT LEG ---
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(hipWidth * 0.28, -0.06, 0);
  pelvis.add(rightLegPivot);

  const rightThigh = new THREE.Mesh(
    new THREE.CylinderGeometry(legThickness, legThickness * 0.85, 0.44, 14),
    pantsMat
  );
  rightThigh.position.y = -0.22;
  rightThigh.castShadow = true;
  rightLegPivot.add(rightThigh);

  const rightKneePivot = new THREE.Group();
  rightKneePivot.position.set(0, -0.44, 0);
  rightLegPivot.add(rightKneePivot);

  const rightPatella = new THREE.Mesh(
    new THREE.SphereGeometry(legThickness * 0.7, 10, 8),
    pantsMat
  );
  rightPatella.scale.set(1.0, 1.1, 0.6);
  rightPatella.position.set(0, 0, legThickness * 0.35);
  rightKneePivot.add(rightPatella);

  const rightCalf = new THREE.Mesh(
    new THREE.CylinderGeometry(legThickness * 0.85, legThickness * 0.74, 0.42, 14),
    pantsMat
  );
  rightCalf.position.y = -0.21;
  rightCalf.castShadow = true;
  rightKneePivot.add(rightCalf);

  const rightBootGroup = new THREE.Group();
  rightBootGroup.position.set(0, -0.42, 0.03);
  rightKneePivot.add(rightBootGroup);

  const rightSole = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.035, 0.24),
    bootSoleMat
  );
  rightSole.position.set(0, -0.02, 0.02);
  rightBootGroup.add(rightSole);

  const rightBootUpper = new THREE.Mesh(
    new THREE.BoxGeometry(0.115, 0.12, 0.22),
    bootLeatherMat
  );
  rightBootUpper.position.set(0, 0.04, 0.02);
  rightBootUpper.castShadow = true;
  rightBootGroup.add(rightBootUpper);

  const rightToeCap = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.5 })
  );
  rightToeCap.scale.set(0.95, 0.65, 1.1);
  rightToeCap.position.set(0, 0.01, 0.09);
  rightBootGroup.add(rightToeCap);

  // ==========================================
  // 7. ANIMATION STATE CONTROLLER (WALK, SPRINT, IDLE, POSES)
  // ==========================================
  let walkCycle = 0;
  let idleTime = 0;
  let currentPose: CharacterPreviewPose = 'hero';

  const setPose = (pose: CharacterPreviewPose) => {
    currentPose = pose;
  };

  const updateAnimation = (dt: number, isMoving: boolean, isSprinting: boolean) => {
    // If moving in open world or previewing walk cycle
    if (isMoving || currentPose === 'walk') {
      const animSpeed = isSprinting ? 15 : 9.5;
      walkCycle += dt * animSpeed;

      const legSwingAngle = (isSprinting ? 0.85 : 0.55) * Math.sin(walkCycle);
      const armSwingAngle = (isSprinting ? 0.95 : 0.6) * Math.sin(walkCycle);

      // Legs
      leftLegPivot.rotation.x = legSwingAngle;
      rightLegPivot.rotation.x = -legSwingAngle;

      leftKneePivot.rotation.x = Math.max(0, -Math.sin(walkCycle)) * (isSprinting ? 1.1 : 0.75);
      rightKneePivot.rotation.x = Math.max(0, Math.sin(walkCycle)) * (isSprinting ? 1.1 : 0.75);

      // Arms swing naturally
      leftArmPivot.rotation.x = -armSwingAngle;
      leftArmPivot.rotation.z = 0.05;
      rightArmPivot.rotation.x = armSwingAngle;
      rightArmPivot.rotation.z = -0.05;

      leftForearmPivot.rotation.x = Math.max(0.15, -armSwingAngle * 0.45);
      rightForearmPivot.rotation.x = Math.max(0.15, armSwingAngle * 0.45);

      // Pelvis natural vertical bounce & torso sway
      pelvis.position.y = 0.96 * heightScale + Math.abs(Math.sin(walkCycle)) * 0.04;
      torso.rotation.y = Math.sin(walkCycle) * 0.08;
    } else {
      idleTime += dt * 2.0;

      if (currentPose === 'hero') {
        // Confident mechanic posture: hands resting near belt hips, shoulders relaxed back
        leftLegPivot.rotation.x = THREE.MathUtils.lerp(leftLegPivot.rotation.x, 0.06, dt * 8);
        rightLegPivot.rotation.x = THREE.MathUtils.lerp(rightLegPivot.rotation.x, -0.06, dt * 8);
        leftKneePivot.rotation.x = THREE.MathUtils.lerp(leftKneePivot.rotation.x, 0, dt * 8);
        rightKneePivot.rotation.x = THREE.MathUtils.lerp(rightKneePivot.rotation.x, 0, dt * 8);

        // Arms akimbo / relaxed near belt
        leftArmPivot.rotation.x = THREE.MathUtils.lerp(leftArmPivot.rotation.x, 0.15, dt * 8);
        leftArmPivot.rotation.z = THREE.MathUtils.lerp(leftArmPivot.rotation.z, 0.28, dt * 8);
        rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, 0.15, dt * 8);
        rightArmPivot.rotation.z = THREE.MathUtils.lerp(rightArmPivot.rotation.z, -0.28, dt * 8);

        leftForearmPivot.rotation.x = THREE.MathUtils.lerp(leftForearmPivot.rotation.x, 0.45, dt * 8);
        rightForearmPivot.rotation.x = THREE.MathUtils.lerp(rightForearmPivot.rotation.x, 0.45, dt * 8);

        // Breathing chest rise
        pelvis.position.y = THREE.MathUtils.lerp(pelvis.position.y, 0.96 * heightScale, dt * 8);
        torso.position.y = 0.12 + Math.sin(idleTime) * 0.007;
        torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, 0, dt * 8);
      } else if (currentPose === 'inspect') {
        // Crossed arms inspecting engine/tuner bay
        leftLegPivot.rotation.x = THREE.MathUtils.lerp(leftLegPivot.rotation.x, 0, dt * 8);
        rightLegPivot.rotation.x = THREE.MathUtils.lerp(rightLegPivot.rotation.x, 0, dt * 8);

        leftArmPivot.rotation.x = THREE.MathUtils.lerp(leftArmPivot.rotation.x, 0.65, dt * 8);
        leftArmPivot.rotation.z = THREE.MathUtils.lerp(leftArmPivot.rotation.z, 0.35, dt * 8);
        rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, 0.65, dt * 8);
        rightArmPivot.rotation.z = THREE.MathUtils.lerp(rightArmPivot.rotation.z, -0.35, dt * 8);

        leftForearmPivot.rotation.x = THREE.MathUtils.lerp(leftForearmPivot.rotation.x, 1.1, dt * 8);
        rightForearmPivot.rotation.x = THREE.MathUtils.lerp(rightForearmPivot.rotation.x, 1.1, dt * 8);

        pelvis.position.y = THREE.MathUtils.lerp(pelvis.position.y, 0.96 * heightScale, dt * 8);
        torso.position.y = 0.12 + Math.sin(idleTime) * 0.007;
      }
    }
  };

  const dispose = () => {
    eyeTexture.dispose();
    twillBumpMap.dispose();
    root.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose());
        } else if (mesh.material) {
          mesh.material.dispose();
        }
      }
    });
  };

  return {
    group: root,
    updateAnimation,
    setPose,
    dispose,
  };
}
