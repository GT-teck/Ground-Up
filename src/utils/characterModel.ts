import * as THREE from 'three';
import {
  CharacterCustomization,
  CharacterRace,
  CharacterHairColor,
} from '../types';

export const SKIN_TONES: Record<CharacterRace, { hex: number; name: string; css: string }> = {
  fair: { hex: 0xf6d6bd, name: 'Fair / Ivory', css: '#f6d6bd' },
  tan: { hex: 0xdf9f7a, name: 'Tan / Olive', css: '#df9f7a' },
  warm_brown: { hex: 0xa66c48, name: 'Warm Bronze', css: '#a66c48' },
  deep_bronze: { hex: 0x5a3928, name: 'Deep Espresso', css: '#5a3928' },
  golden_fair: { hex: 0xf5ce9f, name: 'Golden Almond', css: '#f5ce9f' },
};

export const HAIR_COLORS: Record<CharacterHairColor, { hex: number; name: string; css: string }> = {
  black: { hex: 0x18181b, name: 'Jet Black', css: '#18181b' },
  dark_brown: { hex: 0x382214, name: 'Dark Brown', css: '#382214' },
  chestnut: { hex: 0x6e3b1c, name: 'Chestnut', css: '#6e3b1c' },
  blonde: { hex: 0xeab308, name: 'Sunburst Blonde', css: '#eab308' },
  auburn: { hex: 0x991b1b, name: 'Auburn Red', css: '#991b1b' },
  silver: { hex: 0x94a3b8, name: 'Silver Platinum', css: '#94a3b8' },
  electric_blue: { hex: 0x06b6d4, name: 'Tuner Cyan', css: '#06b6d4' },
};

export const DEFAULT_CHARACTER: CharacterCustomization = {
  name: 'Alex Rivera',
  gender: 'male',
  race: 'tan',
  bodyType: 'athletic',
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
  dispose: () => void;
}

/**
 * Procedurally builds a human character mesh with natural anatomy,
 * defined facial structure, hair styles, accessories, and articulated limb rigging.
 */
export function createHumanCharacter(config: CharacterCustomization): CharacterRig {
  const root = new THREE.Group();
  root.name = 'HumanCharacterRoot';

  // Body scale modifiers
  let shoulderWidthScale = 1.0;
  let chestDepthScale = 1.0;
  let limbThicknessScale = 1.0;
  let waistWidthScale = 1.0;

  if (config.bodyType === 'muscular') {
    shoulderWidthScale = 1.22;
    chestDepthScale = 1.18;
    limbThicknessScale = 1.15;
    waistWidthScale = 1.05;
  } else if (config.bodyType === 'slim') {
    shoulderWidthScale = 0.92;
    chestDepthScale = 0.88;
    limbThicknessScale = 0.88;
    waistWidthScale = 0.86;
  } else if (config.bodyType === 'heavy') {
    shoulderWidthScale = 1.15;
    chestDepthScale = 1.3;
    limbThicknessScale = 1.2;
    waistWidthScale = 1.28;
  }

  if (config.gender === 'female') {
    shoulderWidthScale *= 0.92;
    waistWidthScale *= 0.88;
  }

  // Materials
  const skinHex = SKIN_TONES[config.race]?.hex || 0xdf9f7a;
  const skinMat = new THREE.MeshStandardMaterial({
    color: skinHex,
    roughness: 0.65,
    metalness: 0.05,
  });

  const hairHex = HAIR_COLORS[config.hairColor]?.hex || 0x382214;
  const hairMat = new THREE.MeshStandardMaterial({
    color: hairHex,
    roughness: 0.75,
    metalness: 0.1,
  });

  const clothingColorHex = parseInt(config.clothingColor.replace('#', '0x'), 16) || 0x0284c7;
  const clothMat = new THREE.MeshStandardMaterial({
    color: clothingColorHex,
    roughness: 0.7,
    metalness: 0.05,
  });

  const pantsColorHex = parseInt(config.pantsColor.replace('#', '0x'), 16) || 0x1e293b;
  const pantsMat = new THREE.MeshStandardMaterial({
    color: pantsColorHex,
    roughness: 0.8,
    metalness: 0.05,
  });

  const bootMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.5,
    metalness: 0.2,
  });

  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
  const irisMat = new THREE.MeshBasicMaterial({ color: 0x1e293b });
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0x991b1b });
  const metalAccentMat = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    metalness: 0.85,
    roughness: 0.25,
  });

  // ==========================================
  // 1. PELVIS / HIPS
  // ==========================================
  const pelvis = new THREE.Group();
  pelvis.position.set(0, 0.95, 0);
  root.add(pelvis);

  const hipWidth = 0.28 * waistWidthScale;
  const pelvisMesh = new THREE.Mesh(
    new THREE.BoxGeometry(hipWidth, 0.18, 0.22 * chestDepthScale),
    pantsMat
  );
  pelvisMesh.castShadow = true;
  pelvis.add(pelvisMesh);

  // Belt & Buckle
  const beltMesh = new THREE.Mesh(
    new THREE.BoxGeometry(hipWidth + 0.02, 0.05, 0.23 * chestDepthScale),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 })
  );
  beltMesh.position.y = 0.07;
  pelvis.add(beltMesh);

  const buckleMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, 0.06, 0.03),
    metalAccentMat
  );
  buckleMesh.position.set(0, 0.07, 0.12 * chestDepthScale);
  pelvis.add(buckleMesh);

  // Tool Belt Accessory if selected
  if (config.accessory === 'tool_belt') {
    const pouchMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.12, 0.07),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
    );
    pouchMesh.position.set(hipWidth * 0.52, 0.03, 0.02);
    pelvis.add(pouchMesh);

    // Mini wrench sticking out of pouch
    const wrenchMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.14, 0.015),
      metalAccentMat
    );
    wrenchMesh.position.set(hipWidth * 0.52, 0.09, 0.02);
    wrenchMesh.rotation.z = 0.2;
    pelvis.add(wrenchMesh);
  }

  // ==========================================
  // 2. TORSO / CHEST
  // ==========================================
  const torso = new THREE.Group();
  torso.position.set(0, 0.12, 0);
  pelvis.add(torso);

  const chestW = (config.gender === 'female' ? 0.32 : 0.36) * shoulderWidthScale;
  const chestD = 0.24 * chestDepthScale;
  const chestH = 0.44;

  const chestMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(chestW * 0.5, hipWidth * 0.48, chestH, 10),
    clothMat
  );
  chestMesh.position.y = chestH * 0.5;
  chestMesh.castShadow = true;
  torso.add(chestMesh);

  // Clothing details (collar/jacket lapels/hoodie pocket)
  if (config.clothing === 'leather_jacket') {
    // Jacket zipper / inner shirt
    const innerShirt = new THREE.Mesh(
      new THREE.BoxGeometry(chestW * 0.35, chestH * 0.8, 0.03),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.8 })
    );
    innerShirt.position.set(0, chestH * 0.5, chestD * 0.46);
    torso.add(innerShirt);

    // Jacket collar
    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(chestW * 0.28, 0.035, 8, 12, Math.PI),
      clothMat
    );
    collar.position.set(0, chestH * 0.96, 0.02);
    collar.rotation.x = Math.PI / 2;
    torso.add(collar);
  } else if (config.clothing === 'racing_hoodie') {
    // Kangaroo pouch pocket
    const pocket = new THREE.Mesh(
      new THREE.BoxGeometry(chestW * 0.6, 0.14, 0.04),
      clothMat
    );
    pocket.position.set(0, chestH * 0.3, chestD * 0.46);
    torso.add(pocket);

    // Hood resting on back
    const hoodMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 8, 8),
      clothMat
    );
    hoodMesh.scale.set(1.1, 0.7, 0.8);
    hoodMesh.position.set(0, chestH * 0.85, -chestD * 0.45);
    torso.add(hoodMesh);
  } else if (config.clothing === 'mechanic_overalls') {
    // Overall bib straps & brass buttons
    [-chestW * 0.25, chestW * 0.25].forEach((sx) => {
      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, chestH * 0.85, 0.02),
        pantsMat
      );
      strap.position.set(sx, chestH * 0.5, chestD * 0.46);
      torso.add(strap);

      const button = new THREE.Mesh(
        new THREE.CylinderGeometry(0.018, 0.018, 0.015, 8),
        metalAccentMat
      );
      button.rotation.x = Math.PI / 2;
      button.position.set(sx, chestH * 0.75, chestD * 0.48);
      torso.add(button);
    });
  }

  // ==========================================
  // 3. NECK & HEAD & FACE
  // ==========================================
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07, 0.08, 0.12, 8),
    skinMat
  );
  neck.position.set(0, chestH + 0.05, 0);
  torso.add(neck);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, chestH + 0.22, 0);
  torso.add(headGroup);

  // Skull / Head base (shaped with cranium & jaw)
  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.145, 16, 14),
    skinMat
  );
  headMesh.scale.set(0.95, 1.08, 1.0);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Chin / Jawline definition
  const chinMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.08, 0.09),
    skinMat
  );
  chinMesh.position.set(0, -0.09, 0.06);
  headGroup.add(chinMesh);

  // Ears
  [-0.14, 0.14].forEach((ex) => {
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 8, 8),
      skinMat
    );
    ear.scale.set(0.4, 1.2, 0.7);
    ear.position.set(ex, 0.01, 0.01);
    headGroup.add(ear);
  });

  // Nose
  const nose = new THREE.Mesh(
    new THREE.ConeGeometry(0.026, 0.06, 6),
    skinMat
  );
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.01, 0.155);
  headGroup.add(nose);

  // Eyes (Left & Right)
  [-0.048, 0.048].forEach((eyeX) => {
    const eyeSclera = new THREE.Mesh(
      new THREE.SphereGeometry(0.02, 8, 8),
      eyeWhiteMat
    );
    eyeSclera.scale.set(1.0, 0.6, 0.5);
    eyeSclera.position.set(eyeX, 0.038, 0.138);
    headGroup.add(eyeSclera);

    const pupil = new THREE.Mesh(
      new THREE.SphereGeometry(0.011, 8, 8),
      irisMat
    );
    pupil.position.set(eyeX, 0.038, 0.148);
    headGroup.add(pupil);

    // Eyebrows
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.045, 0.012, 0.015),
      hairMat
    );
    brow.position.set(eyeX, 0.065, 0.138);
    brow.rotation.z = (eyeX > 0 ? -1 : 1) * 0.12;
    headGroup.add(brow);
  });

  // Mouth
  const mouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.012, 0.015),
    mouthMat
  );
  mouth.position.set(0, -0.05, 0.138);
  headGroup.add(mouth);

  // Facial Hair (for male or unisex)
  if (config.gender !== 'female') {
    if (config.facialHair === 'stubble') {
      const stubble = new THREE.Mesh(
        new THREE.SphereGeometry(0.147, 12, 10, 0, Math.PI * 2, Math.PI * 0.45, Math.PI * 0.3),
        new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.9, opacity: 0.55, transparent: true })
      );
      stubble.position.set(0, -0.02, 0.01);
      headGroup.add(stubble);
    } else if (config.facialHair === 'beard') {
      const beard = new THREE.Mesh(
        new THREE.BoxGeometry(0.12, 0.11, 0.11),
        hairMat
      );
      beard.position.set(0, -0.08, 0.08);
      headGroup.add(beard);
    } else if (config.facialHair === 'goatee') {
      const goatee = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.07, 0.06),
        hairMat
      );
      goatee.position.set(0, -0.08, 0.1);
      headGroup.add(goatee);
    } else if (config.facialHair === 'mustache') {
      const stache = new THREE.Mesh(
        new THREE.BoxGeometry(0.075, 0.022, 0.025),
        hairMat
      );
      stache.position.set(0, -0.03, 0.148);
      headGroup.add(stache);
    }
  }

  // ==========================================
  // 4. HAIRSTYLES
  // ==========================================
  const hairGroup = new THREE.Group();
  headGroup.add(hairGroup);

  if (config.hairStyle === 'buzz') {
    const buzzMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.152, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
      hairMat
    );
    buzzMesh.scale.set(0.96, 1.05, 1.0);
    hairGroup.add(buzzMesh);
  } else if (config.hairStyle === 'quiff') {
    // Base hair cap
    const baseCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.152, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.5),
      hairMat
    );
    hairGroup.add(baseCap);

    // Pompadour / Quiff Volume on top
    const quiffTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.09, 0.2),
      hairMat
    );
    quiffTop.position.set(0, 0.15, 0.04);
    quiffTop.rotation.x = -0.22;
    hairGroup.add(quiffTop);
  } else if (config.hairStyle === 'side_part') {
    const partCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.154, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
      hairMat
    );
    hairGroup.add(partCap);

    const partSwoop = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.06, 0.22),
      hairMat
    );
    partSwoop.position.set(0.03, 0.14, 0.01);
    partSwoop.rotation.z = -0.15;
    hairGroup.add(partSwoop);
  } else if (config.hairStyle === 'ponytail') {
    const ponyCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.152, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    hairGroup.add(ponyCap);

    // Ponytail trailing down
    const ponyTail = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.02, 0.32, 8),
      hairMat
    );
    ponyTail.position.set(0, 0.02, -0.2);
    ponyTail.rotation.x = 0.6;
    hairGroup.add(ponyTail);

    const hairTie = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.015, 6, 8),
      new THREE.MeshStandardMaterial({ color: 0xef4444 })
    );
    hairTie.position.set(0, 0.1, -0.16);
    hairTie.rotation.x = 0.6;
    hairGroup.add(hairTie);
  } else if (config.hairStyle === 'curly_fade') {
    // Tapered base
    const fadeBase = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.45),
      hairMat
    );
    hairGroup.add(fadeBase);

    // Textured curls
    for (let c = 0; c < 7; c++) {
      const curl = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 6, 6),
        hairMat
      );
      curl.position.set(
        (Math.sin(c * 1.2) * 0.08),
        0.13 + Math.cos(c) * 0.02,
        (Math.cos(c * 1.2) * 0.08)
      );
      hairGroup.add(curl);
    }
  } else if (config.hairStyle === 'wavy_long') {
    const longTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.154, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    hairGroup.add(longTop);

    // Left and Right draping locks
    [-0.14, 0.14].forEach((lx) => {
      const lock = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.03, 0.35, 8),
        hairMat
      );
      lock.position.set(lx, -0.08, 0.02);
      lock.rotation.z = (lx > 0 ? -1 : 1) * 0.15;
      hairGroup.add(lock);
    });
  }

  // ==========================================
  // 5. ACCESSORIES (Headwear, Eyewear, etc.)
  // ==========================================
  if (config.accessory === 'mechanic_cap') {
    const capGroup = new THREE.Group();
    // Cap crown
    const capCrown = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.48),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 })
    );
    capGroup.add(capCrown);

    // Cap brim facing forward or backward (backward tuner style)
    const brim = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.025, 0.14),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7 })
    );
    brim.position.set(0, 0.12, -0.16);
    brim.rotation.x = 0.2;
    capGroup.add(brim);

    headGroup.add(capGroup);
  } else if (config.accessory === 'safety_goggles') {
    const gogglesGroup = new THREE.Group();
    gogglesGroup.position.set(0, 0.12, 0.04);

    // Strap around head
    const strap = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.02, 6, 14),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    strap.rotation.x = Math.PI / 2;
    gogglesGroup.add(strap);

    // Clear yellow/amber tinted protective lenses
    [-0.05, 0.05].forEach((gx) => {
      const lens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.042, 0.03, 10),
        new THREE.MeshStandardMaterial({
          color: 0xfacc15,
          transparent: true,
          opacity: 0.75,
          roughness: 0.1,
          metalness: 0.2,
        })
      );
      lens.rotation.x = Math.PI / 2;
      lens.position.set(gx, 0.02, 0.14);
      gogglesGroup.add(lens);
    });

    headGroup.add(gogglesGroup);
  } else if (config.accessory === 'racing_shades') {
    const shadesGroup = new THREE.Group();
    shadesGroup.position.set(0, 0.038, 0.12);

    const shadeBridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.03, 0.06),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.8 })
    );
    shadesGroup.add(shadeBridge);

    // Dark polarized lenses
    [-0.048, 0.048].forEach((sx) => {
      const lens = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.032, 0.02),
        new THREE.MeshStandardMaterial({ color: 0x020617, roughness: 0.05, metalness: 0.9 })
      );
      lens.position.set(sx, 0, 0.03);
      shadesGroup.add(lens);
    });

    headGroup.add(shadesGroup);
  } else if (config.accessory === 'aviator_glasses') {
    const aviatorGroup = new THREE.Group();
    aviatorGroup.position.set(0, 0.038, 0.13);

    [-0.048, 0.048].forEach((ax) => {
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.026, 0.005, 6, 12),
        metalAccentMat
      );
      rim.position.set(ax, 0, 0.015);
      aviatorGroup.add(rim);
    });

    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.006, 0.006),
      metalAccentMat
    );
    bridge.position.set(0, 0.015, 0.015);
    aviatorGroup.add(bridge);

    headGroup.add(aviatorGroup);
  } else if (config.accessory === 'bandana') {
    const bandana = new THREE.Mesh(
      new THREE.TorusGeometry(0.152, 0.025, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 })
    );
    bandana.rotation.x = Math.PI / 2;
    bandana.position.set(0, 0.09, 0);
    headGroup.add(bandana);
  }

  // ==========================================
  // 6. ARTICULATED LIMBS (ARMS & LEGS WITH PIVOTS)
  // ==========================================
  const armThickness = 0.075 * limbThicknessScale;
  const legThickness = 0.095 * limbThicknessScale;

  const handMat = config.accessory === 'mechanic_gloves'
    ? new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.7 })
    : skinMat;

  // --- LEFT ARM ---
  const leftArmPivot = new THREE.Group();
  leftArmPivot.position.set(-chestW * 0.58, chestH * 0.92, 0);
  torso.add(leftArmPivot);

  const leftUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(armThickness, armThickness * 0.85, 0.28, 8),
    clothMat
  );
  leftUpperArm.position.y = -0.14;
  leftUpperArm.castShadow = true;
  leftArmPivot.add(leftUpperArm);

  const leftForearmPivot = new THREE.Group();
  leftForearmPivot.position.set(0, -0.28, 0);
  leftArmPivot.add(leftForearmPivot);

  const leftForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(armThickness * 0.85, armThickness * 0.75, 0.26, 8),
    skinMat
  );
  leftForearm.position.y = -0.13;
  leftForearm.castShadow = true;
  leftForearmPivot.add(leftForearm);

  const leftHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.08, 0.04),
    handMat
  );
  leftHand.position.set(0, -0.29, 0.01);
  leftForearmPivot.add(leftHand);

  // --- RIGHT ARM ---
  const rightArmPivot = new THREE.Group();
  rightArmPivot.position.set(chestW * 0.58, chestH * 0.92, 0);
  torso.add(rightArmPivot);

  const rightUpperArm = new THREE.Mesh(
    new THREE.CylinderGeometry(armThickness, armThickness * 0.85, 0.28, 8),
    clothMat
  );
  rightUpperArm.position.y = -0.14;
  rightUpperArm.castShadow = true;
  rightArmPivot.add(rightUpperArm);

  const rightForearmPivot = new THREE.Group();
  rightForearmPivot.position.set(0, -0.28, 0);
  rightArmPivot.add(rightForearmPivot);

  const rightForearm = new THREE.Mesh(
    new THREE.CylinderGeometry(armThickness * 0.85, armThickness * 0.75, 0.26, 8),
    skinMat
  );
  rightForearm.position.y = -0.13;
  rightForearm.castShadow = true;
  rightForearmPivot.add(rightForearm);

  const rightHand = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.08, 0.04),
    handMat
  );
  rightHand.position.set(0, -0.29, 0.01);
  rightForearmPivot.add(rightHand);

  // --- LEFT LEG ---
  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-hipWidth * 0.28, -0.06, 0);
  pelvis.add(leftLegPivot);

  const leftThigh = new THREE.Mesh(
    new THREE.CylinderGeometry(legThickness, legThickness * 0.85, 0.44, 8),
    pantsMat
  );
  leftThigh.position.y = -0.22;
  leftThigh.castShadow = true;
  leftLegPivot.add(leftThigh);

  const leftKneePivot = new THREE.Group();
  leftKneePivot.position.set(0, -0.44, 0);
  leftLegPivot.add(leftKneePivot);

  const leftCalf = new THREE.Mesh(
    new THREE.CylinderGeometry(legThickness * 0.85, legThickness * 0.75, 0.42, 8),
    pantsMat
  );
  leftCalf.position.y = -0.21;
  leftCalf.castShadow = true;
  leftKneePivot.add(leftCalf);

  const leftBoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.12, 0.22),
    bootMat
  );
  leftBoot.position.set(0, -0.44, 0.04);
  leftBoot.castShadow = true;
  leftKneePivot.add(leftBoot);

  // --- RIGHT LEG ---
  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(hipWidth * 0.28, -0.06, 0);
  pelvis.add(rightLegPivot);

  const rightThigh = new THREE.Mesh(
    new THREE.CylinderGeometry(legThickness, legThickness * 0.85, 0.44, 8),
    pantsMat
  );
  rightThigh.position.y = -0.22;
  rightThigh.castShadow = true;
  rightLegPivot.add(rightThigh);

  const rightKneePivot = new THREE.Group();
  rightKneePivot.position.set(0, -0.44, 0);
  rightLegPivot.add(rightKneePivot);

  const rightCalf = new THREE.Mesh(
    new THREE.CylinderGeometry(legThickness * 0.85, legThickness * 0.75, 0.42, 8),
    pantsMat
  );
  rightCalf.position.y = -0.21;
  rightCalf.castShadow = true;
  rightKneePivot.add(rightCalf);

  const rightBoot = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.12, 0.22),
    bootMat
  );
  rightBoot.position.set(0, -0.44, 0.04);
  rightBoot.castShadow = true;
  rightKneePivot.add(rightBoot);

  // ==========================================
  // 7. ANIMATION STATE CONTROLLER
  // ==========================================
  let walkCycle = 0;
  let idleTime = 0;

  const updateAnimation = (dt: number, isMoving: boolean, isSprinting: boolean) => {
    if (isMoving) {
      const animSpeed = isSprinting ? 15 : 9.5;
      walkCycle += dt * animSpeed;

      const legSwingAngle = (isSprinting ? 0.85 : 0.55) * Math.sin(walkCycle);
      const armSwingAngle = (isSprinting ? 0.95 : 0.6) * Math.sin(walkCycle);

      // Legs swing back and forth
      leftLegPivot.rotation.x = legSwingAngle;
      rightLegPivot.rotation.x = -legSwingAngle;

      // Knee bend when leg moves back
      leftKneePivot.rotation.x = Math.max(0, -Math.sin(walkCycle)) * (isSprinting ? 1.1 : 0.75);
      rightKneePivot.rotation.x = Math.max(0, Math.sin(walkCycle)) * (isSprinting ? 1.1 : 0.75);

      // Arms swing in opposition to legs (natural human gait)
      leftArmPivot.rotation.x = -armSwingAngle;
      rightArmPivot.rotation.x = armSwingAngle;

      // Forearm dynamic natural flex
      leftForearmPivot.rotation.x = Math.max(0.15, -armSwingAngle * 0.45);
      rightForearmPivot.rotation.x = Math.max(0.15, armSwingAngle * 0.45);

      // Gentle vertical pelvis bounce
      pelvis.position.y = 0.95 + Math.abs(Math.sin(walkCycle)) * 0.04;
      torso.rotation.y = Math.sin(walkCycle) * 0.08;
    } else {
      // Idle breathing & relaxed posture
      idleTime += dt * 2.0;

      // Smooth lerp limbs back toward natural resting pose
      leftLegPivot.rotation.x = THREE.MathUtils.lerp(leftLegPivot.rotation.x, 0, dt * 10);
      rightLegPivot.rotation.x = THREE.MathUtils.lerp(rightLegPivot.rotation.x, 0, dt * 10);
      leftKneePivot.rotation.x = THREE.MathUtils.lerp(leftKneePivot.rotation.x, 0, dt * 10);
      rightKneePivot.rotation.x = THREE.MathUtils.lerp(rightKneePivot.rotation.x, 0, dt * 10);

      // Gentle arm rest with slight outward flare
      leftArmPivot.rotation.x = THREE.MathUtils.lerp(leftArmPivot.rotation.x, 0.05, dt * 8);
      leftArmPivot.rotation.z = THREE.MathUtils.lerp(leftArmPivot.rotation.z, 0.08, dt * 8);
      rightArmPivot.rotation.x = THREE.MathUtils.lerp(rightArmPivot.rotation.x, 0.05, dt * 8);
      rightArmPivot.rotation.z = THREE.MathUtils.lerp(rightArmPivot.rotation.z, -0.08, dt * 8);

      leftForearmPivot.rotation.x = THREE.MathUtils.lerp(leftForearmPivot.rotation.x, 0.1, dt * 8);
      rightForearmPivot.rotation.x = THREE.MathUtils.lerp(rightForearmPivot.rotation.x, 0.1, dt * 8);

      // Breathing expansion
      pelvis.position.y = THREE.MathUtils.lerp(pelvis.position.y, 0.95, dt * 8);
      torso.position.y = 0.12 + Math.sin(idleTime) * 0.008;
      torso.rotation.y = THREE.MathUtils.lerp(torso.rotation.y, 0, dt * 8);
    }
  };

  const dispose = () => {
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
    dispose,
  };
}
