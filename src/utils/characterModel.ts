import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import {
  CharacterCustomization,
  CharacterRace,
  CharacterHairColor,
  CharacterEyeColor,
  CharacterPreviewPose,
  CharacterHairstyle,
  CharacterFacialHair,
  CharacterAccessory,
  CharacterClothing,
  CharacterSkinDetail,
} from '../types';

export const SKIN_TONES: Record<
  CharacterRace,
  { hex: number; name: string; css: string; subHex: number; lipHex: number }
> = {
  fair: { hex: 0xf6d6bd, name: 'Fair / Ivory', css: '#f6d6bd', subHex: 0xfce7d2, lipHex: 0xd9777f },
  tan: { hex: 0xdf9f7a, name: 'Tan / Olive', css: '#df9f7a', subHex: 0xe8ad89, lipHex: 0xb45349 },
  warm_brown: { hex: 0xa66c48, name: 'Warm Bronze', css: '#a66c48', subHex: 0xb57b56, lipHex: 0x8c4238 },
  deep_bronze: { hex: 0x5a3928, name: 'Deep Espresso', css: '#5a3928', subHex: 0x6e4732, lipHex: 0x522722 },
  golden_fair: { hex: 0xf5ce9f, name: 'Golden Almond', css: '#f5ce9f', subHex: 0xfae0b8, lipHex: 0xc26558 },
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
  accessory: 'none',
  clothing: 'mechanic_overalls',
  clothingColor: '#0284c7',
  pantsColor: '#1e293b',
};

export interface CharacterRig {
  group: THREE.Group;
  updateAnimation: (dt: number, isMoving: boolean, isSprinting: boolean) => void;
  setPose: (pose: CharacterPreviewPose) => void;
  dispose: () => void;
}

// ---------------------------------------------------------------------------
// 3D HUMAN BODY GLB LOADER & CACHE SINGLETON
// ---------------------------------------------------------------------------

interface CachedHumanModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

let cachedModel: CachedHumanModel | null = null;
let loadPromise: Promise<CachedHumanModel> | null = null;

export function preloadHumanModel(): Promise<CachedHumanModel> {
  if (cachedModel) return Promise.resolve(cachedModel);
  if (loadPromise) return loadPromise;

  const loader = new GLTFLoader();
  const primaryUrl = '/models/human_body.glb';
  const fallbackUrl = 'https://threejs.org/examples/models/gltf/Xbot.glb';

  loadPromise = new Promise<CachedHumanModel>((resolve) => {
    loader.load(
      primaryUrl,
      (gltf) => {
        cachedModel = {
          scene: gltf.scene,
          animations: gltf.animations,
        };
        resolve(cachedModel);
      },
      undefined,
      (err) => {
        console.warn('Primary GLB model load failed, attempting fallback CDN...', err);
        loader.load(
          fallbackUrl,
          (gltf) => {
            cachedModel = {
              scene: gltf.scene,
              animations: gltf.animations,
            };
            resolve(cachedModel);
          },
          undefined,
          (err2) => {
            console.error('Failed to load human body 3D model:', err2);
            const emptyGroup = new THREE.Group();
            cachedModel = { scene: emptyGroup, animations: [] };
            resolve(cachedModel);
          }
        );
      }
    );
  });

  return loadPromise;
}

// Kick off preload immediately
preloadHumanModel();

// Helper to tag procedural meshes for safe instance disposal
function tagInstanceMesh<T extends THREE.Object3D>(obj: T): T {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.userData.isInstanceGeometry = true;
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return obj;
}

// ---------------------------------------------------------------------------
// ENHANCED FACIAL FEATURES (HIGH-FIDELITY EYES, EYEBROWS, NOSE, LIPS)
// Coordinates aligned with actual human skull bounds:
// Head bone pivot: y=0 (neck level)
// Chin: y=0.005, z=0.135
// Mouth: y=0.026 to 0.035, z=0.140
// Nose: y=0.052 to 0.076, z=0.144
// Eyes: y=0.066, z=0.128, x=±0.033
// Eyebrows: y=0.088, z=0.138, x=±0.022 to ±0.068
// ---------------------------------------------------------------------------

function createDetailedFaceFeatures(
  skinHex: number,
  eyeHex: number,
  hairHex: number,
  lipHex: number,
  gender: string
): THREE.Group {
  const faceGroup = new THREE.Group();
  faceGroup.name = 'DetailedFaceFeatures';

  const skinMat = new THREE.MeshStandardMaterial({
    color: skinHex,
    roughness: 0.62,
    metalness: 0.04,
  });

  // Eyebrows: Arched, stylized procedural curves conforming to brow ridge
  // Darker tone for brows even if hair is bleached or neon
  const browTone = hairHex === 0x06b6d4 || hairHex === 0xec4899 || hairHex === 0x84cc16 || hairHex === 0x8b5cf6
    ? 0x27272a
    : hairHex;

  const browMat = new THREE.MeshStandardMaterial({
    color: browTone,
    roughness: 0.82,
    metalness: 0.06,
  });

  [-1, 1].forEach((side) => {
    // Feminine brows are higher arched and slightly thinner; masculine are fuller and straighter
    const browYOffset = gender === 'female' ? 0.003 : 0.0;
    const browThick = gender === 'female' ? 0.003 : 0.0042;

    const p1 = new THREE.Vector3(side * 0.021, 0.087 + browYOffset, 0.138);
    const p2 = new THREE.Vector3(side * 0.046, 0.093 + browYOffset, 0.135);
    const p3 = new THREE.Vector3(side * 0.068, 0.086 + browYOffset, 0.129);

    const curve = new THREE.CatmullRomCurve3([p1, p2, p3]);
    const brow = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, browThick, 6, false), browMat);
    faceGroup.add(brow);
  });

  // Eyes: 3D anatomical structure with sclera, limbal ring, iris, pupil, specular gleam & eyelids
  const scleraMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.15,
    metalness: 0.08,
  });

  const limbalRingMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const irisMat = new THREE.MeshStandardMaterial({
    color: eyeHex,
    roughness: 0.12,
    metalness: 0.18,
  });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
  const gleamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const lashMat = new THREE.MeshBasicMaterial({ color: 0x18181b });

  [-0.033, 0.033].forEach((xPos) => {
    const eye = new THREE.Group();
    eye.position.set(xPos, 0.066, 0.128);

    // Sclera eyeball
    const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.012, 16, 12), scleraMat);
    sclera.scale.set(1.15, 0.85, 0.65);
    eye.add(sclera);

    // Dark limbal ring around iris
    const limbalRing = new THREE.Mesh(new THREE.RingGeometry(0.0068, 0.0078, 20), limbalRingMat);
    limbalRing.position.set(0, 0, 0.0058);
    eye.add(limbalRing);

    // Vibrant iris disc
    const iris = new THREE.Mesh(new THREE.CircleGeometry(0.0072, 20), irisMat);
    iris.position.set(0, 0, 0.006);
    eye.add(iris);

    // Deep black pupil
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.0034, 16), pupilMat);
    pupil.position.set(0, 0, 0.0065);
    eye.add(pupil);

    // Glass corneal specular highlight
    const gleam = new THREE.Mesh(new THREE.CircleGeometry(0.0016, 8), gleamMat);
    gleam.position.set(0.0024, 0.0024, 0.0072);
    eye.add(gleam);

    // Upper eyelid rim and defined lash line
    const upperLid = new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0018, 6, 14, Math.PI), lashMat);
    upperLid.position.set(0, 0.0035, 0.0062);
    upperLid.rotation.z = Math.PI;
    eye.add(upperLid);

    // Soft lower eyelid contour
    const lowerLid = new THREE.Mesh(new THREE.TorusGeometry(0.010, 0.0012, 6, 14, Math.PI), skinMat);
    lowerLid.position.set(0, -0.004, 0.0055);
    eye.add(lowerLid);

    faceGroup.add(eye);
  });

  // Nose: Refined bridge ridge, defined tip, and soft nostril wings
  const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 12), skinMat);
  noseTip.position.set(0, 0.054, 0.144);
  noseTip.scale.set(1.0, 0.9, 1.25);
  faceGroup.add(noseTip);

  const noseBridge = new THREE.Mesh(new THREE.CylinderGeometry(0.0038, 0.0058, 0.024, 8), skinMat);
  noseBridge.position.set(0, 0.068, 0.141);
  noseBridge.rotation.x = 0.22;
  faceGroup.add(noseBridge);

  [-0.014, 0.014].forEach((xSide) => {
    const nostril = new THREE.Mesh(new THREE.SphereGeometry(0.0045, 8, 8), skinMat);
    nostril.position.set(xSide, 0.051, 0.140);
    faceGroup.add(nostril);
  });

  // Lips: Sculpted upper lip with Cupid's bow and soft pillowed lower lip
  const lipMat = new THREE.MeshStandardMaterial({
    color: lipHex,
    roughness: 0.42,
    metalness: 0.06,
  });

  // Upper lip
  const upperLip = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.007, 0.009), lipMat);
  upperLip.position.set(0, 0.034, 0.141);
  faceGroup.add(upperLip);

  // Lower lip
  const lowerLip = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.008, 0.009), lipMat);
  lowerLip.position.set(0, 0.026, 0.139);
  faceGroup.add(lowerLip);

  return tagInstanceMesh(faceGroup);
}

function createHeadSkinDetails(detail: CharacterSkinDetail): THREE.Group | null {
  if (detail === 'clean') return null;

  const group = new THREE.Group();
  group.name = `SkinDetail_${detail}`;

  if (detail === 'grease_smudge') {
    // Workshop soot / grease smears resting on surface of cheek and temple
    const sootMat = new THREE.MeshBasicMaterial({
      color: 0x18181b,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    // Right cheek smear
    const smudge1 = new THREE.Mesh(new THREE.PlaneGeometry(0.026, 0.014), sootMat);
    smudge1.position.set(0.052, 0.045, 0.125);
    smudge1.rotation.y = 0.45;
    smudge1.rotation.z = -0.2;
    group.add(smudge1);

    // Forehead soot
    const smudge2 = new THREE.Mesh(new THREE.PlaneGeometry(0.034, 0.01), sootMat);
    smudge2.position.set(-0.025, 0.135, 0.133);
    smudge2.rotation.y = -0.2;
    smudge2.rotation.z = 0.15;
    group.add(smudge2);
  } else if (detail === 'freckles') {
    // Sun-kissed freckle stippling across bridge of nose & cheekbones
    const freckleMat = new THREE.MeshBasicMaterial({
      color: 0x854d0e,
      transparent: true,
      opacity: 0.65,
      depthWrite: false,
    });
    const freckleGeom = new THREE.CircleGeometry(0.002, 6);
    const offsets = [
      [0, 0.065, 0.142],
      [0.014, 0.062, 0.139],
      [-0.014, 0.062, 0.139],
      [0.028, 0.055, 0.135],
      [-0.028, 0.055, 0.135],
      [0.040, 0.052, 0.129],
      [-0.040, 0.052, 0.129],
      [0.020, 0.070, 0.138],
      [-0.020, 0.070, 0.138],
    ];
    offsets.forEach(([x, y, z]) => {
      const f = new THREE.Mesh(freckleGeom, freckleMat);
      f.position.set(x, y, z);
      f.rotation.y = x > 0 ? 0.35 : x < 0 ? -0.35 : 0;
      group.add(f);
    });
  } else if (detail === 'tattoos') {
    // Subtle neck tuner tribal tattoo
    const inkMat = new THREE.MeshBasicMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });
    const inkGeom = new THREE.PlaneGeometry(0.028, 0.014);
    const neckInk = new THREE.Mesh(inkGeom, inkMat);
    neckInk.position.set(-0.072, 0.025, 0.075);
    neckInk.rotation.y = -Math.PI / 2 + 0.3;
    group.add(neckInk);
  }

  return tagInstanceMesh(group);
}

// ---------------------------------------------------------------------------
// ULTRA HIGH QUALITY 3D HAIRSTYLES & TEXTURES
// Procedural strand micro-groove bump mapping, anisotropic sheen, and tapered lock splines
// ---------------------------------------------------------------------------

interface HairTextures {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
}

const hairTextureCache = new Map<number, HairTextures>();
const scalpTextureCache = new Map<number, HairTextures>();

function getScalpTextures(colorHex: number): HairTextures | null {
  if (typeof document === 'undefined') return null;
  if (scalpTextureCache.has(colorHex)) {
    return scalpTextureCache.get(colorHex)!;
  }

  const width = 512;
  const height = 512;

  // 1. Procedural Scalp Follicle Albedo (Micro-buzz roots with gradient perimeter)
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d');
  if (!ctx) return null;

  const base = new THREE.Color(colorHex);
  const dark = base.clone().multiplyScalar(0.52);
  const root = base.clone().multiplyScalar(0.70);

  ctx.fillStyle = `#${dark.getHexString()}`;
  ctx.fillRect(0, 0, width, height);

  // Micro-follicle stippling representing clipped root grain
  ctx.fillStyle = `#${root.getHexString()}`;
  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.4 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Soft fade edge gradient at borders
  const radialGrad = ctx.createRadialGradient(width * 0.5, height * 0.5, width * 0.25, width * 0.5, height * 0.5, width * 0.5);
  radialGrad.addColorStop(0.0, 'rgba(0,0,0,0)');
  radialGrad.addColorStop(0.75, 'rgba(0,0,0,0.18)');
  radialGrad.addColorStop(1.0, 'rgba(0,0,0,0.48)');
  ctx.fillStyle = radialGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Procedural Bump Map (Porous / hair follicle stippled relief)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d');
  if (!bCtx) return null;

  bCtx.fillStyle = 'rgb(128, 128, 128)';
  bCtx.fillRect(0, 0, width, height);

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const isPit = Math.random() > 0.5;
    const v = isPit ? Math.floor(65 + Math.random() * 35) : Math.floor(185 + Math.random() * 45);
    bCtx.fillStyle = `rgb(${v}, ${v}, ${v})`;
    bCtx.fillRect(x, y, 1.8, 1.8);
  }

  // 3. Procedural Roughness Map (Matte skin / follicle roughness)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d');
  if (!rCtx) return null;

  rCtx.fillStyle = 'rgb(175, 175, 175)';
  rCtx.fillRect(0, 0, width, height);

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(2, 2);
  colorMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(3, 3);
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(2, 2);
  roughnessMap.needsUpdate = true;

  const textures: HairTextures = { colorMap, bumpMap, roughnessMap };
  scalpTextureCache.set(colorHex, textures);
  return textures;
}

function getHairTextures(colorHex: number): HairTextures | null {
  if (typeof document === 'undefined') return null;
  if (hairTextureCache.has(colorHex)) {
    return hairTextureCache.get(colorHex)!;
  }

  const width = 512;
  const height = 256;

  // 1. Procedural Hair Strand Color Map (Albedo with directional fiber striations)
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = width;
  colorCanvas.height = height;
  const ctx = colorCanvas.getContext('2d');
  if (!ctx) return null;

  const base = new THREE.Color(colorHex);
  const dark = base.clone().multiplyScalar(0.68);
  const highlight = base.clone().offsetHSL(0.01, 0.10, 0.22);

  ctx.fillStyle = `#${base.getHexString()}`;
  ctx.fillRect(0, 0, width, height);

  // Draw 200 fine longitudinal strand lines running along UV u (horizontally)
  for (let i = 0; i < 200; i++) {
    const y = (i / 200) * height;
    const thickness = 1 + (i % 3);
    const strandT = Math.sin(i * 12.9898) * 0.5 + 0.5;
    const strandColor = base.clone().lerp(strandT > 0.5 ? highlight : dark, Math.abs(strandT - 0.5) * 0.75);
    const alpha = 0.25 + (i % 4) * 0.06;

    ctx.strokeStyle = `rgba(${Math.round(strandColor.r * 255)}, ${Math.round(strandColor.g * 255)}, ${Math.round(strandColor.b * 255)}, ${alpha.toFixed(2)})`;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      width * 0.33, y + Math.sin(i * 1.5) * 1.8,
      width * 0.66, y - Math.sin(i * 1.5) * 1.8,
      width, y
    );
    ctx.stroke();
  }

  // Anisotropic specular highlight band along strand length (Kajiya-Kay lighting ring)
  const sheenGrad = ctx.createLinearGradient(0, 0, width, 0);
  sheenGrad.addColorStop(0.0, 'rgba(0,0,0,0.22)'); // Root shadow
  sheenGrad.addColorStop(0.20, 'rgba(0,0,0,0.0)');
  sheenGrad.addColorStop(0.38, 'rgba(255,255,255,0.18)'); // High-sheen crest
  sheenGrad.addColorStop(0.48, 'rgba(255,255,255,0.28)');
  sheenGrad.addColorStop(0.58, 'rgba(255,255,255,0.14)');
  sheenGrad.addColorStop(0.85, 'rgba(0,0,0,0.05)');
  sheenGrad.addColorStop(1.0, 'rgba(0,0,0,0.28)'); // Tip occlusion
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Procedural Bump Map (Micro-grooved 3D hair fibers that catch specular glints)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bCtx = bumpCanvas.getContext('2d');
  if (!bCtx) return null;

  bCtx.fillStyle = 'rgb(128, 128, 128)';
  bCtx.fillRect(0, 0, width, height);

  for (let y = 0; y < height; y += 2) {
    const isGroove = (y / 2) % 2 === 0;
    const v = isGroove ? Math.floor(45 + (y % 5) * 6) : Math.floor(215 + (y % 7) * 5);
    bCtx.fillStyle = `rgb(${v}, ${v}, ${v})`;
    bCtx.fillRect(0, y, width, 1.6);
  }

  // 3. Procedural Roughness Map (Stretches highlights into directional hair sheen)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = width;
  roughCanvas.height = height;
  const rCtx = roughCanvas.getContext('2d');
  if (!rCtx) return null;

  rCtx.fillStyle = 'rgb(92, 92, 92)';
  rCtx.fillRect(0, 0, width, height);

  const rGrad = rCtx.createLinearGradient(0, 0, width, 0);
  rGrad.addColorStop(0.0, 'rgb(120, 120, 120)');
  rGrad.addColorStop(0.40, 'rgb(58, 58, 58)'); // Silky highlight region
  rGrad.addColorStop(0.55, 'rgb(68, 68, 68)');
  rGrad.addColorStop(1.0, 'rgb(125, 125, 125)');
  rCtx.fillStyle = rGrad;
  rCtx.globalAlpha = 0.6;
  rCtx.fillRect(0, 0, width, height);
  rCtx.globalAlpha = 1.0;

  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.wrapS = THREE.RepeatWrapping;
  colorMap.wrapT = THREE.RepeatWrapping;
  colorMap.repeat.set(1, 3);
  colorMap.needsUpdate = true;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(1, 4);
  bumpMap.needsUpdate = true;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.wrapS = THREE.RepeatWrapping;
  roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(1, 3);
  roughnessMap.needsUpdate = true;

  const textures: HairTextures = { colorMap, bumpMap, roughnessMap };
  hairTextureCache.set(colorHex, textures);
  return textures;
}

/**
 * Creates a tapered hair lock geometry where the radius naturally swells through the mid-shaft
 * and tapers gracefully to a sharp, stylized tip, eliminating blunt pipe ends.
 */
function createTaperedHairLockGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments: number = 16,
  radius: number = 0.018,
  radialSegments: number = 8,
  taperProfile: 'standard' | 'fine' | 'blunt' = 'standard'
): THREE.BufferGeometry {
  const geom = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  const pos = geom.attributes.position;

  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    const pCenter = curve.getPointAt(t);

    let factor = 1.0;
    if (taperProfile === 'standard') {
      // Natural hair lock: root starts at 0.78, swells to 1.05 in mid body, tapers smoothly to 0.18 at tip
      factor = Math.max(0.18, 0.78 + 0.38 * Math.sin(t * Math.PI) - 0.80 * Math.pow(t, 2.0));
    } else if (taperProfile === 'fine') {
      // Fine tapered ends (wisps, fringe, bangs)
      factor = Math.max(0.10, 0.85 + 0.25 * Math.sin(t * Math.PI) - 0.95 * Math.pow(t, 1.8));
    } else if (taperProfile === 'blunt') {
      // Dreadlocks or braided locs (consistent full cylindrical body, rounded tip)
      factor = t > 0.86 ? Math.max(0.40, 1.0 - (t - 0.86) * 4.2) : 1.0;
    }

    for (let j = 0; j <= radialSegments; j++) {
      const idx = i * (radialSegments + 1) + j;
      const vx = pos.getX(idx);
      const vy = pos.getY(idx);
      const vz = pos.getZ(idx);

      pos.setXYZ(
        idx,
        pCenter.x + (vx - pCenter.x) * factor,
        pCenter.y + (vy - pCenter.y) * factor,
        pCenter.z + (vz - pCenter.z) * factor
      );
    }
  }

  geom.computeVertexNormals();
  return geom;
}

function createHairstyle(style: CharacterHairstyle, hairColorHex: number): THREE.Group {
  const hairGroup = new THREE.Group();
  hairGroup.name = `Hair_${style}`;

  if (style === 'bald') return tagInstanceMesh(hairGroup);

  const textures = getHairTextures(hairColorHex);

  const baseColor = new THREE.Color(hairColorHex);
  const darkColor = baseColor.clone().multiplyScalar(0.70);
  const highlightColor = baseColor.clone().offsetHSL(0.01, 0.10, 0.22);

  // MeshPhysicalMaterial with micro-groove bump texture and anisotropic sheen
  const hairMat = new THREE.MeshPhysicalMaterial({
    color: hairColorHex,
    roughness: 0.36,
    metalness: 0.08,
    clearcoat: 0.45,
    clearcoatRoughness: 0.26,
    sheen: 0.85,
    sheenRoughness: 0.38,
    sheenColor: highlightColor,
    ...(textures
      ? {
          map: textures.colorMap,
          bumpMap: textures.bumpMap,
          bumpScale: 0.0035,
          roughnessMap: textures.roughnessMap,
        }
      : {}),
  });

  const hairDarkMat = new THREE.MeshPhysicalMaterial({
    color: darkColor,
    roughness: 0.48,
    metalness: 0.06,
    clearcoat: 0.28,
    clearcoatRoughness: 0.35,
    sheen: 0.60,
    sheenRoughness: 0.45,
    sheenColor: baseColor,
    ...(textures
      ? {
          map: textures.colorMap,
          bumpMap: textures.bumpMap,
          bumpScale: 0.0035,
          roughnessMap: textures.roughnessMap,
        }
      : {}),
  });

  const hairHighlightMat = new THREE.MeshPhysicalMaterial({
    color: highlightColor,
    roughness: 0.28,
    metalness: 0.10,
    clearcoat: 0.55,
    clearcoatRoughness: 0.22,
    sheen: 1.0,
    sheenRoughness: 0.30,
    sheenColor: highlightColor.clone().offsetHSL(0.0, 0.05, 0.15),
    ...(textures
      ? {
          map: textures.colorMap,
          bumpMap: textures.bumpMap,
          bumpScale: 0.0038,
          roughnessMap: textures.roughnessMap,
        }
      : {}),
  });

  const scalpTextures = getScalpTextures(hairColorHex);
  const scalpMat = new THREE.MeshStandardMaterial({
    color: darkColor,
    roughness: 0.75,
    metalness: 0.03,
    ...(scalpTextures
      ? {
          map: scalpTextures.colorMap,
          bumpMap: scalpTextures.bumpMap,
          bumpScale: 0.0028,
          roughnessMap: scalpTextures.roughnessMap,
        }
      : {}),
  });

  const cuffMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24, // Gold bead cuffs
    metalness: 0.95,
    roughness: 0.18,
  });

  // 360-degree close-fitting anatomical scalp shell that completely envelops the cranium,
  // temples, frontal hairline, and nape with zero bald spots or exposed skin gaps.
  const createScalpBase = (type: 'full' | 'undercut' | 'buzz' = 'full'): THREE.Group => {
    const scalpGroup = new THREE.Group();
    scalpGroup.name = `ScalpBase_${type}`;

    // 1. Anatomical cranium shell (full coverage from crown apex down past temples and forehead hairline)
    const craniumGeom = new THREE.SphereGeometry(0.089, 28, 22, 0, Math.PI * 2, 0, Math.PI * 0.63);
    const cranium = new THREE.Mesh(craniumGeom, scalpMat);
    cranium.position.set(0, 0.122, 0.010);
    cranium.scale.set(1.0, 1.0, 1.20);
    scalpGroup.add(cranium);

    // 2. Nape & occiput extension (wraps the back of skull from Y=0.135 down to Y=0.048, Z=-0.088)
    const napeGeom = new THREE.CylinderGeometry(0.078, 0.065, 0.095, 22, 1, false, Math.PI * 0.42, Math.PI * 1.16);
    const nape = new THREE.Mesh(napeGeom, scalpMat);
    nape.position.set(0, 0.092, -0.024);
    nape.scale.set(1.0, 1.0, 0.88);
    scalpGroup.add(nape);

    // 3. Sideburn & temporal taper wings (seamlessly wraps around ears and jaw angle)
    [-0.086, 0.086].forEach((xSide) => {
      const temple = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.044, 0.026), hairDarkMat);
      temple.position.set(xSide, 0.110, 0.045);
      scalpGroup.add(temple);
    });

    // 4. Clean frontal hairline edge-up foundation bar
    const edgeUp = new THREE.Mesh(new THREE.BoxGeometry(0.114, 0.008, 0.014), hairDarkMat);
    edgeUp.position.set(0, 0.168, 0.115);
    scalpGroup.add(edgeUp);

    return scalpGroup;
  };

  switch (style) {
    case 'quiff': {
      // Modern Textured Pompadour: dynamic cresting wave swept up and back from hairline
      hairGroup.add(createScalpBase('full'));

      // Multi-strand swept pompadour crest: tiered tapered locks arching up from hairline and flowing back
      const crestSplines: { pts: number[][]; mat: THREE.MeshPhysicalMaterial; radius: number; profile?: 'standard' | 'fine' }[] = [
        // Center high crest lock (highlighted peak)
        {
          pts: [[0.0, 0.158, 0.116], [0.0, 0.235, 0.085], [0.0, 0.238, 0.012], [0.0, 0.214, -0.055]],
          mat: hairHighlightMat,
          radius: 0.021,
          profile: 'standard',
        },
        // Inner flanking crest locks
        {
          pts: [[-0.018, 0.156, 0.114], [-0.016, 0.232, 0.080], [-0.014, 0.235, 0.010], [-0.012, 0.212, -0.055]],
          mat: hairMat,
          radius: 0.020,
          profile: 'standard',
        },
        {
          pts: [[0.018, 0.156, 0.114], [0.016, 0.232, 0.080], [0.014, 0.235, 0.010], [0.012, 0.212, -0.055]],
          mat: hairMat,
          radius: 0.020,
          profile: 'standard',
        },
        // Mid sweepers
        {
          pts: [[-0.036, 0.152, 0.106], [-0.034, 0.226, 0.070], [-0.028, 0.230, 0.005], [-0.024, 0.208, -0.058]],
          mat: hairHighlightMat,
          radius: 0.019,
          profile: 'standard',
        },
        {
          pts: [[0.036, 0.152, 0.106], [0.034, 0.226, 0.070], [0.028, 0.230, 0.005], [0.024, 0.208, -0.058]],
          mat: hairHighlightMat,
          radius: 0.019,
          profile: 'standard',
        },
        // Outer sweepers
        {
          pts: [[-0.054, 0.148, 0.092], [-0.050, 0.218, 0.055], [-0.042, 0.222, -0.005], [-0.035, 0.202, -0.062]],
          mat: hairMat,
          radius: 0.018,
          profile: 'standard',
        },
        {
          pts: [[0.054, 0.148, 0.092], [0.050, 0.218, 0.055], [0.042, 0.222, -0.005], [0.035, 0.202, -0.062]],
          mat: hairMat,
          radius: 0.018,
          profile: 'standard',
        },
        // Temple flank locks
        {
          pts: [[-0.070, 0.142, 0.075], [-0.065, 0.205, 0.040], [-0.056, 0.212, -0.015], [-0.046, 0.195, -0.068]],
          mat: hairDarkMat,
          radius: 0.017,
          profile: 'standard',
        },
        {
          pts: [[0.070, 0.142, 0.075], [0.065, 0.205, 0.040], [0.056, 0.212, -0.015], [0.046, 0.195, -0.068]],
          mat: hairDarkMat,
          radius: 0.017,
          profile: 'standard',
        },
        // Front quiff roll tufts (curled upward-swept tips that define the pompadour roll)
        {
          pts: [[-0.012, 0.162, 0.118], [-0.010, 0.205, 0.125], [-0.006, 0.228, 0.105]],
          mat: hairHighlightMat,
          radius: 0.015,
          profile: 'fine',
        },
        {
          pts: [[0.012, 0.162, 0.118], [0.010, 0.205, 0.125], [0.006, 0.228, 0.105]],
          mat: hairHighlightMat,
          radius: 0.015,
          profile: 'fine',
        },
        // Rear-crown combed sweep splines flowing cleanly down occiput into the rear fade
        {
          pts: [[-0.024, 0.208, -0.055], [-0.022, 0.175, -0.078], [-0.018, 0.135, -0.088]],
          mat: hairDarkMat,
          radius: 0.016,
          profile: 'standard',
        },
        {
          pts: [[0.024, 0.208, -0.055], [0.022, 0.175, -0.078], [0.018, 0.135, -0.088]],
          mat: hairDarkMat,
          radius: 0.016,
          profile: 'standard',
        },
        {
          pts: [[0.0, 0.212, -0.052], [0.0, 0.178, -0.080], [0.0, 0.138, -0.090]],
          mat: hairMat,
          radius: 0.017,
          profile: 'standard',
        },
      ];

      crestSplines.forEach(({ pts, mat, radius, profile }) => {
        const vPts = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = new THREE.CatmullRomCurve3(vPts);
        const tube = new THREE.Mesh(createTaperedHairLockGeometry(curve, 18, radius, 8, profile || 'standard'), mat);
        hairGroup.add(tube);
      });

      // Feathered hairline transition wisps
      const hairlineWisps: number[][][] = [
        [[-0.022, 0.150, 0.116], [-0.020, 0.185, 0.114], [-0.016, 0.212, 0.090]],
        [[0.022, 0.150, 0.116], [0.020, 0.185, 0.114], [0.016, 0.212, 0.090]],
        [[-0.042, 0.145, 0.102], [-0.038, 0.178, 0.096], [-0.032, 0.206, 0.075]],
        [[0.042, 0.145, 0.102], [0.038, 0.178, 0.096], [0.032, 0.206, 0.075]],
      ];
      hairlineWisps.forEach((pts) => {
        const vPts = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = new THREE.CatmullRomCurve3(vPts);
        const tube = new THREE.Mesh(createTaperedHairLockGeometry(curve, 14, 0.013, 8, 'fine'), hairDarkMat);
        hairGroup.add(tube);
      });
      break;
    }
    case 'side_part': {
      // Razor Sharp Executive Side Part with combed wave ribbons
      hairGroup.add(createScalpBase('full'));

      // Left part line trench with razor clean separation
      const partLine = new THREE.Mesh(new THREE.BoxGeometry(0.005, 0.014, 0.13), hairDarkMat);
      partLine.position.set(-0.038, 0.212, 0.015);
      hairGroup.add(partLine);

      // Combed locks on left side of the part (tapering down over the left temple)
      const leftPartLocks: number[][][] = [
        [[-0.044, 0.208, 0.085], [-0.060, 0.195, 0.075], [-0.075, 0.170, 0.055], [-0.082, 0.135, 0.035]],
        [[-0.044, 0.210, 0.035], [-0.062, 0.198, 0.030], [-0.078, 0.172, 0.020], [-0.084, 0.138, 0.010]],
        [[-0.044, 0.208, -0.015], [-0.060, 0.196, -0.020], [-0.076, 0.170, -0.025], [-0.082, 0.136, -0.030]],
      ];
      leftPartLocks.forEach((pts) => {
        const vPts = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = new THREE.CatmullRomCurve3(vPts);
        const tube = new THREE.Mesh(createTaperedHairLockGeometry(curve, 16, 0.017, 8, 'fine'), hairDarkMat);
        hairGroup.add(tube);
      });

      // Main swept wave locks across the crown from left part line over to the right
      const waveCurves: { pts: number[][]; mat: THREE.MeshPhysicalMaterial }[] = [
        {
          pts: [[-0.034, 0.208, 0.095], [0.005, 0.228, 0.088], [0.045, 0.224, 0.070], [0.078, 0.202, 0.045]],
          mat: hairHighlightMat,
        },
        {
          pts: [[-0.034, 0.212, 0.055], [0.008, 0.230, 0.048], [0.048, 0.226, 0.030], [0.082, 0.205, 0.015]],
          mat: hairMat,
        },
        {
          pts: [[-0.034, 0.214, 0.015], [0.008, 0.231, 0.006], [0.050, 0.227, -0.012], [0.084, 0.205, -0.028]],
          mat: hairHighlightMat,
        },
        {
          pts: [[-0.034, 0.210, -0.028], [0.006, 0.226, -0.036], [0.046, 0.221, -0.050], [0.080, 0.200, -0.065]],
          mat: hairMat,
        },
        {
          pts: [[-0.034, 0.204, -0.060], [0.004, 0.218, -0.068], [0.040, 0.212, -0.075], [0.072, 0.190, -0.082]],
          mat: hairDarkMat,
        },
        // Rear combed locks down occiput
        {
          pts: [[-0.025, 0.205, -0.060], [-0.022, 0.168, -0.082], [-0.018, 0.128, -0.090]],
          mat: hairDarkMat,
        },
        {
          pts: [[0.025, 0.205, -0.060], [0.022, 0.168, -0.082], [0.018, 0.128, -0.090]],
          mat: hairDarkMat,
        },
        {
          pts: [[0.0, 0.210, -0.058], [0.0, 0.172, -0.084], [0.0, 0.132, -0.092]],
          mat: hairMat,
        },
      ];

      waveCurves.forEach(({ pts, mat }) => {
        const vPts = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = new THREE.CatmullRomCurve3(vPts);
        const tube = new THREE.Mesh(createTaperedHairLockGeometry(curve, 18, 0.020, 8, 'standard'), mat);
        hairGroup.add(tube);
      });
      break;
    }
    case 'curly_fade': {
      // High-top Textured Curls: tight organic curl canopy with zero flat dome
      hairGroup.add(createScalpBase('full'));

      // 20 Curly spring ring coils across top crown
      for (let i = 0; i < 20; i++) {
        const coil = new THREE.Mesh(
          new THREE.TorusGeometry(0.013, 0.005, 8, 16, Math.PI * 1.6),
          i % 3 === 0 ? hairHighlightMat : hairMat
        );
        const angle = (i / 20) * Math.PI * 2;
        const dist = 0.020 + (i % 3) * 0.018;
        coil.position.set(
          Math.cos(angle) * dist,
          0.215 + Math.sin(i * 1.5) * 0.008,
          Math.sin(angle) * dist * 1.2 + 0.015
        );
        coil.rotation.set(Math.sin(i) * 0.6, Math.cos(i) * 0.6, (i * Math.PI) / 4);
        hairGroup.add(coil);
      }

      // 36 Organic textured curl puffs filling entire crown volume
      for (let i = 0; i < 36; i++) {
        const rad = 0.013 + (i % 5) * 0.002;
        const puff = new THREE.Mesh(
          new THREE.SphereGeometry(rad, 8, 8),
          i % 2 === 0 ? hairMat : hairDarkMat
        );
        const theta = (i / 36) * Math.PI * 2 + Math.sin(i);
        const r = 0.015 + ((i * 7) % 11) * 0.0045;
        const yOff = 0.216 + ((i * 13) % 7) * 0.0028;
        puff.position.set(Math.cos(theta) * r, yOff, Math.sin(theta) * r * 1.25 + 0.015);
        puff.scale.set(1.1, 0.95, 1.1);
        hairGroup.add(puff);
      }
      break;
    }
    case 'dreadlocks': {
      // Authentic Full-Volume Dreadlocks with zero bald spots on front, back, or sides
      hairGroup.add(createScalpBase('full'));

      const dreadSplines: number[][][] = [
        // 1. FRONT HAIRLINE STATEMENT LOCS (Rooted directly at forehead hairline Z=0.116, Y=0.168)
        // Center-left loc draped forward and past cheek
        [[-0.018, 0.168, 0.116], [-0.035, 0.150, 0.125], [-0.050, 0.105, 0.118], [-0.058, 0.040, 0.098]],
        // Center-right loc draped forward and past cheek
        [[0.018, 0.168, 0.116], [0.035, 0.150, 0.125], [0.050, 0.105, 0.118], [0.058, 0.040, 0.098]],
        // Left temple hairline loc
        [[-0.050, 0.162, 0.110], [-0.075, 0.140, 0.105], [-0.090, 0.088, 0.085], [-0.094, 0.025, 0.065]],
        // Right temple hairline loc
        [[0.050, 0.162, 0.110], [0.075, 0.140, 0.105], [0.090, 0.088, 0.085], [0.094, 0.025, 0.065]],
        // High frontal hairline locs sweeping to sides
        [[-0.032, 0.178, 0.112], [-0.045, 0.165, 0.118], [-0.062, 0.120, 0.110], [-0.070, 0.060, 0.092]],
        [[0.032, 0.178, 0.112], [0.045, 0.165, 0.118], [0.062, 0.120, 0.110], [0.070, 0.060, 0.092]],

        // 2. LEFT SIDE CASCADES (Past ear down to shoulder)
        [[-0.078, 0.192, 0.075], [-0.096, 0.155, 0.065], [-0.104, 0.095, 0.045], [-0.100, 0.035, 0.030]],
        [[-0.082, 0.195, 0.030], [-0.100, 0.152, 0.022], [-0.106, 0.090, 0.015], [-0.102, 0.030, 0.010]],
        [[-0.080, 0.195, -0.018], [-0.098, 0.150, -0.025], [-0.104, 0.088, -0.032], [-0.098, 0.028, -0.038]],
        [[-0.074, 0.192, -0.060], [-0.090, 0.145, -0.070], [-0.094, 0.082, -0.078], [-0.088, 0.022, -0.082]],
        [[-0.065, 0.190, 0.095], [-0.085, 0.150, 0.090], [-0.095, 0.090, 0.070], [-0.092, 0.030, 0.055]],

        // 3. RIGHT SIDE CASCADES (Past ear down to shoulder)
        [[0.078, 0.192, 0.075], [0.096, 0.155, 0.065], [0.104, 0.095, 0.045], [0.100, 0.035, 0.030]],
        [[0.082, 0.195, 0.030], [0.100, 0.152, 0.022], [0.106, 0.090, 0.015], [0.102, 0.030, 0.010]],
        [[0.080, 0.195, -0.018], [0.098, 0.150, -0.025], [0.104, 0.088, -0.032], [0.098, 0.028, -0.038]],
        [[0.074, 0.192, -0.060], [0.090, 0.145, -0.070], [0.094, 0.082, -0.078], [0.088, 0.022, -0.082]],
        [[0.065, 0.190, 0.095], [0.085, 0.150, 0.090], [0.095, 0.090, 0.070], [0.092, 0.030, 0.055]],

        // 4. CROWN TOP LOCS (Interlocking across skull apex)
        [[-0.025, 0.210, 0.085], [-0.035, 0.222, 0.040], [-0.025, 0.214, -0.005]],
        [[0.025, 0.210, 0.085], [0.035, 0.222, 0.040], [0.025, 0.214, -0.005]],
        [[0.000, 0.214, 0.088], [0.000, 0.225, 0.040], [0.000, 0.218, -0.010]],
        [[-0.048, 0.204, 0.065], [-0.060, 0.212, 0.020], [-0.052, 0.204, -0.025]],
        [[0.048, 0.204, 0.065], [0.060, 0.212, 0.020], [0.052, 0.204, -0.025]],
        [[-0.028, 0.216, 0.015], [-0.036, 0.220, -0.025], [-0.026, 0.210, -0.060]],
        [[0.028, 0.216, 0.015], [0.036, 0.220, -0.025], [0.026, 0.210, -0.060]],
        [[0.000, 0.218, 0.015], [0.000, 0.222, -0.025], [0.000, 0.212, -0.062]],

        // 5. BACK NAPE TIER 1 (Upper occiput draped down past neck)
        [[-0.050, 0.192, -0.078], [-0.060, 0.140, -0.105], [-0.062, 0.075, -0.118], [-0.058, 0.005, -0.122]],
        [[-0.025, 0.196, -0.082], [-0.032, 0.142, -0.110], [-0.034, 0.072, -0.122], [-0.030, 0.002, -0.125]],
        [[0.000, 0.198, -0.085], [0.000, 0.145, -0.112], [0.000, 0.070, -0.125], [0.000, 0.000, -0.128]],
        [[0.025, 0.196, -0.082], [0.032, 0.142, -0.110], [0.034, 0.072, -0.122], [0.030, 0.002, -0.125]],
        [[0.050, 0.192, -0.078], [0.060, 0.140, -0.105], [0.062, 0.075, -0.118], [0.058, 0.005, -0.122]],

        // 6. BACK NAPE TIER 2 (Mid-occiput dense curtain covering nape gaps)
        [[-0.062, 0.155, -0.085], [-0.072, 0.110, -0.102], [-0.070, 0.050, -0.112], [-0.065, -0.010, -0.115]],
        [[-0.038, 0.150, -0.090], [-0.045, 0.105, -0.108], [-0.045, 0.045, -0.116], [-0.040, -0.015, -0.120]],
        [[-0.015, 0.148, -0.092], [-0.018, 0.100, -0.112], [-0.018, 0.040, -0.120], [-0.015, -0.018, -0.122]],
        [[0.015, 0.148, -0.092], [0.018, 0.100, -0.112], [0.018, 0.040, -0.120], [0.015, -0.018, -0.122]],
        [[0.038, 0.150, -0.090], [0.045, 0.105, -0.108], [0.045, 0.045, -0.116], [0.040, -0.015, -0.120]],
        [[0.062, 0.155, -0.085], [0.072, 0.110, -0.102], [0.070, 0.050, -0.112], [0.065, -0.010, -0.115]],

        // 7. BACK NAPE TIER 3 (Lower neck collar locs ensuring seamless bottom seal)
        [[-0.042, 0.108, -0.082], [-0.048, 0.065, -0.098], [-0.045, 0.015, -0.108]],
        [[-0.018, 0.105, -0.085], [-0.020, 0.060, -0.102], [-0.018, 0.010, -0.112]],
        [[0.018, 0.105, -0.085], [0.020, 0.060, -0.102], [0.018, 0.010, -0.112]],
        [[0.042, 0.108, -0.082], [0.048, 0.065, -0.098], [0.045, 0.015, -0.108]],
      ];

      dreadSplines.forEach((pts, idx) => {
        const vPts = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = new THREE.CatmullRomCurve3(vPts);
        const tube = new THREE.Mesh(
          createTaperedHairLockGeometry(curve, 16, 0.0145, 8, 'blunt'),
          idx % 3 === 0 ? hairHighlightMat : hairMat
        );
        hairGroup.add(tube);

        // Gold metal cuffs on selected locs at varied heights
        if ((idx % 3 === 0 || idx === 0 || idx === 1) && pts.length >= 4) {
          const cuffPt = vPts[Math.min(2, pts.length - 2)];
          const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.0165, 0.0165, 0.014, 10), cuffMat);
          cuff.position.copy(cuffPt);
          hairGroup.add(cuff);
        }
      });
      break;
    }
    case 'undercut': {
      // Street Tuner Disconnected Undercut: heavy textured fringe sweeping diagonally
      hairGroup.add(createScalpBase('undercut'));

      const fringeStrands: { pts: number[][]; mat: THREE.MeshPhysicalMaterial }[] = [
        {
          pts: [[0.050, 0.220, 0.015], [0.032, 0.226, 0.060], [-0.008, 0.212, 0.110], [-0.038, 0.178, 0.128]],
          mat: hairHighlightMat,
        },
        {
          pts: [[0.060, 0.216, -0.012], [0.040, 0.222, 0.042], [0.010, 0.210, 0.100], [-0.020, 0.175, 0.130]],
          mat: hairMat,
        },
        {
          pts: [[0.030, 0.220, -0.035], [0.020, 0.220, 0.015], [-0.008, 0.208, 0.075], [-0.028, 0.180, 0.120]],
          mat: hairHighlightMat,
        },
        {
          pts: [[-0.010, 0.218, -0.025], [-0.020, 0.216, 0.025], [-0.036, 0.202, 0.080], [-0.052, 0.178, 0.115]],
          mat: hairDarkMat,
        },
        {
          pts: [[0.015, 0.222, -0.010], [0.005, 0.222, 0.035], [-0.018, 0.208, 0.088], [-0.035, 0.172, 0.132]],
          mat: hairMat,
        },
        {
          pts: [[0.045, 0.218, -0.045], [0.035, 0.215, -0.010], [0.015, 0.208, 0.045], [-0.012, 0.185, 0.105]],
          mat: hairHighlightMat,
        },
        {
          pts: [[-0.025, 0.212, -0.040], [-0.035, 0.210, 0.005], [-0.048, 0.198, 0.065], [-0.060, 0.172, 0.110]],
          mat: hairDarkMat,
        },
        // Rear crown sweep
        {
          pts: [[0.0, 0.215, -0.035], [0.0, 0.195, -0.065], [0.0, 0.160, -0.082]],
          mat: hairMat,
        },
      ];

      fringeStrands.forEach(({ pts, mat }) => {
        const vPts = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = new THREE.CatmullRomCurve3(vPts);
        const tube = new THREE.Mesh(createTaperedHairLockGeometry(curve, 18, 0.019, 8, 'fine'), mat);
        hairGroup.add(tube);
      });
      break;
    }
    case 'ponytail': {
      // Sleek High Ponytail: brushed directional flow into high ponytail
      hairGroup.add(createScalpBase('full'));

      // Brushed pull ribbons along the skull leading back to the scrunchie
      const pullSplines: number[][][] = [
        [[0.0, 0.165, 0.114], [0.0, 0.218, 0.050], [0.0, 0.210, -0.040], [0.0, 0.204, -0.072]],
        [[-0.035, 0.160, 0.100], [-0.040, 0.212, 0.035], [-0.028, 0.208, -0.045], [-0.012, 0.203, -0.072]],
        [[0.035, 0.160, 0.100], [0.040, 0.212, 0.035], [0.028, 0.208, -0.045], [0.012, 0.203, -0.072]],
        [[-0.065, 0.145, 0.060], [-0.070, 0.195, 0.010], [-0.045, 0.204, -0.050], [-0.018, 0.202, -0.074]],
        [[0.065, 0.145, 0.060], [0.070, 0.195, 0.010], [0.045, 0.204, -0.050], [0.018, 0.202, -0.074]],
        // Lower nape pull upward
        [[-0.032, 0.100, -0.085], [-0.025, 0.150, -0.090], [-0.014, 0.185, -0.082], [-0.008, 0.201, -0.074]],
        [[0.032, 0.100, -0.085], [0.025, 0.150, -0.090], [0.014, 0.185, -0.082], [0.008, 0.201, -0.074]],
        [[0.0, 0.095, -0.088], [0.0, 0.148, -0.092], [0.0, 0.186, -0.085], [0.0, 0.201, -0.075]],
      ];
      pullSplines.forEach((pts) => {
        const vPts = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = new THREE.CatmullRomCurve3(vPts);
        const tube = new THREE.Mesh(createTaperedHairLockGeometry(curve, 16, 0.017, 8, 'fine'), hairMat);
        hairGroup.add(tube);
      });

      // Gold scrunchie ring at upper rear crown
      const scrunchie = new THREE.Mesh(new THREE.TorusGeometry(0.020, 0.007, 8, 16), cuffMat);
      scrunchie.position.set(0, 0.202, -0.075);
      scrunchie.rotation.x = Math.PI / 3;
      hairGroup.add(scrunchie);

      // Layered ponytail plumes flowing back and down in natural curve
      const tailSplines: { pts: number[][]; mat: THREE.MeshPhysicalMaterial }[] = [
        {
          pts: [[0.0, 0.204, -0.078], [0.0, 0.185, -0.142], [0.0, 0.105, -0.162], [0.0, 0.020, -0.142]],
          mat: hairHighlightMat,
        },
        {
          pts: [[-0.016, 0.202, -0.078], [-0.020, 0.180, -0.138], [-0.016, 0.100, -0.158], [-0.010, 0.015, -0.138]],
          mat: hairMat,
        },
        {
          pts: [[0.016, 0.202, -0.078], [0.020, 0.180, -0.138], [0.016, 0.100, -0.158], [0.010, 0.015, -0.138]],
          mat: hairMat,
        },
        {
          pts: [[0.0, 0.206, -0.076], [0.0, 0.190, -0.130], [0.0, 0.125, -0.150], [0.0, 0.055, -0.135]],
          mat: hairDarkMat,
        },
      ];

      tailSplines.forEach(({ pts, mat }) => {
        const vPts = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = new THREE.CatmullRomCurve3(vPts);
        const tube = new THREE.Mesh(createTaperedHairLockGeometry(curve, 18, 0.020, 8, 'fine'), mat);
        hairGroup.add(tube);
      });
      break;
    }
    case 'wavy_long': {
      // Flowing Layered Waves: natural center part hugging crown, framing cheeks and shoulders
      hairGroup.add(createScalpBase('full'));

      const wavySplines: { pts: number[][]; mat: THREE.MeshPhysicalMaterial }[] = [
        // Left front locks framing cheek
        {
          pts: [[-0.050, 0.204, 0.080], [-0.085, 0.162, 0.075], [-0.096, 0.095, 0.055], [-0.088, 0.010, 0.040]],
          mat: hairHighlightMat,
        },
        {
          pts: [[-0.070, 0.198, 0.040], [-0.095, 0.148, 0.030], [-0.100, 0.080, 0.020], [-0.092, -0.015, 0.010]],
          mat: hairMat,
        },
        // Right front locks framing cheek
        {
          pts: [[0.050, 0.204, 0.080], [0.085, 0.162, 0.075], [0.096, 0.095, 0.055], [0.088, 0.010, 0.040]],
          mat: hairHighlightMat,
        },
        {
          pts: [[0.070, 0.198, 0.040], [0.095, 0.148, 0.030], [0.100, 0.080, 0.020], [0.092, -0.015, 0.010]],
          mat: hairMat,
        },
        // Back curtain waves across occiput and neck
        {
          pts: [[-0.038, 0.198, -0.078], [-0.046, 0.130, -0.102], [-0.046, 0.050, -0.112], [-0.038, -0.030, -0.105]],
          mat: hairDarkMat,
        },
        {
          pts: [[0.0, 0.200, -0.082], [0.0, 0.130, -0.110], [0.0, 0.050, -0.120], [0.0, -0.035, -0.112]],
          mat: hairHighlightMat,
        },
        {
          pts: [[0.038, 0.198, -0.078], [0.048, 0.130, -0.102], [0.048, 0.050, -0.112], [0.038, -0.030, -0.105]],
          mat: hairDarkMat,
        },
        {
          pts: [[-0.060, 0.185, -0.060], [-0.070, 0.120, -0.085], [-0.068, 0.040, -0.095], [-0.058, -0.025, -0.090]],
          mat: hairMat,
        },
        {
          pts: [[0.060, 0.185, -0.060], [0.070, 0.120, -0.085], [0.068, 0.040, -0.095], [0.058, -0.025, -0.090]],
          mat: hairMat,
        },
      ];

      wavySplines.forEach(({ pts, mat }) => {
        const vPts = pts.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
        const curve = new THREE.CatmullRomCurve3(vPts);
        const tube = new THREE.Mesh(createTaperedHairLockGeometry(curve, 18, 0.022, 8, 'standard'), mat);
        hairGroup.add(tube);
      });
      break;
    }
    case 'bob_cut': {
      // Chic Angled Bob hugging cranium with full rear shell and framing jawline
      hairGroup.add(createScalpBase('full'));

      // Front fringe bangs with soft curve
      const fringe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.082, 0.088, 0.045, 20, 1, true, -Math.PI * 0.40, Math.PI * 0.80),
        hairMat
      );
      fringe.position.set(0, 0.170, 0.065);
      fringe.rotation.x = -0.22;
      hairGroup.add(fringe);

      // Back curved bob shell (completely covers rear skull down to nape with silky finish)
      const backBob = new THREE.Mesh(
        new THREE.SphereGeometry(0.096, 24, 18, Math.PI * 0.45, Math.PI * 1.10, 0, Math.PI * 0.72),
        hairMat
      );
      backBob.position.set(0, 0.125, -0.010);
      backBob.scale.set(1.02, 1.05, 1.05);
      hairGroup.add(backBob);

      // Angled face-framing A-line side panels
      [-0.088, 0.088].forEach((xSide) => {
        const sidePanel = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.145, 0.095), hairMat);
        sidePanel.position.set(xSide, 0.110, 0.025);
        sidePanel.rotation.z = xSide > 0 ? -0.08 : 0.08;
        sidePanel.rotation.y = xSide > 0 ? -0.10 : 0.10;
        hairGroup.add(sidePanel);
      });
      break;
    }
    case 'afro_taper': {
      // Sculpted Modern Afro: balanced volume with fine surface curl textures
      hairGroup.add(createScalpBase('full'));

      const afro = new THREE.Mesh(new THREE.SphereGeometry(0.090, 22, 20), hairMat);
      afro.position.set(0, 0.135, 0.010);
      afro.scale.set(1.08, 1.02, 1.22);
      hairGroup.add(afro);

      // Surface texture nodules across top, front, and rear
      for (let i = 0; i < 36; i++) {
        const nodule = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), hairDarkMat);
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 0.55;
        const r = 0.090;
        nodule.position.set(
          Math.sin(phi) * Math.cos(theta) * r * 1.08,
          0.135 + Math.cos(phi) * r * 1.02,
          Math.sin(phi) * Math.sin(theta) * r * 1.22 + 0.010
        );
        hairGroup.add(nodule);
      }
      break;
    }
    case 'buzz': {
      // Crisp Line-Up Buzz Fade: close-crop layer conforming tightly to the skull
      hairGroup.add(createScalpBase('buzz'));
      break;
    }
  }

  return tagInstanceMesh(hairGroup);
}

function createFacialHair(style: CharacterFacialHair, hairColorHex: number): THREE.Group {
  const facialGroup = new THREE.Group();
  facialGroup.name = `FacialHair_${style}`;

  if (style === 'clean') return tagInstanceMesh(facialGroup);

  const textures = getHairTextures(hairColorHex);

  const beardMat = new THREE.MeshPhysicalMaterial({
    color: hairColorHex,
    roughness: 0.65,
    metalness: 0.04,
    clearcoat: 0.20,
    sheen: 0.50,
    sheenColor: new THREE.Color(hairColorHex).offsetHSL(0.01, 0.08, 0.18),
    ...(textures
      ? {
          map: textures.colorMap,
          bumpMap: textures.bumpMap,
          bumpScale: 0.0025,
        }
      : {}),
  });

  // Jaw/mouth reference coordinates:
  // Mouth: y=0.030, z=0.137
  // Upper lip (mustache): y=0.042, z=0.142
  // Chin: y=0.005, z=0.138
  // Jawline: x=±0.045 to ±0.075, y=0.025, z=0.08 to 0.12
  switch (style) {
    case 'stubble': {
      // Natural 5 O’clock shadow wrapping chin and jawline
      const shadow = new THREE.Mesh(new THREE.TorusGeometry(0.048, 0.01, 8, 18, Math.PI), beardMat);
      shadow.position.set(0, 0.015, 0.134);
      shadow.rotation.x = Math.PI / 2 + 0.2;
      facialGroup.add(shadow);
      break;
    }
    case 'beard': {
      // Full sculpted mechanic beard
      const chinBeard = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.045, 0.035), beardMat);
      chinBeard.position.set(0, 0.005, 0.138);
      facialGroup.add(chinBeard);

      [-0.055, 0.055].forEach((xSide) => {
        const sideburn = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.075, 0.025), beardMat);
        sideburn.position.set(xSide, 0.045, 0.105);
        facialGroup.add(sideburn);
      });

      const stache = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.016, 0.018), beardMat);
      stache.position.set(0, 0.042, 0.142);
      facialGroup.add(stache);
      break;
    }
    case 'goatee': {
      // Chiseled goatee around mouth & chin
      const chinPuff = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 0.03), beardMat);
      chinPuff.position.set(0, 0.008, 0.138);
      facialGroup.add(chinPuff);

      const lipStache = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.014, 0.018), beardMat);
      lipStache.position.set(0, 0.042, 0.142);
      facialGroup.add(lipStache);
      break;
    }
    case 'mustache': {
      // Full classic chevron mustache
      const stache = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.018, 0.018), beardMat);
      stache.position.set(0, 0.042, 0.142);
      facialGroup.add(stache);
      break;
    }
    case 'horseshoe': {
      // Vintage mechanic horseshoe mustache
      const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.016, 0.018), beardMat);
      topBar.position.set(0, 0.042, 0.142);
      facialGroup.add(topBar);

      [-0.028, 0.028].forEach((xSide) => {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.038, 0.016), beardMat);
        bar.position.set(xSide, 0.022, 0.138);
        facialGroup.add(bar);
      });
      break;
    }
    case 'van_dyke': {
      // Sharp Van Dyke (pointed chin beard + curved mustache)
      const chinPoint = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.045, 8), beardMat);
      chinPoint.position.set(0, -0.005, 0.136);
      chinPoint.rotation.x = Math.PI;
      facialGroup.add(chinPoint);

      const stacheCurved = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.014, 0.018), beardMat);
      stacheCurved.position.set(0, 0.042, 0.142);
      facialGroup.add(stacheCurved);
      break;
    }
  }

  return tagInstanceMesh(facialGroup);
}

function createAccessories(accessory: CharacterAccessory): {
  headItem?: THREE.Object3D;
  neckItem?: THREE.Object3D;
  hipsItem?: THREE.Object3D;
  handItem?: THREE.Object3D;
} {
  const items: {
    headItem?: THREE.Object3D;
    neckItem?: THREE.Object3D;
    hipsItem?: THREE.Object3D;
    handItem?: THREE.Object3D;
  } = {};

  switch (accessory) {
    case 'mechanic_cap': {
      // Tuner Snapback Cap resting snugly on head
      const capGroup = new THREE.Group();
      capGroup.name = 'MechanicCap';

      const domeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(0.097, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.55),
        domeMat
      );
      dome.position.set(0, 0.125, 0.012);
      dome.scale.set(1.02, 1.00, 1.28);
      capGroup.add(dome);

      // Reversed backwards brim pointing rear-upward
      const brimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });
      const brim = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.008, 0.085), brimMat);
      brim.position.set(0, 0.165, -0.108);
      brim.rotation.x = -0.15;
      capGroup.add(brim);

      items.headItem = tagInstanceMesh(capGroup);
      break;
    }
    case 'safety_goggles': {
      // Workshop Safety Goggles resting on bridge of nose outside face
      const goggleGroup = new THREE.Group();
      goggleGroup.name = 'SafetyGoggles';

      const lensMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        roughness: 0.1,
        metalness: 0.3,
        transparent: true,
        opacity: 0.75,
      });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });

      const frame = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.038, 0.024), frameMat);
      frame.position.set(0, 0.075, 0.142);
      goggleGroup.add(frame);

      [-0.035, 0.035].forEach((xSide) => {
        const lens = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.026, 0.01), lensMat);
        lens.position.set(xSide, 0.075, 0.152);
        goggleGroup.add(lens);
      });

      // Elastic strap around head
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.008, 6, 16), frameMat);
      strap.position.set(0, 0.075, 0.015);
      strap.rotation.x = Math.PI / 2;
      goggleGroup.add(strap);

      items.headItem = tagInstanceMesh(goggleGroup);
      break;
    }
    case 'racing_shades': {
      // Polarized Wrap-Around Racing Shades resting on bridge of nose
      const shadeGroup = new THREE.Group();
      shadeGroup.name = 'RacingShades';

      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        metalness: 0.9,
        roughness: 0.1,
      });
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });

      const visor = new THREE.Mesh(
        new THREE.CylinderGeometry(0.098, 0.098, 0.032, 16, 1, false, 0, Math.PI),
        glassMat
      );
      visor.position.set(0, 0.074, 0.065);
      visor.rotation.y = -Math.PI / 2;
      shadeGroup.add(visor);

      const topBar = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.008, 0.02), frameMat);
      topBar.position.set(0, 0.088, 0.142);
      shadeGroup.add(topBar);

      items.headItem = tagInstanceMesh(shadeGroup);
      break;
    }
    case 'aviator_glasses': {
      // Gold Wireframe Aviators
      const aviators = new THREE.Group();
      aviators.name = 'Aviators';

      const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        metalness: 0.8,
        roughness: 0.15,
        transparent: true,
        opacity: 0.82,
      });

      [-0.035, 0.035].forEach((xSide) => {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.003, 8, 16), goldMat);
        rim.position.set(xSide, 0.074, 0.142);
        aviators.add(rim);

        const lens = new THREE.Mesh(new THREE.CircleGeometry(0.019, 16), lensMat);
        lens.position.set(xSide, 0.074, 0.142);
        aviators.add(lens);
      });

      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.022, 8), goldMat);
      bridge.position.set(0, 0.079, 0.143);
      bridge.rotation.z = Math.PI / 2;
      aviators.add(bridge);

      items.headItem = tagInstanceMesh(aviators);
      break;
    }
    case 'headphones': {
      // Over-Ear Tuner Cans resting on neck
      const hpGroup = new THREE.Group();
      hpGroup.name = 'TunerHeadphones';

      const plasticMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35 });
      const padMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7 });

      const band = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.012, 8, 16, Math.PI * 1.2), plasticMat);
      band.position.set(0, 0.02, -0.01);
      band.rotation.x = Math.PI / 2 + 0.3;
      hpGroup.add(band);

      [-0.092, 0.092].forEach((xSide) => {
        const can = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.022, 16), padMat);
        can.position.set(xSide, 0.015, 0.03);
        can.rotation.z = xSide > 0 ? -0.4 : 0.4;
        hpGroup.add(can);
      });

      items.neckItem = tagInstanceMesh(hpGroup);
      break;
    }
    case 'chain_necklace': {
      // Cuban Link Curb Chain around collarbones
      const chainMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.95, roughness: 0.15 });
      const chain = new THREE.Mesh(new THREE.TorusGeometry(0.082, 0.008, 8, 24), chainMat);
      chain.position.set(0, 0.01, 0.03);
      chain.rotation.x = Math.PI / 3;
      items.neckItem = tagInstanceMesh(chain);
      break;
    }
    case 'face_mask': {
      // Workshop Neoprene Filter Mask covering mouth and nose exterior
      const maskGroup = new THREE.Group();
      maskGroup.name = 'FaceMask';

      const maskMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.65 });
      const filterMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.6, roughness: 0.3 });

      const faceCover = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.048, 0.032), maskMat);
      faceCover.position.set(0, 0.035, 0.146);
      maskGroup.add(faceCover);

      [-0.045, 0.045].forEach((xSide) => {
        const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 12), filterMat);
        valve.position.set(xSide, 0.035, 0.156);
        valve.rotation.x = Math.PI / 2;
        maskGroup.add(valve);
      });

      items.headItem = tagInstanceMesh(maskGroup);
      break;
    }
    case 'bandana': {
      // Street Tuner Knotted Headband around forehead
      const bandanaGroup = new THREE.Group();
      bandanaGroup.name = 'Bandana';

      const clothMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 });
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.012, 8, 24), clothMat);
      band.position.set(0, 0.155, 0.025);
      band.rotation.x = Math.PI / 2 + 0.12;
      bandanaGroup.add(band);

      // Knotted tails at back
      const knot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 8), clothMat);
      knot.position.set(0, 0.145, -0.092);
      bandanaGroup.add(knot);

      items.headItem = tagInstanceMesh(bandanaGroup);
      break;
    }
    case 'tool_belt': {
      // Heavy Saddle Leather Tool Holster + Chrome Wrench on hips
      const holsterGroup = new THREE.Group();
      holsterGroup.name = 'ToolHolster';

      const leatherMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.75 });
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.15 });

      const belt = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.018, 8, 24), leatherMat);
      belt.position.set(0, 0.0, 0.01);
      belt.rotation.x = Math.PI / 2;
      holsterGroup.add(belt);

      // Pouch on right hip
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.05), leatherMat);
      pouch.position.set(0.18, -0.05, 0.02);
      holsterGroup.add(pouch);

      // Chrome Wrench sticking out of pouch
      const wrenchHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.19, 8), chromeMat);
      wrenchHandle.position.set(0.18, 0.02, 0.03);
      wrenchHandle.rotation.z = -0.3;
      holsterGroup.add(wrenchHandle);

      items.hipsItem = tagInstanceMesh(holsterGroup);
      break;
    }
    case 'mechanic_gloves': {
      // Knuckle Armor Work Plates on hand
      const gloveGroup = new THREE.Group();
      gloveGroup.name = 'MechanicGloves';

      const knuckleMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.25 });
      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.015, 0.03), knuckleMat);
      plate.position.set(0, 0.03, 0.01);
      gloveGroup.add(plate);

      items.handItem = tagInstanceMesh(gloveGroup);
      break;
    }
    case 'none':
    default:
      break;
  }

  return items;
}

// ---------------------------------------------------------------------------
// MAIN EXPORT: createHumanCharacter
// ---------------------------------------------------------------------------

export function createHumanCharacter(config: CharacterCustomization): CharacterRig {
  const rootGroup = new THREE.Group();
  rootGroup.name = `HumanAvatar_${config.name || 'Driver'}`;

  let mixer: THREE.AnimationMixer | null = null;
  const actions: Record<string, THREE.AnimationAction> = {};
  let currentAction: THREE.AnimationAction | null = null;

  // Stature and proportions scaling based on gender and bodyType
  let scaleX = 1.0;
  let scaleY = 1.0;
  let scaleZ = 1.0;

  if (config.gender === 'female') {
    scaleX = 0.93;
    scaleY = 0.97;
    scaleZ = 0.93;
  } else if (config.gender === 'male') {
    scaleX = 1.02;
    scaleY = 1.01;
    scaleZ = 1.02;
  }

  switch (config.bodyType) {
    case 'muscular':
      scaleX *= 1.10;
      scaleY *= 1.02;
      scaleZ *= 1.08;
      break;
    case 'slim':
      scaleX *= 0.92;
      scaleY *= 0.99;
      scaleZ *= 0.92;
      break;
    case 'heavy':
      scaleX *= 1.16;
      scaleY *= 0.98;
      scaleZ *= 1.18;
      break;
    case 'athletic':
    default:
      break;
  }

  // Parse colors
  const skinToneObj = SKIN_TONES[config.race] || SKIN_TONES.tan;
  const skinColor = new THREE.Color(skinToneObj.hex);
  const lipColorHex = skinToneObj.lipHex || 0xb45349;
  const clothingColor = new THREE.Color(config.clothingColor || '#0284c7');
  const pantsColor = new THREE.Color(config.pantsColor || '#1e293b');
  const bootsColor = new THREE.Color(0x18181b);
  const hairColorHex = HAIR_COLORS[config.hairColor]?.hex || HAIR_COLORS.dark_brown.hex;
  const eyeColorHex = EYE_COLORS[config.eyeColor || 'brown']?.hex || EYE_COLORS.brown.hex;

  // Setup model instance
  const setupModel = (sourceModel: THREE.Group, animations: THREE.AnimationClip[]) => {
    // 1. Skeleton clone ensures duplicate skinned meshes have independent bone transforms
    const model = skeletonClone(sourceModel) as THREE.Group;
    model.scale.set(scaleX, scaleY, scaleZ);
    rootGroup.add(model);

    // 2. Locate Bones for Attaching Head/Neck/Hips/Hand items
    let headBone: THREE.Bone | null = null;
    let neckBone: THREE.Bone | null = null;
    let hipsBone: THREE.Bone | null = null;
    let rightHandBone: THREE.Bone | null = null;

    model.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        const name = child.name;
        if (name.includes('Head') && !name.includes('Top') && !name.includes('Eye')) {
          headBone = child as THREE.Bone;
        } else if (name.includes('Neck')) {
          neckBone = child as THREE.Bone;
        } else if (name.includes('Hips')) {
          hipsBone = child as THREE.Bone;
        } else if (name.includes('RightHand') && !name.includes('Thumb') && !name.includes('Index')) {
          rightHandBone = child as THREE.Bone;
        }
      }
    });

    // 3. Apply Realistic Vertex Coloring & PBR Materials to Skinned Human Mesh
    let surfaceMesh: THREE.SkinnedMesh | null = null;
    let jointsMesh: THREE.SkinnedMesh | null = null;

    model.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        const mesh = child as THREE.SkinnedMesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.name === 'Beta_Surface' || mesh.name.toLowerCase().includes('surface') || !surfaceMesh) {
          surfaceMesh = mesh;
        } else {
          jointsMesh = mesh;
        }
      }
    });

    const isGloves = config.accessory === 'mechanic_gloves';
    const isShortSleeve = config.clothing === 'tuner_tshirt' || config.clothing === 'utility_vest';
    const isTattoo = config.skinDetail === 'tattoos';

    // Apply vertex colors to Surface Mesh (Skin, Wardrobe, Pants, Boots)
    if (surfaceMesh) {
      const origGeom = (surfaceMesh as THREE.SkinnedMesh).geometry;
      const geom = origGeom.clone();
      (surfaceMesh as THREE.SkinnedMesh).geometry = geom;
      (surfaceMesh as THREE.SkinnedMesh).userData.isClonedGeometry = true;

      const skeleton = (surfaceMesh as THREE.SkinnedMesh).skeleton;
      const pos = geom.attributes.position;
      const joints = geom.attributes.skinIndex;
      const weights = geom.attributes.skinWeight;

      if (skeleton && pos && joints && weights) {
        const colors = new Float32Array(pos.count * 3);

        for (let i = 0; i < pos.count; i++) {
          let maxW = -1;
          let domJoint = 0;
          for (let k = 0; k < 4; k++) {
            const w = weights.getComponent(i, k);
            if (w > maxW) {
              maxW = w;
              domJoint = joints.getComponent(i, k);
            }
          }
          const bone = skeleton.bones[domJoint];
          const bName = bone ? bone.name : '';

          let targetCol = skinColor;

          if (bName.includes('Head') || bName.includes('Neck')) {
            targetCol = skinColor;
          } else if (bName.includes('Hand') || bName.includes('Thumb') || bName.includes('Index') || bName.includes('Pinky') || bName.includes('Middle') || bName.includes('Ring')) {
            targetCol = isGloves ? bootsColor : skinColor;
          } else if (bName.includes('ForeArm')) {
            if (isShortSleeve) {
              targetCol = (isTattoo && bName.includes('Left')) ? new THREE.Color(0x1e293b) : skinColor;
            } else {
              targetCol = clothingColor;
            }
          } else if (bName.includes('Arm')) {
            targetCol = isShortSleeve ? skinColor : clothingColor;
          } else if (bName.includes('Foot') || bName.includes('Toe')) {
            targetCol = bootsColor;
          } else if (bName.includes('UpLeg') || bName.includes('Leg')) {
            targetCol = pantsColor;
          } else if (bName.includes('Hips')) {
            targetCol = config.clothing === 'mechanic_overalls' ? clothingColor : pantsColor;
          } else {
            targetCol = clothingColor;
          }

          colors[i * 3] = targetCol.r;
          colors[i * 3 + 1] = targetCol.g;
          colors[i * 3 + 2] = targetCol.b;
        }

        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        (surfaceMesh as THREE.SkinnedMesh).material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.62,
          metalness: 0.05,
        });
      }
    }

    // Apply matching materials and vertex colors to Joints Mesh
    if (jointsMesh) {
      const origGeom = (jointsMesh as THREE.SkinnedMesh).geometry;
      const geom = origGeom.clone();
      (jointsMesh as THREE.SkinnedMesh).geometry = geom;
      (jointsMesh as THREE.SkinnedMesh).userData.isClonedGeometry = true;

      const skeleton = (jointsMesh as THREE.SkinnedMesh).skeleton;
      const pos = geom.attributes.position;
      const joints = geom.attributes.skinIndex;
      const weights = geom.attributes.skinWeight;

      if (skeleton && pos && joints && weights) {
        const colors = new Float32Array(pos.count * 3);

        for (let i = 0; i < pos.count; i++) {
          let maxW = -1;
          let domJoint = 0;
          for (let k = 0; k < 4; k++) {
            const w = weights.getComponent(i, k);
            if (w > maxW) {
              maxW = w;
              domJoint = joints.getComponent(i, k);
            }
          }
          const bone = skeleton.bones[domJoint];
          const bName = bone ? bone.name : '';

          let targetCol = skinColor;
          if (bName.includes('Hand') || bName.includes('Thumb') || bName.includes('Finger') || bName.includes('Index')) {
            targetCol = isGloves ? bootsColor : skinColor;
          } else if (bName.includes('ForeArm') || bName.includes('Arm')) {
            targetCol = isShortSleeve ? skinColor : clothingColor;
          } else if (bName.includes('Foot')) {
            targetCol = bootsColor;
          } else if (bName.includes('Leg') || bName.includes('UpLeg')) {
            targetCol = pantsColor;
          } else {
            targetCol = clothingColor;
          }

          colors[i * 3] = targetCol.r * 0.92;
          colors[i * 3 + 1] = targetCol.g * 0.92;
          colors[i * 3 + 2] = targetCol.b * 0.92;
        }

        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        (jointsMesh as THREE.SkinnedMesh).material = new THREE.MeshStandardMaterial({
          vertexColors: true,
          roughness: 0.5,
          metalness: 0.2,
        });
      }
    }

    // 4. Attach High-Fidelity Facial Features, Hairstyle, Accessories
    const acc = createAccessories(config.accessory);

    if (headBone) {
      const headAnchor = new THREE.Group();
      headAnchor.name = 'HeadAnchorScaled';
      headAnchor.scale.set(100, 100, 100);
      (headBone as THREE.Bone).add(headAnchor);

      // Attach Detailed Face Features (3D Eyes with Corneal Sheen, Arched Brows, Sculpted Nose, Natural Lips)
      const faceFeatures = createDetailedFaceFeatures(
        skinColor.getHex(),
        eyeColorHex,
        hairColorHex,
        lipColorHex,
        config.gender
      );
      headAnchor.add(faceFeatures);

      // Attach High-Quality Hairstyle (Layered Splines & Anisotropic Sheen)
      const hair = createHairstyle(config.hairStyle, hairColorHex);
      headAnchor.add(hair);

      // Attach Facial Hair (Omit if female)
      if (config.gender !== 'female') {
        const facialHair = createFacialHair(config.facialHair, hairColorHex);
        headAnchor.add(facialHair);
      }

      // Attach Complexion Details (Freckles / Grease smudges)
      const skinDetails = createHeadSkinDetails(config.skinDetail);
      if (skinDetails) headAnchor.add(skinDetails);

      // Head Accessories (Cap, Goggles, Shades, Aviators, Mask, Bandana)
      if (acc.headItem) headAnchor.add(acc.headItem);
    }

    if (neckBone && acc.neckItem) {
      const neckAnchor = new THREE.Group();
      neckAnchor.name = 'NeckAnchorScaled';
      neckAnchor.scale.set(100, 100, 100);
      (neckBone as THREE.Bone).add(neckAnchor);
      neckAnchor.add(acc.neckItem);
    }

    if (hipsBone && acc.hipsItem) {
      const hipsAnchor = new THREE.Group();
      hipsAnchor.name = 'HipsAnchorScaled';
      hipsAnchor.scale.set(100, 100, 100);
      (hipsBone as THREE.Bone).add(hipsAnchor);
      hipsAnchor.add(acc.hipsItem);
    }

    if (rightHandBone && acc.handItem) {
      const handAnchor = new THREE.Group();
      handAnchor.name = 'HandAnchorScaled';
      handAnchor.scale.set(100, 100, 100);
      (rightHandBone as THREE.Bone).add(handAnchor);
      handAnchor.add(acc.handItem);
    }

    // 5. Initialize Animation Mixer with Motion-Captured Clips
    if (animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);

      animations.forEach((clip) => {
        const action = mixer!.clipAction(clip);
        actions[clip.name] = action;
      });

      if (actions['idle']) {
        currentAction = actions['idle'];
        currentAction.play();
      } else if (animations[0]) {
        currentAction = mixer.clipAction(animations[0]);
        currentAction.play();
      }
    }
  };

  // If already loaded in cache, setup immediately
  if (cachedModel && cachedModel.animations.length > 0) {
    setupModel(cachedModel.scene, cachedModel.animations);
  } else {
    preloadHumanModel().then((data) => {
      if (data && data.scene) {
        setupModel(data.scene, data.animations);
      }
    });
  }

  // Animation & Pose Controller API
  const updateAnimation = (dt: number, isMoving: boolean, isSprinting: boolean) => {
    if (!mixer) return;

    let targetActionName = 'idle';
    if (isMoving) {
      targetActionName = isSprinting && actions['run'] ? 'run' : actions['walk'] ? 'walk' : 'run';
    }

    const nextAction = actions[targetActionName];
    if (nextAction && currentAction !== nextAction) {
      if (currentAction) {
        currentAction.fadeOut(0.22);
      }
      nextAction.reset().fadeIn(0.22).play();
      currentAction = nextAction;
    }

    mixer.update(dt);
  };

  const setPose = (pose: CharacterPreviewPose) => {
    if (!mixer) return;

    let actionName = 'idle';
    if (pose === 'walk') {
      actionName = actions['walk'] ? 'walk' : actions['run'] ? 'run' : 'idle';
    } else if (pose === 'inspect') {
      actionName = actions['idle'] ? 'idle' : 'walk';
    }

    const targetAction = actions[actionName];
    if (targetAction && currentAction !== targetAction) {
      if (currentAction) {
        currentAction.fadeOut(0.25);
      }
      targetAction.reset().fadeIn(0.25).play();
      currentAction = targetAction;
    }
  };

  // Safe dispose: Only disposes cloned geometries & instance procedural materials
  const dispose = () => {
    if (mixer) {
      mixer.stopAllAction();
      mixer.uncacheRoot(rootGroup);
    }
    rootGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.userData && (mesh.userData.isClonedGeometry || mesh.userData.isInstanceGeometry)) {
          if (mesh.geometry) mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  };

  return {
    group: rootGroup,
    updateAnimation,
    setPose,
    dispose,
  };
}
