import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  Car,
  Compass,
  Footprints,
  Gauge,
  Volume2,
  VolumeX,
  Eye,
  Sparkles,
  Wrench,
  Droplets,
  Zap,
  Disc3,
  MapPin,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Sun,
  Moon,
  Sunset,
  Navigation,
  Flag,
  DollarSign,
  Layers,
  Fuel,
} from 'lucide-react';
import { CarPart, WorkstationType, CameraPerspective, PlayerControlMode } from '../types';
import { soundFx } from '../utils/audio';

interface OpenWorld3DProps {
  parts: CarPart[];
  cash: number;
  onOpenStation: (station: WorkstationType) => void;
  onOpenMapShop: (tab: 'junkyard' | 'parts_store' | 'tire_shop' | 'buyers') => void;
  garageName: string;
}

interface WorldLocation {
  id: string;
  name: string;
  pos: THREE.Vector3;
  radius: number;
  type: 'station' | 'shop' | 'buyer';
  stationType?: WorkstationType;
  shopTab?: 'junkyard' | 'parts_store' | 'tire_shop' | 'buyers';
  prompt: string;
  color: string;
  iconName: string;
}

type LightingPreset = 'sunset' | 'night' | 'day';

// Helper: Generate procedural textures using HTML Canvas
function createTextSignTexture(
  mainText: string,
  subText: string,
  fgColor: string,
  bgColor: string,
  accentColor: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 512, 128);

  // Border frame
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 116);

  // Glow line
  ctx.fillStyle = accentColor;
  ctx.fillRect(10, 10, 492, 4);

  // Main text
  ctx.fillStyle = fgColor;
  ctx.font = 'bold 36px "Plus Jakarta Sans", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mainText, 256, 56);

  // Subtitle
  if (subText) {
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 18px "Space Grotesk", monospace';
    ctx.fillText(subText, 256, 94);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// Asphalt road texture with realistic aggregate and wear
function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#22252a';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle noise grain
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const val = Math.floor(25 + Math.random() * 25);
    ctx.fillStyle = `rgb(${val},${val + 2},${val + 5})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // Double yellow centerline in the middle
  ctx.fillStyle = '#eab308';
  ctx.fillRect(246, 0, 6, 512);
  ctx.fillRect(260, 0, 6, 512);

  // White edge lines
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(20, 0, 6, 512);
  ctx.fillRect(486, 0, 6, 512);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 16);
  return texture;
}

// Concrete apron / floor texture with expansion joints
function createConcreteFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#474c55';
  ctx.fillRect(0, 0, 256, 256);

  // Grid expansion joints
  ctx.strokeStyle = '#2b2e35';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 256, 256);
  ctx.strokeRect(128, 0, 1, 256);
  ctx.strokeRect(0, 128, 256, 1);

  // Oil stain splatters
  ctx.fillStyle = 'rgba(25, 25, 28, 0.45)';
  ctx.beginPath();
  ctx.arc(80, 70, 25, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(170, 180, 35, 0, Math.PI * 2);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// Caution curb striping
function createCautionStripesTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 128, 128);

  ctx.fillStyle = '#18181b';
  for (let i = -128; i < 256; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 20, 0);
    ctx.lineTo(i + 20 + 128, 128);
    ctx.lineTo(i + 128, 128);
    ctx.closePath();
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 1);
  return texture;
}

export const OpenWorld3D: React.FC<OpenWorld3DProps> = ({
  parts,
  cash,
  onOpenStation,
  onOpenMapShop,
  garageName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Gameplay State
  const [controlMode, setControlMode] = useState<PlayerControlMode>('on_foot');
  const [perspective, setPerspective] = useState<CameraPerspective>('third_person');
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('sunset');
  const [activePrompt, setActivePrompt] = useState<{
    text: string;
    action: () => void;
  } | null>(null);
  const [currentLocationName, setCurrentLocationName] = useState<string>('Rust Valley Speed & Custom');
  const [speedMph, setSpeedMph] = useState<number>(0);
  const [rpm, setRpm] = useState<number>(850);
  const [fuelPct, setFuelPct] = useState<number>(92);
  const [radarRotation, setRadarRotation] = useState<number>(0);
  const [gpsDistance, setGpsDistance] = useState<number>(0);
  const [closestPoi, setClosestPoi] = useState<WorldLocation | null>(null);

  // Input state (Keyboard)
  const inputRef = useRef({
    forward: false,
    backward: false,
    left: false,
    right: false,
    sprint: false,
    handbrake: false,
  });

  // Virtual Analog Joystick State & Refs
  const joystickRef = useRef({ x: 0, y: 0, active: false });
  const [joystickPos, setJoystickPos] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const joystickContainerRef = useRef<HTMLDivElement | null>(null);

  // 360° Camera Look & Orbit State
  const camAngleYaw = useRef<number>(0); // Horizontal look angle (radians)
  const camAnglePitch = useRef<number>(0.24); // Vertical elevation pitch (radians)
  const lookSwipeRef = useRef<{
    active: boolean;
    pointerId: number | null;
    lastX: number;
    lastY: number;
  }>({ active: false, pointerId: null, lastX: 0, lastY: 0 });
  const timeSinceLastLookSwipe = useRef<number>(999);
  const [hasSwipedLook, setHasSwipedLook] = useState<boolean>(false);

  // Positions & Physics references
  const playerPos = useRef(new THREE.Vector3(-25, 0.9, 0)); // Inside garage initially
  const playerAngle = useRef(0);
  const carPos = useRef(new THREE.Vector3(-25, 0.45, 4)); // In the garage bay
  const carAngle = useRef(0);
  const carSpeed = useRef(0);
  const carSteer = useRef(0);

  // Three.js scene refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carMeshRef = useRef<THREE.Group | null>(null);
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const wheelsRef = useRef<THREE.Mesh[]>([]);
  const brakeLightsRef = useRef<THREE.Mesh[]>([]);
  const flameMeshRef = useRef<THREE.Mesh | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const animatedBeaconsRef = useRef<THREE.Group[]>([]);

  // World Interactive Points of Interest (POIs)
  const locations: WorldLocation[] = [
    // Inside garage stations
    {
      id: 'loc-wash',
      name: 'Parts Wash Bay',
      pos: new THREE.Vector3(-33, 0, -4),
      radius: 4.5,
      type: 'station',
      stationType: 'wash',
      prompt: 'USE PARTS WASH BAY',
      color: '#06b6d4',
      iconName: 'Droplets',
    },
    {
      id: 'loc-workbench',
      name: 'Machinist Workbench',
      pos: new THREE.Vector3(-33, 0, 4),
      radius: 4.5,
      type: 'station',
      stationType: 'workbench',
      prompt: 'USE REPAIR BENCH',
      color: '#f59e0b',
      iconName: 'Wrench',
    },
    {
      id: 'loc-battery',
      name: 'Commercial Battery Charger',
      pos: new THREE.Vector3(-18, 0, -5),
      radius: 4.5,
      type: 'station',
      stationType: 'battery',
      prompt: 'USE BATTERY CHARGER',
      color: '#eab308',
      iconName: 'Zap',
    },
    {
      id: 'loc-tire-mach',
      name: 'Pneumatic Tire Turntable',
      pos: new THREE.Vector3(-18, 0, 5),
      radius: 4.5,
      type: 'station',
      stationType: 'tire_machine',
      prompt: 'USE TIRE MACHINE',
      color: '#f97316',
      iconName: 'Disc3',
    },

    // Open World Commercial Districts
    {
      id: 'loc-garage',
      name: 'Your Workshop Bay',
      pos: new THREE.Vector3(-26, 0, 0),
      radius: 12,
      type: 'station',
      prompt: 'ENTER WORKSHOP FLOOR',
      color: '#f59e0b',
      iconName: 'Wrench',
    },
    {
      id: 'loc-junkyard',
      name: 'County Auto Salvage & Yard',
      pos: new THREE.Vector3(52, 0, -65),
      radius: 20,
      type: 'shop',
      shopTab: 'junkyard',
      prompt: 'SCOUT BEATERS AT JUNKYARD',
      color: '#ea580c',
      iconName: 'Flag',
    },
    {
      id: 'loc-speed-shop',
      name: 'Apex Speed & Performance Store',
      pos: new THREE.Vector3(-55, 0, 65),
      radius: 16,
      type: 'shop',
      shopTab: 'parts_store',
      prompt: 'BUY TUNING PARTS AT SPEED SHOP',
      color: '#38bdf8',
      iconName: 'Wrench',
    },
    {
      id: 'loc-tire-shop',
      name: 'Radial & Rim Tire Depot',
      pos: new THREE.Vector3(-55, 0, -65),
      radius: 16,
      type: 'shop',
      shopTab: 'tire_shop',
      prompt: 'BROWSE TIRES & WHEELS STORE',
      color: '#fb923c',
      iconName: 'Disc3',
    },
    {
      id: 'loc-budget-buyer',
      name: "Rusty Pete's Cash For Cars Lot",
      pos: new THREE.Vector3(52, 0, 25),
      radius: 16,
      type: 'buyer',
      shopTab: 'buyers',
      prompt: "SELL CAR TO RUSTY PETE'S",
      color: '#84cc16',
      iconName: 'DollarSign',
    },
    {
      id: 'loc-elite-buyer',
      name: 'Apex Classics Luxury Showroom',
      pos: new THREE.Vector3(52, 0, 95),
      radius: 16,
      type: 'buyer',
      shopTab: 'buyers',
      prompt: 'AUCTION CAR TO ELITE SHOWROOM',
      color: '#10b981',
      iconName: 'DollarSign',
    },
  ];

  // Enter / Exit Vehicle Action
  const toggleVehicle = useCallback(() => {
    soundFx.playDoorLatch();
    if (controlMode === 'on_foot') {
      const dist = playerPos.current.distanceTo(carPos.current);
      if (dist < 5.5) {
        setControlMode('driving');
        soundFx.playStartEngine();
        camAngleYaw.current = carAngle.current;
        camAnglePitch.current = 0.22;
        timeSinceLastLookSwipe.current = 999;
      }
    } else {
      setControlMode('on_foot');
      const sideOffset = new THREE.Vector3(
        -Math.sin(carAngle.current + Math.PI / 2) * 2.2,
        0.9,
        -Math.cos(carAngle.current + Math.PI / 2) * 2.2
      );
      playerPos.current.copy(carPos.current).add(sideOffset);
      playerAngle.current = carAngle.current;
      camAngleYaw.current = carAngle.current;
      camAnglePitch.current = 0.25;
      timeSinceLastLookSwipe.current = 999;
    }
  }, [controlMode]);

  // Handle Keyboard Input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') inputRef.current.forward = true;
      if (key === 's' || key === 'arrowdown') inputRef.current.backward = true;
      if (key === 'a' || key === 'arrowleft') inputRef.current.left = true;
      if (key === 'd' || key === 'arrowright') inputRef.current.right = true;
      if (key === 'shift') inputRef.current.sprint = true;
      if (key === ' ') inputRef.current.handbrake = true;
      if (key === 'f') toggleVehicle();
      if (key === 'h' && controlMode === 'driving') soundFx.playHorn();
      if (key === 'e' && activePrompt) activePrompt.action();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') inputRef.current.forward = false;
      if (key === 's' || key === 'arrowdown') inputRef.current.backward = false;
      if (key === 'a' || key === 'arrowleft') inputRef.current.left = false;
      if (key === 'd' || key === 'arrowright') inputRef.current.right = false;
      if (key === 'shift') inputRef.current.sprint = false;
      if (key === ' ') inputRef.current.handbrake = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [controlMode, activePrompt, toggleVehicle]);

  // Lighting Preset Switcher
  useEffect(() => {
    if (!sceneRef.current || !sunLightRef.current || !hemiLightRef.current) return;

    if (lightingPreset === 'sunset') {
      // Golden hour sunset with warm orange horizons and long shadows
      sceneRef.current.background = new THREE.Color(0x1a1520);
      sceneRef.current.fog = new THREE.FogExp2(0x1e1526, 0.0055);
      sunLightRef.current.color.setHex(0xffaa5e);
      sunLightRef.current.intensity = 1.6;
      sunLightRef.current.position.set(120, 45, 90);
      hemiLightRef.current.color.setHex(0xffd1a4);
      hemiLightRef.current.groundColor.setHex(0x3a2542);
      hemiLightRef.current.intensity = 0.85;
    } else if (lightingPreset === 'night') {
      // Midnight moonlit atmosphere with high contrast neon
      sceneRef.current.background = new THREE.Color(0x0a0c14);
      sceneRef.current.fog = new THREE.FogExp2(0x0a0c14, 0.007);
      sunLightRef.current.color.setHex(0x60a5fa);
      sunLightRef.current.intensity = 0.45;
      sunLightRef.current.position.set(-60, 90, -40);
      hemiLightRef.current.color.setHex(0x38bdf8);
      hemiLightRef.current.groundColor.setHex(0x090d16);
      hemiLightRef.current.intensity = 0.4;
    } else {
      // Bright crisp midday sunlight
      sceneRef.current.background = new THREE.Color(0x38bdf8);
      sceneRef.current.fog = new THREE.FogExp2(0x60a5fa, 0.0035);
      sunLightRef.current.color.setHex(0xffffff);
      sunLightRef.current.intensity = 1.7;
      sunLightRef.current.position.set(60, 120, 50);
      hemiLightRef.current.color.setHex(0xffffff);
      hemiLightRef.current.groundColor.setHex(0x475569);
      hemiLightRef.current.intensity = 0.95;
    }
  }, [lightingPreset]);

  // Initialize Three.js Open World Scene
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene & Atmosphere Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x1a1520);
    scene.fog = new THREE.FogExp2(0x1e1526, 0.0055);

    // 2. Camera & High-Performance Renderer
    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(56, width / height, 0.1, 900);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    containerRef.current.appendChild(renderer.domElement);

    // 3. Lighting Setup
    const hemiLight = new THREE.HemisphereLight(0xffd1a4, 0x3a2542, 0.85);
    hemiLightRef.current = hemiLight;
    scene.add(hemiLight);

    const sunLight = new THREE.DirectionalLight(0xffaa5e, 1.6);
    sunLight.position.set(120, 45, 90);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 10;
    sunLight.shadow.camera.far = 380;
    sunLight.shadow.camera.left = -160;
    sunLight.shadow.camera.right = 160;
    sunLight.shadow.camera.top = 160;
    sunLight.shadow.camera.bottom = -160;
    sunLight.shadow.bias = -0.0005;
    sunLightRef.current = sunLight;
    scene.add(sunLight);

    // 4. Terrain & Landscape
    // Vast ground plane
    const terrainGeo = new THREE.PlaneGeometry(750, 750, 32, 32);
    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x222a22,
      roughness: 0.92,
      metalness: 0.04,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);

    // Distant Mountain Ranges on the horizon (Layered silhouettes for scenic depth)
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x181724,
      roughness: 0.95,
      flatShading: true,
    });

    for (let angle = 0; angle < Math.PI * 2; angle += 0.35) {
      const dist = 260 + Math.random() * 40;
      const mHeight = 45 + Math.random() * 55;
      const mWidth = 70 + Math.random() * 45;
      const mGeo = new THREE.ConeGeometry(mWidth, mHeight, 5);
      const mountain = new THREE.Mesh(mGeo, mountainMat);
      mountain.position.set(Math.cos(angle) * dist, mHeight / 2 - 5, Math.sin(angle) * dist);
      scene.add(mountain);
    }

    // 5. Road System & Intersections
    const asphaltTex = createAsphaltTexture();
    const roadMat = new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.75,
      metalness: 0.15,
    });

    // North-South Main Highway (400 units long)
    const mainRoadGeo = new THREE.PlaneGeometry(16, 400);
    const mainRoad = new THREE.Mesh(mainRoadGeo, roadMat);
    mainRoad.rotation.x = -Math.PI / 2;
    mainRoad.position.set(0, 0.03, 0);
    mainRoad.receiveShadow = true;
    scene.add(mainRoad);

    // Concrete Sidewalks and Curbs along Highway
    const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x474c55, roughness: 0.85 });
    [-9, 9].forEach((xSide) => {
      const walkGeo = new THREE.BoxGeometry(2.4, 0.25, 400);
      const walk = new THREE.Mesh(walkGeo, sidewalkMat);
      walk.position.set(xSide, 0.12, 0);
      walk.receiveShadow = true;
      scene.add(walk);
    });

    // East-West Connecting Boulevards
    const crossRoadPositions = [-65, 0, 65];
    crossRoadPositions.forEach((zPos) => {
      const crossGeo = new THREE.PlaneGeometry(160, 14);
      const crossRoad = new THREE.Mesh(crossGeo, roadMat);
      crossRoad.rotation.x = -Math.PI / 2;
      crossRoad.position.set(0, 0.04, zPos);
      crossRoad.receiveShadow = true;
      scene.add(crossRoad);
    });

    // Highway Streetlights with warm downward sodium lighting
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, metalness: 0.8 });
    for (let z = -180; z <= 180; z += 45) {
      [-10.5, 10.5].forEach((xPole, poleIdx) => {
        const poleGroup = new THREE.Group();
        poleGroup.position.set(xPole, 0, z);

        // Vertical Pole
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 9, 12), poleMat);
        mast.position.y = 4.5;
        mast.castShadow = true;
        poleGroup.add(mast);

        // Curved Overhanging Arm
        const arm = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 0.2), poleMat);
        arm.position.set(poleIdx === 0 ? 1.1 : -1.1, 8.8, 0);
        poleGroup.add(arm);

        // Lamp Fixture
        const lamp = new THREE.Mesh(
          new THREE.BoxGeometry(0.8, 0.3, 0.4),
          new THREE.MeshBasicMaterial({ color: 0xfef08a })
        );
        lamp.position.set(poleIdx === 0 ? 2.2 : -2.2, 8.7, 0);
        poleGroup.add(lamp);

        // Street Light Glow
        const streetLight = new THREE.PointLight(0xffedd5, 1.4, 28, 1.8);
        streetLight.position.set(poleIdx === 0 ? 2.2 : -2.2, 8.4, 0);
        poleGroup.add(streetLight);

        scene.add(poleGroup);
      });
    }

    // Overhead Utility Power Poles & Lines along outer road
    for (let z = -150; z <= 150; z += 60) {
      const utilPole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.28, 11, 8),
        new THREE.MeshStandardMaterial({ color: 0x452918, roughness: 0.9 })
      );
      utilPole.position.set(-16, 5.5, z);
      utilPole.castShadow = true;
      scene.add(utilPole);

      // Cross arm
      const crossArm = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 0.2, 0.2),
        new THREE.MeshStandardMaterial({ color: 0x3d271d })
      );
      crossArm.position.set(-16, 10.4, z);
      scene.add(crossArm);
    }

    // 6. PROCEDURAL VEGETATION & FOLIAGE
    // Lush Pine trees and oak trees spread across roadside and lots
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.95 });
    const pineMat1 = new THREE.MeshStandardMaterial({ color: 0x1b3d22, roughness: 0.85, flatShading: true });
    const pineMat2 = new THREE.MeshStandardMaterial({ color: 0x274e2d, roughness: 0.85, flatShading: true });
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9 });

    const createPineTree = (x: number, z: number, scale = 1) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0, z);
      treeGroup.scale.set(scale, scale, scale);

      // Trunk
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 3), trunkMat);
      trunk.position.y = 1.5;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Tiered foliage cones
      [
        { r: 2.8, h: 3.5, y: 3.8, mat: pineMat1 },
        { r: 2.2, h: 3.0, y: 5.8, mat: pineMat2 },
        { r: 1.5, h: 2.6, y: 7.6, mat: pineMat1 },
      ].forEach((tier) => {
        const cone = new THREE.Mesh(new THREE.ConeGeometry(tier.r, tier.h, 7), tier.mat);
        cone.position.y = tier.y;
        cone.castShadow = true;
        treeGroup.add(cone);
      });

      scene.add(treeGroup);
    };

    // Plant groves around the map
    const treeCoords = [
      // Along West edge
      [-32, -25], [-35, -15], [-30, 25], [-33, 35], [-75, 20], [-72, -20],
      // East edge & open fields
      [28, -25], [32, 10], [30, 50], [28, -85], [75, 45], [78, -30],
      // Around Junkyard borders
      [35, -85], [72, -85], [70, -45],
      // Around Showroom
      [35, 115], [68, 115], [72, 75],
    ];
    treeCoords.forEach(([tx, tz]) => {
      createPineTree(tx, tz, 0.85 + Math.random() * 0.4);
    });

    // Decorative shrubs along road curbs
    for (let z = -140; z <= 140; z += 18) {
      if (Math.abs(z) > 15) {
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9 + Math.random() * 0.4), bushMat);
        bush.position.set(-11.5 - Math.random() * 2, 0.7, z);
        bush.castShadow = true;
        scene.add(bush);
      }
    }

    // 7. BUILDINGS & OPEN WORLD COMMERCIAL ZONES

    // ========================================================
    // ZONE 1: PLAYER'S GARAGE & WORKSHOP APARTMENT (X: -26, Z: 0)
    // ========================================================
    const garageGroup = new THREE.Group();
    garageGroup.position.set(-26, 0, 0);

    // Concrete Apron
    const concreteTex = createConcreteFloorTexture();
    const slabGeo = new THREE.BoxGeometry(26, 0.35, 24);
    const slabMat = new THREE.MeshStandardMaterial({
      map: concreteTex,
      roughness: 0.7,
      metalness: 0.1,
    });
    const slab = new THREE.Mesh(slabGeo, slabMat);
    slab.position.y = 0.15;
    slab.receiveShadow = true;
    garageGroup.add(slab);

    // Caution striped entrance ramp
    const cautionTex = createCautionStripesTexture();
    const rampMat = new THREE.MeshStandardMaterial({ map: cautionTex, roughness: 0.6 });
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 2.5), rampMat);
    ramp.position.set(0, 0.1, 12);
    garageGroup.add(ramp);

    // Main Garage Workshop Structure (Industrial Brick & Weathered Siding)
    const garageWallMat = new THREE.MeshStandardMaterial({ color: 0x4a3a30, roughness: 0.88 });
    // Back Wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(26, 7.5, 0.8), garageWallMat);
    backWall.position.set(0, 3.75, -11.6);
    backWall.castShadow = true;
    garageGroup.add(backWall);

    // Left Wall
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.5, 24), garageWallMat);
    leftWall.position.set(-12.6, 3.75, 0);
    leftWall.castShadow = true;
    garageGroup.add(leftWall);

    // Right Wall (Office section)
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7.5, 12), garageWallMat);
    rightWall.position.set(12.6, 3.75, -6);
    rightWall.castShadow = true;
    garageGroup.add(rightWall);

    // Roof Trusses & Corrugated Metal Pitch Roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.75, metalness: 0.4 });
    const roofLeft = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 26), roofMat);
    roofLeft.rotation.z = 0.14;
    roofLeft.position.set(-6.5, 7.8, 0);
    roofLeft.castShadow = true;
    garageGroup.add(roofLeft);

    const roofRight = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 26), roofMat);
    roofRight.rotation.z = -0.14;
    roofRight.position.set(6.5, 7.8, 0);
    roofRight.castShadow = true;
    garageGroup.add(roofRight);

    // Hydraulic 2-Post Car Lift in the bay
    const liftMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, metalness: 0.6, roughness: 0.4 });
    [-2.6, 2.6].forEach((xPost) => {
      const liftPost = new THREE.Mesh(new THREE.BoxGeometry(0.4, 4.8, 0.6), liftMat);
      liftPost.position.set(xPost, 2.4, 4);
      liftPost.castShadow = true;
      garageGroup.add(liftPost);
    });

    // Big Glowing Garage Fascia Sign
    const garageSignTex = createTextSignTexture(
      garageName.toUpperCase(),
      'SPEED & CUSTOM HOT ROD SHOP',
      '#f59e0b',
      '#0f1217',
      '#d97706'
    );
    const gSignMesh = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2.4, 0.3),
      new THREE.MeshStandardMaterial({ map: garageSignTex, roughness: 0.3 })
    );
    gSignMesh.position.set(0, 7.6, 12.2);
    garageGroup.add(gSignMesh);

    // Hanging Industrial Overhead Bay Lights
    const bayLight = new THREE.PointLight(0xffedd5, 2.4, 22);
    bayLight.position.set(0, 6.2, 2);
    garageGroup.add(bayLight);

    // PHYSICAL WORKSTATIONS ON GARAGE FLOOR:
    // 1. Wash Station: Stainless tub, high-pressure washer unit & hose reel
    const washGroup = new THREE.Group();
    washGroup.position.set(-8, 0.7, -5);
    const washTub = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1.4, 3),
      new THREE.MeshStandardMaterial({ color: 0x0891b2, roughness: 0.3, metalness: 0.5 })
    );
    washTub.castShadow = true;
    washGroup.add(washTub);
    const washerUnit = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.8, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 })
    );
    washerUnit.position.set(1.6, 0.2, 0);
    washerUnit.castShadow = true;
    washGroup.add(washerUnit);
    garageGroup.add(washGroup);

    // 2. Machinist Workbench: Solid maple butcherblock bench, bench grinder & vice
    const benchGroup = new THREE.Group();
    benchGroup.position.set(-8, 0.8, 5);
    const benchTop = new THREE.Mesh(
      new THREE.BoxGeometry(4.5, 1.4, 1.8),
      new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 })
    );
    benchTop.castShadow = true;
    benchGroup.add(benchTop);
    const redToolChest = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.2, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xdc2626, metalness: 0.7, roughness: 0.3 })
    );
    redToolChest.position.set(-2.5, 0.4, 0);
    redToolChest.castShadow = true;
    benchGroup.add(redToolChest);
    garageGroup.add(benchGroup);

    // 3. Heavy-Duty Battery Charger Cart on rubber casters
    const chargerGroup = new THREE.Group();
    chargerGroup.position.set(8.5, 0.8, -5);
    const chargerCart = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.8, 1.4),
      new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.4 })
    );
    chargerCart.castShadow = true;
    chargerGroup.add(chargerCart);
    garageGroup.add(chargerGroup);

    // 4. Pneumatic Tire Machine & Wheel Balancer
    const tireMachGroup = new THREE.Group();
    tireMachGroup.position.set(8.5, 0.8, 5);
    const tireTurntable = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.3, 1.6, 16),
      new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.5, metalness: 0.5 })
    );
    tireTurntable.castShadow = true;
    tireMachGroup.add(tireTurntable);
    garageGroup.add(tireMachGroup);

    scene.add(garageGroup);

    // ========================================================
    // ZONE 2: COUNTY AUTO SALVAGE & JUNKYARD (X: 52, Z: -65)
    // ========================================================
    const junkyardGroup = new THREE.Group();
    junkyardGroup.position.set(52, 0, -65);

    // Gravel & Dirt Soil Base
    const junkGround = new THREE.Mesh(
      new THREE.PlaneGeometry(54, 48),
      new THREE.MeshStandardMaterial({ color: 0x3d3023, roughness: 0.98 })
    );
    junkGround.rotation.x = -Math.PI / 2;
    junkGround.position.y = 0.03;
    junkGround.receiveShadow = true;
    junkyardGroup.add(junkGround);

    // Heavy Corrugated Tin & Chainlink Perimeter Fencing
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.7, roughness: 0.6 });
    for (let x = -26; x <= 26; x += 6) {
      if (Math.abs(x) > 6) {
        const fencePost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.8), fenceMat);
        fencePost.position.set(x, 1.9, 24);
        junkyardGroup.add(fencePost);
      }
      const backPost = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.8), fenceMat);
      backPost.position.set(x, 1.9, -24);
      junkyardGroup.add(backPost);
    }

    // Industrial Scrap Metal Crane with Boom & Magnetic Grapple
    const craneGroup = new THREE.Group();
    craneGroup.position.set(16, 0, -10);
    const craneTower = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 9, 3.5),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.6, roughness: 0.4 })
    );
    craneTower.position.y = 4.5;
    craneTower.castShadow = true;
    craneGroup.add(craneTower);

    const craneBoom = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xca8a04, metalness: 0.6, roughness: 0.4 })
    );
    craneBoom.position.set(0, 9.2, 6);
    craneBoom.rotation.x = -0.2;
    craneBoom.castShadow = true;
    craneGroup.add(craneBoom);
    junkyardGroup.add(craneGroup);

    // Weathered Salvage Yard Arch Sign
    const junkSignTex = createTextSignTexture(
      'COUNTY AUTO SALVAGE',
      'WE TOW & PAY CASH FOR JUNK CARS',
      '#f97316',
      '#18181b',
      '#c2410c'
    );
    const jSignMesh = new THREE.Mesh(
      new THREE.BoxGeometry(14, 2.2, 0.3),
      new THREE.MeshStandardMaterial({ map: junkSignTex })
    );
    jSignMesh.position.set(0, 4.6, 24.2);
    junkyardGroup.add(jSignMesh);

    // Weathered Project Beater Car Shells on cinderblocks
    const junkCars = [
      { x: -14, z: 8, rot: 0.25, col: 0x5c2b12, name: 'Beater Fastback' },
      { x: -5, z: -10, rot: -0.6, col: 0x3b332b, name: 'Sedan Shell' },
      { x: 10, z: 12, rot: 1.1, col: 0x472314, name: 'Pickup Truck Wreck' },
      { x: -16, z: -14, rot: 2.2, col: 0x334155, name: 'Coupe Frame' },
    ];
    junkCars.forEach((jc) => {
      const wreck = new THREE.Mesh(
        new THREE.BoxGeometry(4.4, 1.3, 2.0),
        new THREE.MeshStandardMaterial({ color: jc.col, roughness: 0.95, metalness: 0.2 })
      );
      wreck.position.set(jc.x, 0.65, jc.z);
      wreck.rotation.y = jc.rot;
      wreck.castShadow = true;
      junkyardGroup.add(wreck);
    });

    scene.add(junkyardGroup);

    // ========================================================
    // ZONE 3: SPEED & TURBOS PERFORMANCE STORE (X: -55, Z: 65)
    // ========================================================
    const speedShopGroup = new THREE.Group();
    speedShopGroup.position.set(-55, 0, 65);

    // Commercial Storefront Building
    const speedBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(32, 9, 22),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5, metalness: 0.4 })
    );
    speedBuilding.position.y = 4.5;
    speedBuilding.castShadow = true;
    speedShopGroup.add(speedBuilding);

    // Illuminated Showroom Glass Frontage with Blue Ambient Glow
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.8,
    });
    const glassWindow = new THREE.Mesh(new THREE.BoxGeometry(26, 4.5, 0.4), glassMat);
    glassWindow.position.set(0, 3.2, 11.2);
    speedShopGroup.add(glassWindow);

    // Neon Speed Shop Header Sign
    const speedSignTex = createTextSignTexture(
      'APEX PERFORMANCE TUNING',
      'TURBOS • RACING FUELS • DYNO SERVICE',
      '#38bdf8',
      '#090d16',
      '#0284c7'
    );
    const speedSignMesh = new THREE.Mesh(
      new THREE.BoxGeometry(18, 2.4, 0.4),
      new THREE.MeshStandardMaterial({ map: speedSignTex, roughness: 0.2 })
    );
    speedSignMesh.position.set(0, 8.2, 11.3);
    speedShopGroup.add(speedSignMesh);

    // Outdoor Chassis Dyno Ramp Pad with Red/White curbs
    const dynoPad = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.35, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 })
    );
    dynoPad.position.set(0, 0.18, 20);
    speedShopGroup.add(dynoPad);

    scene.add(speedShopGroup);

    // ========================================================
    // ZONE 4: TIRE & WHEEL DEPOT (X: -55, Z: -65)
    // ========================================================
    const tireDepotGroup = new THREE.Group();
    tireDepotGroup.position.set(-55, 0, -65);

    const tireBuilding = new THREE.Mesh(
      new THREE.BoxGeometry(30, 8, 20),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7, metalness: 0.3 })
    );
    tireBuilding.position.y = 4;
    tireBuilding.castShadow = true;
    tireDepotGroup.add(tireBuilding);

    // Giant Tire on Roof Landmark Sculpture
    const roofTire = new THREE.Mesh(
      new THREE.TorusGeometry(3.5, 1.4, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 })
    );
    roofTire.position.set(0, 11.8, 0);
    roofTire.castShadow = true;
    tireDepotGroup.add(roofTire);

    // Tire Shop Fascia Sign
    const tireSignTex = createTextSignTexture(
      'RADIAL & RIM CO.',
      'DRAG SLICKS • TRACK TIRES • CUSTOM WHEELS',
      '#fb923c',
      '#09090b',
      '#ea580c'
    );
    const tireSignMesh = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2.2, 0.4),
      new THREE.MeshStandardMaterial({ map: tireSignTex })
    );
    tireSignMesh.position.set(0, 7.2, 10.3);
    tireDepotGroup.add(tireSignMesh);

    // Stacks of Racing Tires outside
    for (let col = -6; col <= 6; col += 4) {
      for (let h = 0; h < 4; h++) {
        const stackTire = new THREE.Mesh(
          new THREE.CylinderGeometry(1.2, 1.2, 0.45, 16),
          new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.9 })
        );
        stackTire.position.set(col, 0.25 + h * 0.45, 14);
        stackTire.castShadow = true;
        tireDepotGroup.add(stackTire);
      }
    }

    scene.add(tireDepotGroup);

    // ========================================================
    // ZONE 5: CAR BUYERS DISTRICT (BUDGET LOT & APEX SHOWROOM)
    // ========================================================
    // 5A: "Rusty Pete's" Budget Used Car Lot (X: 52, Z: 25)
    const budgetLot = new THREE.Group();
    budgetLot.position.set(52, 0, 25);

    // Used car lot sales trailer
    const trailerOffice = new THREE.Mesh(
      new THREE.BoxGeometry(12, 4.2, 7.5),
      new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
    );
    trailerOffice.position.y = 2.1;
    trailerOffice.castShadow = true;
    budgetLot.add(trailerOffice);

    // String of colorful used-car triangular banners/pennants
    const pennantMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.8 });
    const bannerLine = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 28), pennantMat);
    bannerLine.rotation.z = Math.PI / 2;
    bannerLine.position.set(0, 4.5, 14);
    budgetLot.add(bannerLine);

    const budgetSignTex = createTextSignTexture(
      "RUSTY PETE'S CAR LOT",
      'FAST CASH FOR ANY ROLLING VEHICLE',
      '#a3e635',
      '#1c1917',
      '#65a30d'
    );
    const bSignMesh = new THREE.Mesh(
      new THREE.BoxGeometry(14, 2.0, 0.3),
      new THREE.MeshStandardMaterial({ map: budgetSignTex })
    );
    bSignMesh.position.set(0, 4.8, 14.2);
    budgetLot.add(bSignMesh);
    scene.add(budgetLot);

    // 5B: "Apex Classics" Luxury Showroom (X: 52, Z: 95)
    const eliteLot = new THREE.Group();
    eliteLot.position.set(52, 0, 95);

    // High-End Black Marble & Polished Glass Pavilion
    const eliteShowroom = new THREE.Mesh(
      new THREE.BoxGeometry(32, 10, 24),
      new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.15, metalness: 0.9 })
    );
    eliteShowroom.position.y = 5;
    eliteShowroom.castShadow = true;
    eliteLot.add(eliteShowroom);

    // Golden Halo Sign
    const eliteSignTex = createTextSignTexture(
      'APEX CLASSICS AUCTION',
      'CONSIGNMENT OF FINE HIGH-PERFORMANCE VEHICLES',
      '#f59e0b',
      '#050505',
      '#fbbf24'
    );
    const eSignMesh = new THREE.Mesh(
      new THREE.BoxGeometry(20, 2.6, 0.4),
      new THREE.MeshStandardMaterial({ map: eliteSignTex, roughness: 0.1 })
    );
    eSignMesh.position.set(0, 9.2, -12.3);
    eliteLot.add(eSignMesh);

    // Showroom Uplights (Gold & White)
    const eliteUplight = new THREE.PointLight(0xfef08a, 2.2, 25);
    eliteUplight.position.set(0, 2, -14);
    eliteLot.add(eliteUplight);

    scene.add(eliteLot);

    // 8. 3D FLOATING DESTINATION BEACONS (IN-WORLD WAYPOINT PILLARS)
    // Pulsating glowing beacons over Junkyard, Speed Shop, Tire Shop & Showroom
    animatedBeaconsRef.current = [];
    locations
      .filter((loc) => loc.type !== 'station')
      .forEach((loc) => {
        const beaconGroup = new THREE.Group();
        beaconGroup.position.set(loc.pos.x, 0, loc.pos.z);

        // Vertical light beam pillar
        const beamMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(loc.color),
          transparent: true,
          opacity: 0.25,
          side: THREE.DoubleSide,
        });
        const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 35, 12, 1, true), beamMat);
        beam.position.y = 17.5;
        beaconGroup.add(beam);

        // Floating Diamond Ring at apex
        const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(loc.color) });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.25, 8, 24), ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = 14;
        beaconGroup.add(ring);

        scene.add(beaconGroup);
        animatedBeaconsRef.current.push(beaconGroup);
      });

    // 9. CREATE PLAYABLE 3D VEHICLE
    const carGroup = new THREE.Group();
    carMeshRef.current = carGroup;
    carGroup.position.copy(carPos.current);

    // Aerodynamic Classic Muscle Fastback Body
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      metalness: 0.8,
      roughness: 0.25,
    });
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.78, 4.6);
    const carBody = new THREE.Mesh(bodyGeo, bodyMat);
    carBody.position.y = 0.58;
    carBody.castShadow = true;
    carGroup.add(carBody);

    // Fastback Hood Scoop
    const scoop = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.22, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.4 })
    );
    scoop.position.set(0, 1.05, 1.1);
    carGroup.add(scoop);

    // Sloped Coupe Cabin & Tinted Windows
    const cabinGeo = new THREE.BoxGeometry(1.75, 0.58, 2.3);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.1 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.22, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Dual Chrome Exhaust Pipes at Rear
    [-0.5, 0.5].forEach((pipeX) => {
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.4, 12),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 })
      );
      pipe.rotation.x = Math.PI / 2;
      pipe.position.set(pipeX, 0.28, -2.35);
      carGroup.add(pipe);
    });

    // Dual Forward Projector Headlights
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfffaed });
    [-0.7, 0.7].forEach((hx) => {
      const hLight = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16), headlightMat);
      hLight.rotation.x = Math.PI / 2;
      hLight.position.set(hx, 0.58, 2.32);
      carGroup.add(hLight);
    });

    // High-Intensity Spotlights Beam Casting on the road
    const carSpotlight = new THREE.SpotLight(0xfffaed, 3.2, 45, Math.PI / 5, 0.35);
    carSpotlight.position.set(0, 0.7, 2.4);
    const spotTarget = new THREE.Object3D();
    spotTarget.position.set(0, 0, 20);
    carGroup.add(spotTarget);
    carSpotlight.target = spotTarget;
    carGroup.add(carSpotlight);

    // Rear Red Brake Lights
    brakeLightsRef.current = [];
    [-0.7, 0.7].forEach((bx) => {
      const bLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.16, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x7f1d1d })
      );
      bLight.position.set(bx, 0.65, -2.32);
      carGroup.add(bLight);
      brakeLightsRef.current.push(bLight);
    });

    // 4 High-Performance Wheels with Chrome Rims
    const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 18);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 });
    const wheelPositions = [
      { x: -1.02, y: 0.4, z: 1.4 },
      { x: 1.02, y: 0.4, z: 1.4 },
      { x: -1.02, y: 0.4, z: -1.4 },
      { x: 1.02, y: 0.4, z: -1.4 },
    ];
    wheelsRef.current = [];
    wheelPositions.forEach((wp) => {
      const wheelAssembly = new THREE.Mesh(wheelGeo, wheelMat);
      wheelAssembly.rotation.z = Math.PI / 2;
      wheelAssembly.position.set(wp.x, wp.y, wp.z);
      wheelAssembly.castShadow = true;

      // Chrome wheel center cap
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 12), rimMat);
      wheelAssembly.add(cap);

      carGroup.add(wheelAssembly);
      wheelsRef.current.push(wheelAssembly);
    });

    // Nitrous / Exhaust Backfire Flame Mesh
    const flameGeo = new THREE.ConeGeometry(0.18, 1.1, 8);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.rotation.x = -Math.PI / 2;
    flame.position.set(0.5, 0.28, -2.8);
    flame.visible = false;
    carGroup.add(flame);
    flameMeshRef.current = flame;

    scene.add(carGroup);

    // 10. CREATE 3D MECHANIC ON-FOOT AVATAR
    const playerGroup = new THREE.Group();
    playerMeshRef.current = playerGroup;
    playerGroup.position.copy(playerPos.current);

    // Mechanic Work Coveralls
    const pTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.26, 0.85, 10),
      new THREE.MeshStandardMaterial({ color: 0x0369a1, roughness: 0.65 })
    );
    pTorso.position.y = 0.82;
    pTorso.castShadow = true;
    playerGroup.add(pTorso);

    const pHead = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.8 })
    );
    pHead.position.y = 1.4;
    playerGroup.add(pHead);

    // Mechanic Cap
    const capVisor = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.05, 0.22),
      new THREE.MeshStandardMaterial({ color: 0xd97706 })
    );
    capVisor.position.set(0, 1.5, 0.16);
    playerGroup.add(capVisor);

    scene.add(playerGroup);

    // Handle Window Resizing
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // 11. ANIMATION & PHYSICS ENGINE
    let animationId: number;
    let lastTime = performance.now();
    let footstepTimer = 0;
    let beaconTimer = 0;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Animate floating beacons
      beaconTimer += dt * 2.5;
      animatedBeaconsRef.current.forEach((b, idx) => {
        b.rotation.y += 0.015;
        const ring = b.children[1];
        if (ring) {
          ring.position.y = 14 + Math.sin(beaconTimer + idx) * 1.5;
        }
      });

      // DRIVING MODE PHYSICS
      if (controlMode === 'driving') {
        playerMeshRef.current!.visible = false;

        const maxSpeed = 44; // ~100 MPH
        const accel = 20;
        const decel = 16;
        const turnSpeed = 2.6;

        // Joystick inputs for driving (stickY: forward gas / backward brake, stickX: steering)
        const stickGas = Math.max(0, joystickRef.current.y);
        const stickBrake = Math.max(0, -joystickRef.current.y);
        const stickSteer = joystickRef.current.x;

        const isGas = inputRef.current.forward || stickGas > 0.12;
        const isBrake = inputRef.current.backward || stickBrake > 0.12;

        // Acceleration / Braking
        if (isGas) {
          const gasPower = Math.max(stickGas, inputRef.current.forward ? 1 : 0);
          carSpeed.current = Math.min(carSpeed.current + accel * gasPower * dt, maxSpeed);
          if (flameMeshRef.current) flameMeshRef.current.visible = Math.random() > 0.8;
          brakeLightsRef.current.forEach((bl) => {
            (bl.material as THREE.MeshBasicMaterial).color.setHex(0x7f1d1d);
          });
        } else if (isBrake) {
          const brakePower = Math.max(stickBrake, inputRef.current.backward ? 1 : 0);
          carSpeed.current = Math.max(carSpeed.current - decel * brakePower * dt, -14);
          if (flameMeshRef.current) flameMeshRef.current.visible = false;
          // Glow bright red when braking / reversing
          brakeLightsRef.current.forEach((bl) => {
            (bl.material as THREE.MeshBasicMaterial).color.setHex(0xff0000);
          });
        } else {
          carSpeed.current = THREE.MathUtils.lerp(carSpeed.current, 0, dt * 2.0);
          if (flameMeshRef.current) flameMeshRef.current.visible = false;
          brakeLightsRef.current.forEach((bl) => {
            (bl.material as THREE.MeshBasicMaterial).color.setHex(0x7f1d1d);
          });
        }

        // Steering (combine joystick analog steer with keyboard arrows/A-D)
        let targetSteer = 0;
        if (Math.abs(stickSteer) > 0.08) {
          targetSteer = -stickSteer * 0.48;
        } else if (inputRef.current.left) {
          targetSteer = 0.48;
        } else if (inputRef.current.right) {
          targetSteer = -0.48;
        }
        carSteer.current = THREE.MathUtils.lerp(carSteer.current, targetSteer, dt * 10);

        // Apply turning when vehicle is moving
        if (Math.abs(carSpeed.current) > 0.2) {
          const dir = carSpeed.current > 0 ? 1 : -1;
          carAngle.current += carSteer.current * turnSpeed * dt * dir;
        }

        // Update car position
        const vx = Math.sin(carAngle.current) * carSpeed.current;
        const vz = Math.cos(carAngle.current) * carSpeed.current;
        carPos.current.x += vx * dt;
        carPos.current.z += vz * dt;

        // Map Boundaries
        carPos.current.x = THREE.MathUtils.clamp(carPos.current.x, -140, 140);
        carPos.current.z = THREE.MathUtils.clamp(carPos.current.z, -140, 140);

        // Update Car Mesh
        if (carMeshRef.current) {
          carMeshRef.current.position.copy(carPos.current);
          carMeshRef.current.rotation.y = carAngle.current;

          // Steer front wheels
          if (wheelsRef.current[0] && wheelsRef.current[1]) {
            wheelsRef.current[0].rotation.y = carSteer.current;
            wheelsRef.current[1].rotation.y = carSteer.current;
          }
          // Spin wheels
          wheelsRef.current.forEach((w) => {
            w.rotation.x += carSpeed.current * dt * 2.2;
          });
        }

        // Update Speedometer & RPM
        const mph = Math.round(Math.abs(carSpeed.current) * 2.237);
        setSpeedMph(mph);
        setRpm(850 + mph * 90);

        // Camera Orbit & Look in Vehicle Mode (supports 360° swipe on right side)
        timeSinceLastLookSwipe.current += dt;
        if (timeSinceLastLookSwipe.current > 1.8 && Math.abs(carSpeed.current) > 1.5) {
          // Gently align camera behind car direction when cruising without swiping
          let diff = (carAngle.current - camAngleYaw.current) % (Math.PI * 2);
          if (diff > Math.PI) diff -= Math.PI * 2;
          if (diff < -Math.PI) diff += Math.PI * 2;
          camAngleYaw.current += diff * Math.min(1, dt * 2.6);
        }

        if (cameraRef.current) {
          const camDistance = 8.6;
          const focusTarget = new THREE.Vector3(
            carPos.current.x,
            carPos.current.y + 1.1,
            carPos.current.z
          );
          const horizDist = camDistance * Math.cos(camAnglePitch.current);
          const heightOffset = camDistance * Math.sin(camAnglePitch.current) + 1.2;

          const targetCamPos = new THREE.Vector3(
            focusTarget.x - Math.sin(camAngleYaw.current) * horizDist,
            focusTarget.y + heightOffset,
            focusTarget.z - Math.cos(camAngleYaw.current) * horizDist
          );
          cameraRef.current.position.lerp(targetCamPos, dt * 8.5);
          cameraRef.current.lookAt(
            focusTarget.x + Math.sin(carAngle.current) * 1.5,
            focusTarget.y + 0.3,
            focusTarget.z + Math.cos(carAngle.current) * 1.5
          );
        }
      } else {
        // ON-FOOT MODE PHYSICS
        playerMeshRef.current!.visible = perspective !== 'fps';

        // Analog Joystick + Keyboard WASD
        const stickX = joystickRef.current.x; // -1 to 1 (left to right)
        const stickY = joystickRef.current.y; // -1 to 1 (backward to forward)

        let keyX = 0;
        let keyZ = 0;
        if (inputRef.current.forward) keyZ += 1;
        if (inputRef.current.backward) keyZ -= 1;
        if (inputRef.current.left) keyX -= 1;
        if (inputRef.current.right) keyX += 1;

        let inputX = stickX + keyX;
        let inputZ = stickY + keyZ;
        const inputMag = Math.hypot(inputX, inputZ);
        if (inputMag > 1) {
          inputX /= inputMag;
          inputZ /= inputMag;
        }
        const mag = Math.min(1, inputMag);
        const isMoving = mag > 0.08;

        if (isMoving) {
          footstepTimer += dt;
          if (footstepTimer > (inputRef.current.sprint || mag > 0.82 ? 0.26 : 0.4)) {
            soundFx.playFootstep();
            footstepTimer = 0;
          }

          // Camera-Relative Movement:
          // Pushing joystick forward moves character in camera look direction; left/right moves horizontally relative to view
          const camYaw = camAngleYaw.current;
          const moveX = Math.sin(camYaw) * inputZ - Math.cos(camYaw) * inputX;
          const moveZ = Math.cos(camYaw) * inputZ + Math.sin(camYaw) * inputX;

          const targetAngle = Math.atan2(moveX, moveZ);
          let angleDiff = (targetAngle - playerAngle.current) % (Math.PI * 2);
          if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          playerAngle.current += angleDiff * Math.min(1, dt * 14);

          const speed = (inputRef.current.sprint || mag > 0.82) ? 9.5 * mag : 5.4 * mag;
          playerPos.current.x += moveX * speed * dt;
          playerPos.current.z += moveZ * speed * dt;

          playerPos.current.x = THREE.MathUtils.clamp(playerPos.current.x, -140, 140);
          playerPos.current.z = THREE.MathUtils.clamp(playerPos.current.z, -140, 140);
        }

        if (playerMeshRef.current) {
          playerMeshRef.current.position.copy(playerPos.current);
          playerMeshRef.current.rotation.y = playerAngle.current;
        }

        // Camera for On-Foot (FPS vs 3rd Person, rotated by right-side swipe look)
        if (cameraRef.current) {
          if (perspective === 'fps') {
            cameraRef.current.position.set(
              playerPos.current.x,
              playerPos.current.y + 1.48,
              playerPos.current.z
            );
            const lookForward = new THREE.Vector3(
              Math.sin(camAngleYaw.current) * Math.cos(camAnglePitch.current),
              -Math.sin(camAnglePitch.current),
              Math.cos(camAngleYaw.current) * Math.cos(camAnglePitch.current)
            );
            cameraRef.current.lookAt(cameraRef.current.position.clone().add(lookForward));
          } else {
            const camDistance = 4.8;
            const focusTarget = new THREE.Vector3(
              playerPos.current.x,
              playerPos.current.y + 1.25,
              playerPos.current.z
            );
            const horizDist = camDistance * Math.cos(camAnglePitch.current);
            const heightOffset = camDistance * Math.sin(camAnglePitch.current) + 0.3;

            const targetCamPos = new THREE.Vector3(
              focusTarget.x - Math.sin(camAngleYaw.current) * horizDist,
              focusTarget.y + heightOffset,
              focusTarget.z - Math.cos(camAngleYaw.current) * horizDist
            );
            cameraRef.current.position.lerp(targetCamPos, Math.min(1, dt * 12));
            cameraRef.current.lookAt(focusTarget);
          }
        }
      }

      // Check proximity and calculate closest destination for GPS / Radar
      const currentPos = controlMode === 'driving' ? carPos.current : playerPos.current;
      const currentHeading = camAngleYaw.current; // Minimap rotates to match camera look direction
      setRadarRotation(-currentHeading * (180 / Math.PI));

      // 1. Check proximity to car when on foot
      if (controlMode === 'on_foot') {
        const distToCar = playerPos.current.distanceTo(carPos.current);
        if (distToCar < 5.0) {
          setActivePrompt({
            text: 'PRESS [F] TO DRIVE YOUR HOT ROD',
            action: toggleVehicle,
          });
        } else {
          // Check other locations
          let nearbyLoc: WorldLocation | null = null;
          let closest: WorldLocation | null = null;
          let minDist = 9999;

          for (const loc of locations) {
            const d = currentPos.distanceTo(loc.pos);
            if (d < minDist && loc.id !== 'loc-garage') {
              minDist = d;
              closest = loc;
            }
            if (d <= loc.radius) {
              nearbyLoc = loc;
            }
          }

          setClosestPoi(closest);
          setGpsDistance(Math.round(minDist));

          if (nearbyLoc) {
            setCurrentLocationName(nearbyLoc.name);
            setActivePrompt({
              text: `PRESS [E] TO ${nearbyLoc.prompt}`,
              action: () => {
                soundFx.playClick();
                if (nearbyLoc!.type === 'station' && nearbyLoc!.stationType) {
                  onOpenStation(nearbyLoc!.stationType);
                } else if (nearbyLoc!.shopTab) {
                  onOpenMapShop(nearbyLoc!.shopTab);
                }
              },
            });
          } else {
            setActivePrompt(null);
            setCurrentLocationName('County Highway Route 66');
          }
        }
      } else {
        // In car proximity to shops / buyers
        let nearbyShop: WorldLocation | null = null;
        let closest: WorldLocation | null = null;
        let minDist = 9999;

        for (const loc of locations) {
          if (loc.type !== 'station') {
            const d = currentPos.distanceTo(loc.pos);
            if (d < minDist) {
              minDist = d;
              closest = loc;
            }
            if (d <= loc.radius) {
              nearbyShop = loc;
            }
          }
        }

        setClosestPoi(closest);
        setGpsDistance(Math.round(minDist));

        if (nearbyShop) {
          setCurrentLocationName(nearbyShop.name);
          setActivePrompt({
            text: `DRIVE-IN: PRESS [E] FOR ${nearbyShop.prompt}`,
            action: () => {
              soundFx.playClick();
              if (nearbyShop!.shopTab) {
                onOpenMapShop(nearbyShop!.shopTab);
              }
            },
          });
        } else {
          setActivePrompt(null);
          setCurrentLocationName('Open County Highway');
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
        rendererRef.current.dispose();
      }
    };
  }, [controlMode, perspective, toggleVehicle, onOpenStation, onOpenMapShop, garageName]);

  // Touch Virtual Controls Helper
  const setTouchInput = (key: keyof typeof inputRef.current, state: boolean) => {
    inputRef.current[key] = state;
  };

  // Right-Side Screen Swipe Camera Look Handlers
  const handleLookPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    lookSwipeRef.current = {
      active: true,
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
    };
    timeSinceLastLookSwipe.current = 0;
    if (!hasSwipedLook) setHasSwipedLook(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleLookPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!lookSwipeRef.current.active || lookSwipeRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - lookSwipeRef.current.lastX;
    const dy = e.clientY - lookSwipeRef.current.lastY;
    lookSwipeRef.current.lastX = e.clientX;
    lookSwipeRef.current.lastY = e.clientY;
    timeSinceLastLookSwipe.current = 0;

    const sensitivity = 0.0055;
    camAngleYaw.current -= dx * sensitivity;
    // Swiping finger down increases pitch (higher elevation view), swiping up lowers pitch
    camAnglePitch.current = THREE.MathUtils.clamp(
      camAnglePitch.current + dy * sensitivity,
      -0.18,
      1.15
    );
  };

  const handleLookPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (lookSwipeRef.current.pointerId === e.pointerId) {
      lookSwipeRef.current.active = false;
      lookSwipeRef.current.pointerId = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Virtual Analog Joystick Handlers
  const handleJoystickDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    updateJoystick(e.clientX, e.clientY);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleJoystickMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!joystickRef.current.active) return;
    e.stopPropagation();
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoystickUp = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    joystickRef.current = { x: 0, y: 0, active: false };
    setJoystickPos({ x: 0, y: 0, active: false });
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const updateJoystick = (clientX: number, clientY: number) => {
    if (!joystickContainerRef.current) return;
    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const maxRadius = rect.width * 0.38;

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    // Output normalized values: -1 to 1
    // normX: -1 (left) to 1 (right)
    // normY: 1 (forward/up) to -1 (backward/down)
    let normX = knobX / maxRadius;
    let normY = -knobY / maxRadius;

    // Center deadzone
    if (dist < 6) {
      normX = 0;
      normY = 0;
    }

    joystickRef.current = { x: normX, y: normY, active: true };
    setJoystickPos({ x: knobX, y: knobY, active: true });
  };

  // Current entity position for minimap rendering
  const activeEntityPos = controlMode === 'driving' ? carPos.current : playerPos.current;

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-black flex flex-col">
      {/* 3D WebGL Canvas Container */}
      <div ref={containerRef} className="w-full h-full absolute inset-0 z-0" />

      {/* RIGHT-SIDE CAMERA LOOK SWIPE ZONE (Drag/swipe anywhere on right half to look around 360°) */}
      <div
        onPointerDown={handleLookPointerDown}
        onPointerMove={handleLookPointerMove}
        onPointerUp={handleLookPointerUp}
        onPointerCancel={handleLookPointerUp}
        className="absolute top-0 right-0 w-1/2 h-full z-10 touch-none select-none cursor-grab active:cursor-grabbing flex items-center justify-end pr-8 pointer-events-auto"
        title="Swipe right side to look around"
      >
        {/* Subtle visual onboarding hint when not yet swiped */}
        {!hasSwipedLook && (
          <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-zinc-400 text-[11px] font-tech flex items-center gap-2 pointer-events-none animate-pulse">
            <Compass size={14} className="text-amber-400" />
            <span>Swipe here to look ↺</span>
          </div>
        )}
      </div>

      {/* TOP HUD: Location, Bankroll, Atmosphere Preset, & Perspective Toggle */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Current Location Badge & GPS Telemetry */}
        <div className="bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-zinc-700/80 flex items-center gap-3 shadow-xl">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <MapPin size={17} />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold font-display uppercase text-white tracking-wide flex items-center gap-2">
              <span>{currentLocationName}</span>
            </div>
            <div className="text-[10px] font-tech text-zinc-400 flex items-center gap-2">
              <span className="text-amber-400 font-bold">
                {controlMode === 'driving' ? 'DRIVING VEHICLE' : 'ON FOOT'}
              </span>
              {closestPoi && (
                <span>
                  • Nearest: <strong className="text-zinc-200">{closestPoi.name}</strong> ({gpsDistance}m)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bankroll, Atmosphere Preset & Camera Toggle */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Atmosphere Lighting Toggle */}
          <div className="flex items-center bg-black/80 backdrop-blur-md rounded-xl p-1 border border-zinc-700 shadow-lg">
            <button
              onClick={() => setLightingPreset('sunset')}
              className={`px-2 py-1 rounded-lg text-xs font-tech transition-colors cursor-pointer flex items-center gap-1 ${
                lightingPreset === 'sunset'
                  ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Dusk / Sunset Golden Hour"
            >
              <Sunset size={13} />
              <span className="hidden sm:inline">Sunset</span>
            </button>

            <button
              onClick={() => setLightingPreset('night')}
              className={`px-2 py-1 rounded-lg text-xs font-tech transition-colors cursor-pointer flex items-center gap-1 ${
                lightingPreset === 'night'
                  ? 'bg-blue-500/30 text-blue-300 font-bold border border-blue-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Neon Night Mode"
            >
              <Moon size={13} />
              <span className="hidden sm:inline">Night</span>
            </button>

            <button
              onClick={() => setLightingPreset('day')}
              className={`px-2 py-1 rounded-lg text-xs font-tech transition-colors cursor-pointer flex items-center gap-1 ${
                lightingPreset === 'day'
                  ? 'bg-sky-500/30 text-sky-300 font-bold border border-sky-500/40'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Crisp Midday Sun"
            >
              <Sun size={13} />
              <span className="hidden sm:inline">Day</span>
            </button>
          </div>

          {/* Cash Bankroll */}
          <div className="bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-emerald-500/40 text-xs sm:text-sm font-display font-black text-emerald-400 shadow-lg">
            ${cash.toLocaleString()}
          </div>

          {/* Perspective Switcher */}
          <button
            onClick={() => {
              soundFx.playClick();
              setPerspective((prev) => (prev === 'fps' ? 'third_person' : 'fps'));
            }}
            className="w-10 h-10 rounded-xl bg-black/80 backdrop-blur-md border border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-300 hover:text-white transition-colors cursor-pointer shadow-lg"
            title="Toggle FPS / 3rd Person Camera"
          >
            <Eye size={18} />
          </button>
        </div>
      </div>

      {/* INTERACTIVE ACTION PROMPT (GTA V STYLE IN-WORLD CALLOUT) */}
      {activePrompt && (
        <div className="absolute top-16 sm:top-20 left-1/2 transform -translate-x-1/2 z-30 pointer-events-auto">
          <button
            onClick={activePrompt.action}
            className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-3 rounded-2xl font-display font-black uppercase text-xs sm:text-sm tracking-wider shadow-2xl shadow-amber-500/50 flex items-center gap-2.5 animate-bounce transition-all cursor-pointer border-2 border-amber-300"
          >
            <Sparkles size={18} className="fill-black" />
            <span>{activePrompt.text}</span>
          </button>
        </div>
      )}

      {/* GTA V-STYLE CIRCULAR RADAR MINIMAP (TOP-LEFT HUD DOCKED UNDER LOCATION BADGE) */}
      <div className="absolute top-16 left-3 sm:left-4 z-20 pointer-events-none select-none">
        <div className="relative w-28 h-28 sm:w-34 sm:h-34 rounded-full border-2 border-zinc-700/80 bg-zinc-950/85 backdrop-blur-md overflow-hidden shadow-2xl">
          {/* Rotating Map Layer */}
          <div
            className="absolute inset-0 transition-transform duration-75 origin-center"
            style={{ transform: `rotate(${radarRotation}deg)` }}
          >
            {/* North-South Main Highway Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-2.5 -translate-x-1/2 bg-zinc-700/60" />

            {/* East-West Cross Boulevard Lines */}
            <div className="absolute top-1/4 left-0 right-0 h-2 bg-zinc-700/60" />
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-zinc-700/60" />
            <div className="absolute top-3/4 left-0 right-0 h-2 bg-zinc-700/60" />

            {/* POI Blips on Radar */}
            {locations.map((loc) => {
              const scale = 0.45; // pixels per world unit
              const dx = (loc.pos.x - activeEntityPos.x) * scale;
              const dz = (loc.pos.z - activeEntityPos.z) * scale;

              return (
                <div
                  key={loc.id}
                  className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-md flex items-center justify-center font-bold text-[7px]"
                  style={{
                    left: `calc(50% + ${dx}px)`,
                    top: `calc(50% + ${dz}px)`,
                    backgroundColor: loc.color,
                  }}
                  title={loc.name}
                />
              );
            })}
          </div>

          {/* Fixed Compass Indicator in center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[12px] border-b-amber-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          </div>

          {/* North Compass Indicator on rim */}
          <div
            className="absolute inset-0 pointer-events-none origin-center"
            style={{ transform: `rotate(${radarRotation}deg)` }}
          >
            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-black font-tech text-red-500">
              N
            </div>
          </div>
        </div>

        {/* GPS Route Destination Tag */}
        {closestPoi && (
          <div className="mt-1 bg-black/85 backdrop-blur-md px-2 py-0.5 rounded-md border border-zinc-800 text-[9px] font-tech text-zinc-300 flex items-center justify-between w-28 sm:w-34 shadow-lg">
            <span className="truncate">{closestPoi.name}</span>
            <span className="font-bold text-amber-400 shrink-0 ml-1">{gpsDistance}m</span>
          </div>
        )}
      </div>

      {/* DRIVING TELEMETRY & COCKPIT GAUGES (When in vehicle) */}
      {controlMode === 'driving' && (
        <div className="absolute bottom-5 left-40 sm:left-48 z-20 pointer-events-none">
          <div className="bg-black/85 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-zinc-800 shadow-2xl flex items-center gap-3.5">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-black font-display text-amber-400 leading-none">
                {speedMph}
              </div>
              <div className="text-[9px] font-tech text-zinc-500 uppercase tracking-widest">MPH</div>
            </div>

            <div className="h-9 w-px bg-zinc-800" />

            <div>
              <div className="text-xs font-bold font-tech text-zinc-300 flex items-center justify-between">
                <span>{rpm} RPM</span>
                <span className="text-[10px] text-zinc-500">4-SPEED</span>
              </div>
              <div className="w-20 sm:w-28 h-2 bg-zinc-800 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500"
                  style={{ width: `${Math.min(100, (rpm / 6800) * 100)}%` }}
                />
              </div>
              <div className="flex items-center gap-1 mt-1 text-[9px] font-tech text-zinc-400">
                <Fuel size={10} className="text-amber-400" />
                <span>FUEL: {fuelPct}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIRTUAL ANALOG JOYSTICK (BOTTOM-LEFT - REPLACES ARROWS) */}
      <div className="absolute bottom-5 left-5 z-30 pointer-events-auto flex flex-col items-center">
        <div
          ref={joystickContainerRef}
          onPointerDown={handleJoystickDown}
          onPointerMove={handleJoystickMove}
          onPointerUp={handleJoystickUp}
          onPointerCancel={handleJoystickUp}
          className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-black/70 backdrop-blur-md border-2 border-amber-500/40 shadow-2xl touch-none select-none flex items-center justify-center cursor-pointer"
          title="Virtual Movement Joystick"
        >
          {/* Outer Guide Ring */}
          <div className="absolute inset-2.5 rounded-full border border-white/10 pointer-events-none" />
          <div className="absolute inset-6 rounded-full border border-amber-500/15 pointer-events-none" />

          {/* 4-Way Compass Cardinal Pointers */}
          <div className="absolute top-1.5 w-1 h-2 bg-amber-400/70 rounded-full pointer-events-none" />
          <div className="absolute bottom-1.5 w-1 h-2 bg-amber-400/70 rounded-full pointer-events-none" />
          <div className="absolute left-1.5 h-1 w-2 bg-amber-400/70 rounded-full pointer-events-none" />
          <div className="absolute right-1.5 h-1 w-2 bg-amber-400/70 rounded-full pointer-events-none" />

          {/* Center deadzone indicator */}
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500/30 pointer-events-none" />

          {/* Dynamic Joystick Thumb Stick */}
          <div
            className="absolute w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 shadow-xl border-2 border-amber-200 flex items-center justify-center pointer-events-none"
            style={{
              transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
              transition: joystickPos.active ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.9, 0.3, 1.2)',
              boxShadow: joystickPos.active
                ? '0 0 24px rgba(245, 158, 11, 0.85), inset 0 2px 4px rgba(255,255,255,0.6)'
                : '0 4px 14px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.4)',
            }}
          >
            <div className="w-6 h-6 rounded-full bg-amber-800/60 border border-amber-300/50 flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-white/90 shadow-sm" />
            </div>
          </div>
        </div>

        <div className="mt-1 text-center text-[10px] font-tech text-zinc-400 tracking-wider uppercase font-semibold">
          MOVE
        </div>
      </div>

      {/* BOTTOM-RIGHT ACTION BUTTONS & VEHICLE PEDALS */}
      <div
        className="absolute bottom-5 right-5 z-30 pointer-events-auto flex items-end gap-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Enter / Exit Vehicle Button */}
        <button
          onClick={toggleVehicle}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center gap-0.5 font-display font-black text-[10px] sm:text-xs uppercase shadow-2xl transition-all cursor-pointer border-2 ${
            controlMode === 'driving'
              ? 'bg-red-600 hover:bg-red-500 text-white border-red-400'
              : 'bg-gradient-to-br from-amber-500 to-orange-500 text-black border-amber-300 animate-pulse'
          }`}
          title="Enter or Exit Vehicle (F)"
        >
          <Car size={22} />
          <span>{controlMode === 'driving' ? 'EXIT' : 'DRIVE'}</span>
        </button>

        {/* If driving: Gas & Brake Pedals */}
        {controlMode === 'driving' ? (
          <div className="flex gap-2">
            <button
              onPointerDown={() => setTouchInput('backward', true)}
              onPointerUp={() => setTouchInput('backward', false)}
              onPointerLeave={() => setTouchInput('backward', false)}
              className="w-13 h-16 sm:w-16 sm:h-20 rounded-2xl bg-zinc-800 active:bg-red-600 text-zinc-300 active:text-white font-display font-black text-xs uppercase flex flex-col items-center justify-center border border-zinc-700 cursor-pointer touch-none shadow-lg"
            >
              BRAKE
            </button>

            <button
              onPointerDown={() => setTouchInput('forward', true)}
              onPointerUp={() => setTouchInput('forward', false)}
              onPointerLeave={() => setTouchInput('forward', false)}
              className="w-15 h-18 sm:w-18 sm:h-22 rounded-2xl bg-gradient-to-t from-emerald-600 to-emerald-500 active:from-emerald-400 active:to-emerald-300 text-black font-display font-black text-xs uppercase flex flex-col items-center justify-center shadow-2xl shadow-emerald-500/30 cursor-pointer touch-none border border-emerald-400"
            >
              GAS
            </button>
          </div>
        ) : (
          /* If on foot: Sprint & Interact buttons */
          <div className="flex gap-2">
            <button
              onPointerDown={() => setTouchInput('sprint', true)}
              onPointerUp={() => setTouchInput('sprint', false)}
              onPointerLeave={() => setTouchInput('sprint', false)}
              className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-zinc-800 active:bg-cyan-600 text-zinc-300 font-display font-bold text-[10px] uppercase flex flex-col items-center justify-center border border-zinc-700 cursor-pointer touch-none shadow-lg"
            >
              <Footprints size={20} />
              RUN
            </button>

            {activePrompt && (
              <button
                onClick={activePrompt.action}
                className="w-15 h-15 sm:w-16 sm:h-16 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase flex flex-col items-center justify-center shadow-2xl shadow-amber-500/40 cursor-pointer animate-pulse border-2 border-amber-300"
              >
                USE
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mini Legend at bottom center */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none hidden md:flex items-center gap-2 bg-black/75 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[11px] font-tech text-zinc-400 shadow-lg">
        <Compass size={13} className="text-amber-400" />
        <span>Left Joystick / WASD: Move • Swipe Right Screen: 360° Camera Look • F: Drive/Exit • E: Interact</span>
      </div>
    </div>
  );
};
