import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, RefreshCw, Flame, Eye, Layers, Palette } from 'lucide-react';
import { soundFx } from '../utils/audio';

export type RestorationStage = 'barn_find' | 'primer' | 'restored';

interface BarnGarage3DProps {
  onRev?: () => void;
  isInteractive?: boolean;
}

const CAR_COLORS = [
  { id: 'candy_red', name: 'Candy Apple Red', hex: 0xb91c1c, finish: 'metallic' },
  { id: 'grabber_orange', name: 'Grabber Amber', hex: 0xd97706, finish: 'gloss' },
  { id: 'midnight_emerald', name: 'Vintage British Green', hex: 0x064e3b, finish: 'metallic' },
  { id: 'daytona_blue', name: 'Daytona Blue', hex: 0x1d4ed8, finish: 'gloss' },
  { id: 'matte_black', name: 'Stealth Carbon Black', hex: 0x18181b, finish: 'satin' },
];

export const BarnGarage3D: React.FC<BarnGarage3DProps> = ({ onRev, isInteractive = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<RestorationStage>('barn_find');
  const [selectedColorHex, setSelectedColorHex] = useState<number>(CAR_COLORS[0].hex);
  const [isRevving, setIsRevving] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [cameraView, setCameraView] = useState<'hero' | 'side' | 'rear' | 'top'>('hero');

  // Three.js mutable refs for animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carGroupRef = useRef<THREE.Group | null>(null);
  const bodyMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const chromeMaterialRef = useRef<THREE.MeshStandardMaterial | null>(null);
  const glassMaterialRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const jackStandMeshRef = useRef<THREE.Group | null>(null);
  const frontLeftWheelRef = useRef<THREE.Group | null>(null);
  const exhaustFlamesRef = useRef<THREE.PointLight[]>([]);
  const flameParticlesRef = useRef<THREE.Points | null>(null);
  const dustParticlesRef = useRef<THREE.Points | null>(null);
  const headLightsRef = useRef<THREE.SpotLight[]>([]);

  // Drag interaction refs
  const isDraggingRef = useRef<boolean>(false);
  const previousPointerPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRotationYRef = useRef<number>(-0.45);
  const targetRotationXRef = useRef<number>(0.15);
  const currentRotationYRef = useRef<number>(-0.45);
  const currentRotationXRef = useRef<number>(0.15);
  const revStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 480;

    // SCENE
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x0a0c10, 0.045);

    // CAMERA
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(3.8, 1.8, 4.4);
    camera.lookAt(0, 0.45, 0);
    cameraRef.current = camera;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // LIGHTING
    // 1. Warm overhead hanging workshop lamp
    const workshopSpot = new THREE.SpotLight(0xffecd2, 4.5, 14, Math.PI / 4, 0.45, 1.2);
    workshopSpot.position.set(0.5, 4.2, 0.8);
    workshopSpot.castShadow = true;
    workshopSpot.shadow.bias = -0.001;
    workshopSpot.shadow.mapSize.width = 1024;
    workshopSpot.shadow.mapSize.height = 1024;
    scene.add(workshopSpot);

    // 2. Cool side daylight beam from barn roof gaps
    const coolSlantLight = new THREE.DirectionalLight(0x93c5fd, 1.4);
    coolSlantLight.position.set(-5, 3.5, -2);
    scene.add(coolSlantLight);

    // 3. Low warm floor bounce
    const floorBounceLight = new THREE.DirectionalLight(0x78350f, 0.6);
    floorBounceLight.position.set(2, -1, 3);
    scene.add(floorBounceLight);

    // 4. Ambient fill
    const ambientLight = new THREE.AmbientLight(0x181a20, 1.2);
    scene.add(ambientLight);

    // 5. Hanging lamp visual fixture
    const lampBeam = new THREE.Group();
    const lampShadeGeo = new THREE.ConeGeometry(0.35, 0.25, 16, 1, true);
    const lampShadeMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.8, side: THREE.DoubleSide });
    const lampShade = new THREE.Mesh(lampShadeGeo, lampShadeMat);
    lampShade.position.set(0.5, 3.8, 0.8);
    lampBeam.add(lampShade);

    const bulbGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xfff4db });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(0.5, 3.75, 0.8);
    lampBeam.add(bulb);
    scene.add(lampBeam);

    // BARN GARAGE ENVIRONMENT
    // Concrete floor with oil drips
    const floorGeo = new THREE.PlaneGeometry(24, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x14161b,
      roughness: 0.85,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Circular concrete pad with rustic grid lines
    const padGeo = new THREE.CylinderGeometry(3.6, 3.7, 0.02, 32);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x1b1f28,
      roughness: 0.9,
      metalness: 0.05,
    });
    const pad = new THREE.Mesh(padGeo, padMat);
    pad.position.y = 0.01;
    pad.receiveShadow = true;
    scene.add(pad);

    // Floor chalk restoration markings
    const chalkCircleGeo = new THREE.RingGeometry(2.7, 2.73, 48);
    const chalkMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, opacity: 0.25, transparent: true, side: THREE.DoubleSide });
    const chalkCircle = new THREE.Mesh(chalkCircleGeo, chalkMat);
    chalkCircle.rotation.x = -Math.PI / 2;
    chalkCircle.position.y = 0.022;
    scene.add(chalkCircle);

    // Floating Barn Dust Motes
    const dustCount = 80;
    const dustGeo = new THREE.BufferGeometry();
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 6;
      dustPositions[i * 3 + 1] = Math.random() * 3.5 + 0.2;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.045,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const dustParticles = new THREE.Points(dustGeo, dustMat);
    dustParticlesRef.current = dustParticles;
    scene.add(dustParticles);

    // WORKSHOP DECORATIONS: Toolbox, Oil Drums, Jack Stand
    // 1. Red Mechanics Rolling Tool Chest
    const toolBoxGroup = new THREE.Group();
    const tbBodyGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
    const tbBodyMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4, metalness: 0.6 });
    const tbBody = new THREE.Mesh(tbBodyGeo, tbBodyMat);
    tbBody.position.y = 0.45;
    tbBody.castShadow = true;
    toolBoxGroup.add(tbBody);

    // Drawers handles
    for (let i = 0; i < 4; i++) {
      const handleGeo = new THREE.BoxGeometry(0.4, 0.03, 0.02);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, metalness: 0.9, roughness: 0.2 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.set(0, 0.25 + i * 0.18, 0.23);
      toolBoxGroup.add(handle);
    }
    toolBoxGroup.position.set(-2.4, 0, -1.8);
    toolBoxGroup.rotation.y = 0.4;
    scene.add(toolBoxGroup);

    // 2. Weathered Oil Drum
    const drumGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.85, 18);
    const drumMat = new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.7, metalness: 0.3 });
    const drum = new THREE.Mesh(drumGeo, drumMat);
    drum.position.set(-2.1, 0.42, 1.7);
    drum.castShadow = true;
    scene.add(drum);

    // 3. Jack Stand (used under front left chassis in Barn Find mode)
    const jackStandGroup = new THREE.Group();
    const jsBaseGeo = new THREE.ConeGeometry(0.22, 0.38, 4);
    const jsBaseMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5, metalness: 0.5 });
    const jsBase = new THREE.Mesh(jsBaseGeo, jsBaseMat);
    jsBase.rotation.y = Math.PI / 4;
    jsBase.position.y = 0.19;
    jackStandGroup.add(jsBase);

    const jsPostGeo = new THREE.BoxGeometry(0.06, 0.25, 0.06);
    const jsPostMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7, metalness: 0.7 });
    const jsPost = new THREE.Mesh(jsPostGeo, jsPostMat);
    jsPost.position.y = 0.38;
    jackStandGroup.add(jsPost);

    jackStandGroup.position.set(0.95, 0, 1.25);
    jackStandMeshRef.current = jackStandGroup;
    scene.add(jackStandGroup);

    // BUILD THE 3D PROJECT CAR MODEL (1969 Vintage Muscle Fastback)
    const carGroup = new THREE.Group();
    carGroupRef.current = carGroup;

    // Body Material (dynamic based on restoration stage)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x5c2b16, // Initial rust / patina tone
      roughness: 0.85,
      metalness: 0.2,
    });
    bodyMaterialRef.current = bodyMat;

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0x9ca3af,
      roughness: 0.5,
      metalness: 0.7,
    });
    chromeMaterialRef.current = chromeMat;

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.6,
      transparent: true,
      opacity: 0.85,
    });
    glassMaterialRef.current = glassMat;

    // 1. Main Lower Chassis / Body Shell
    const lowerBodyGeo = new THREE.BoxGeometry(1.7, 0.42, 3.6);
    const lowerBody = new THREE.Mesh(lowerBodyGeo, bodyMat);
    lowerBody.position.y = 0.42;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    carGroup.add(lowerBody);

    // 2. Hood Sculpt & Engine Bay
    const hoodGeo = new THREE.BoxGeometry(1.65, 0.16, 1.45);
    const hood = new THREE.Mesh(hoodGeo, bodyMat);
    hood.position.set(0, 0.58, 1.05);
    hood.castShadow = true;
    carGroup.add(hood);

    // Exposed Chrome Blower / Twin Carburetor Intake Scoop
    const blowerGroup = new THREE.Group();
    const blowerBaseGeo = new THREE.BoxGeometry(0.4, 0.12, 0.45);
    const blowerBase = new THREE.Mesh(blowerBaseGeo, chromeMat);
    blowerBase.position.set(0, 0.72, 0.95);
    blowerGroup.add(blowerBase);

    // Twin butterflies
    const scoopGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.18, 12);
    const scoop1 = new THREE.Mesh(scoopGeo, chromeMat);
    scoop1.rotation.x = Math.PI / 2;
    scoop1.position.set(-0.12, 0.78, 1.15);
    const scoop2 = scoop1.clone();
    scoop2.position.set(0.12, 0.78, 1.15);
    blowerGroup.add(scoop1);
    blowerGroup.add(scoop2);
    carGroup.add(blowerGroup);

    // 3. Cabin GreenHouse & Fastback Roof
    const cabinGeo = new THREE.BoxGeometry(1.42, 0.46, 1.6);
    const cabin = new THREE.Mesh(cabinGeo, bodyMat);
    cabin.position.set(0, 0.82, -0.2);
    cabin.castShadow = true;
    carGroup.add(cabin);

    // Slanted fastback rear deck
    const fastbackGeo = new THREE.CylinderGeometry(0.72, 0.82, 0.95, 4);
    const fastback = new THREE.Mesh(fastbackGeo, bodyMat);
    fastback.rotation.y = Math.PI / 4;
    fastback.rotation.x = -0.45;
    fastback.position.set(0, 0.68, -1.05);
    carGroup.add(fastback);

    // 4. Windows
    // Windshield
    const wsGeo = new THREE.PlaneGeometry(1.36, 0.52);
    const windshield = new THREE.Mesh(wsGeo, glassMat);
    windshield.rotation.x = -0.65;
    windshield.position.set(0, 0.82, 0.62);
    carGroup.add(windshield);

    // Rear window
    const rwGeo = new THREE.PlaneGeometry(1.3, 0.65);
    const rearWindow = new THREE.Mesh(rwGeo, glassMat);
    rearWindow.rotation.x = 0.65;
    rearWindow.rotation.y = Math.PI;
    rearWindow.position.set(0, 0.78, -1.02);
    carGroup.add(rearWindow);

    // Side windows
    const sideWGeo = new THREE.PlaneGeometry(1.15, 0.32);
    const leftWindow = new THREE.Mesh(sideWGeo, glassMat);
    leftWindow.rotation.y = Math.PI / 2;
    leftWindow.position.set(0.72, 0.83, -0.2);
    const rightWindow = leftWindow.clone();
    rightWindow.rotation.y = -Math.PI / 2;
    rightWindow.position.set(-0.72, 0.83, -0.2);
    carGroup.add(leftWindow);
    carGroup.add(rightWindow);

    // 5. Front Grille & Split Bumper
    const grilleGeo = new THREE.BoxGeometry(1.6, 0.24, 0.1);
    const grilleMat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.9 });
    const grille = new THREE.Mesh(grilleGeo, grilleMat);
    grille.position.set(0, 0.44, 1.82);
    carGroup.add(grille);

    const frontBumperGeo = new THREE.BoxGeometry(1.72, 0.1, 0.12);
    const frontBumper = new THREE.Mesh(frontBumperGeo, chromeMat);
    frontBumper.position.set(0, 0.32, 1.86);
    frontBumper.castShadow = true;
    carGroup.add(frontBumper);

    // Dual Round Headlights
    const hlGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.05, 16);
    const hlMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const hlLeft = new THREE.Mesh(hlGeo, hlMat);
    hlLeft.rotation.x = Math.PI / 2;
    hlLeft.position.set(0.6, 0.45, 1.84);
    const hlRight = hlLeft.clone();
    hlRight.position.set(-0.6, 0.45, 1.84);
    carGroup.add(hlLeft);
    carGroup.add(hlRight);

    // Headlight light beams
    const spotHL1 = new THREE.SpotLight(0xfef08a, 1.8, 6, Math.PI / 6, 0.3);
    spotHL1.position.set(0.6, 0.45, 1.9);
    spotHL1.target.position.set(0.6, 0.2, 5);
    scene.add(spotHL1.target);
    scene.add(spotHL1);

    const spotHL2 = new THREE.SpotLight(0xfef08a, 1.8, 6, Math.PI / 6, 0.3);
    spotHL2.position.set(-0.6, 0.45, 1.9);
    spotHL2.target.position.set(-0.6, 0.2, 5);
    scene.add(spotHL2.target);
    scene.add(spotHL2);
    headLightsRef.current = [spotHL1, spotHL2];

    // Rear Chrome Bumper & Taillights
    const rearBumperGeo = new THREE.BoxGeometry(1.72, 0.1, 0.12);
    const rearBumper = new THREE.Mesh(rearBumperGeo, chromeMat);
    rearBumper.position.set(0, 0.34, -1.82);
    carGroup.add(rearBumper);

    const tlGeo = new THREE.BoxGeometry(0.42, 0.1, 0.04);
    const tlMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tlLeft = new THREE.Mesh(tlGeo, tlMat);
    tlLeft.position.set(0.55, 0.46, -1.81);
    const tlRight = tlLeft.clone();
    tlRight.position.set(-0.55, 0.46, -1.81);
    carGroup.add(tlLeft);
    carGroup.add(tlRight);

    // Dual Exhaust Tips with Flame glow lights
    const exhaustGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 12);
    const exhaustMat = new THREE.MeshStandardMaterial({ color: 0x52525b, metalness: 0.9, roughness: 0.3 });
    const exLeft = new THREE.Mesh(exhaustGeo, exhaustMat);
    exLeft.rotation.x = Math.PI / 2;
    exLeft.position.set(0.48, 0.24, -1.85);
    const exRight = exLeft.clone();
    exRight.position.set(-0.48, 0.24, -1.85);
    carGroup.add(exLeft);
    carGroup.add(exRight);

    // Flame burst lights for revving
    const flameLightLeft = new THREE.PointLight(0xf97316, 0, 3);
    flameLightLeft.position.set(0.48, 0.24, -1.98);
    scene.add(flameLightLeft);
    const flameLightRight = new THREE.PointLight(0xf97316, 0, 3);
    flameLightRight.position.set(-0.48, 0.24, -1.98);
    scene.add(flameLightRight);
    exhaustFlamesRef.current = [flameLightLeft, flameLightRight];

    // Helper: Create a detailed Wheel Assembly (Tire + Chrome Mag Rim + Disc Rotor)
    const createWheel = () => {
      const wheelGroup = new THREE.Group();

      // Rubber Tire
      const tireGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.24, 20);
      const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.95 });
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Chrome Deep-Dish Rim
      const rimGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.245, 16);
      const rim = new THREE.Mesh(rimGeo, chromeMat);
      rim.rotation.z = Math.PI / 2;
      wheelGroup.add(rim);

      // Center Spoke star
      const starGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 5);
      const star = new THREE.Mesh(starGeo, chromeMat);
      star.rotation.z = Math.PI / 2;
      wheelGroup.add(star);

      // Red Brake Caliper
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.12, 0.08);
      const caliperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(0, 0.14, 0);
      wheelGroup.add(caliper);

      return wheelGroup;
    };

    // Mount 4 Wheels
    // Front Right
    const frWheel = createWheel();
    frWheel.position.set(-0.85, 0.34, 1.2);
    carGroup.add(frWheel);

    // Rear Right
    const rrWheel = createWheel();
    rrWheel.position.set(-0.85, 0.34, -1.15);
    carGroup.add(rrWheel);

    // Rear Left
    const rlWheel = createWheel();
    rlWheel.position.set(0.85, 0.34, -1.15);
    carGroup.add(rlWheel);

    // Front Left (Special: In barn find, this is detached and car rests on jack stand!)
    const flWheel = createWheel();
    flWheel.position.set(0.85, 0.34, 1.2);
    frontLeftWheelRef.current = flWheel;
    carGroup.add(flWheel);

    // Shadow cast setup
    carGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.add(carGroup);

    // ANIMATION LOOP
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Gentle floating dust particles
      if (dustParticlesRef.current) {
        dustParticlesRef.current.rotation.y = time * 0.03;
      }

      // Smooth interpolation for orbit drag & auto-rotate
      if (autoRotate && !isDraggingRef.current) {
        targetRotationYRef.current += delta * 0.28;
      }

      currentRotationYRef.current += (targetRotationYRef.current - currentRotationYRef.current) * 0.08;
      currentRotationXRef.current += (targetRotationXRef.current - currentRotationXRef.current) * 0.08;

      if (carGroupRef.current) {
        carGroupRef.current.rotation.y = currentRotationYRef.current;
        
        // Rev vibration effect
        if (isRevving) {
          const revElapsed = (Date.now() - revStartTimeRef.current) / 1000;
          if (revElapsed < 0.8) {
            const jitter = Math.sin(time * 65) * 0.015;
            carGroupRef.current.position.y = jitter;
            carGroupRef.current.rotation.z = Math.sin(time * 50) * 0.01;

            // Exhaust flames intensity
            const flameIntensity = (Math.sin(time * 80) + 1) * 3.5;
            exhaustFlamesRef.current.forEach((flame) => {
              flame.intensity = flameIntensity;
            });
          } else {
            setIsRevving(false);
            carGroupRef.current.position.y = 0;
            carGroupRef.current.rotation.z = 0;
            exhaustFlamesRef.current.forEach((flame) => {
              flame.intensity = 0;
            });
          }
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // RESIZE OBSERVER
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Materials & Restoration Stages
  useEffect(() => {
    if (!bodyMaterialRef.current || !chromeMaterialRef.current || !glassMaterialRef.current) return;

    if (stage === 'barn_find') {
      // Weathered barn find rust patina
      bodyMaterialRef.current.color.setHex(0x542614);
      bodyMaterialRef.current.roughness = 0.9;
      bodyMaterialRef.current.metalness = 0.15;

      chromeMaterialRef.current.color.setHex(0x52525b);
      chromeMaterialRef.current.roughness = 0.65;
      chromeMaterialRef.current.metalness = 0.5;

      glassMaterialRef.current.opacity = 0.9;
      glassMaterialRef.current.roughness = 0.4;

      // In barn find, front-left wheel is resting on jack stand!
      if (frontLeftWheelRef.current) frontLeftWheelRef.current.visible = false;
      if (jackStandMeshRef.current) jackStandMeshRef.current.visible = true;

      // Warm dim headlights
      headLightsRef.current.forEach((hl) => {
        hl.intensity = 0.8;
        hl.color.setHex(0xfef08a);
      });
    } else if (stage === 'primer') {
      // Guide coat primer grey
      bodyMaterialRef.current.color.setHex(0x3f3f46);
      bodyMaterialRef.current.roughness = 0.8;
      bodyMaterialRef.current.metalness = 0.25;

      chromeMaterialRef.current.color.setHex(0xd4d4d8);
      chromeMaterialRef.current.roughness = 0.3;
      chromeMaterialRef.current.metalness = 0.85;

      glassMaterialRef.current.opacity = 0.75;
      glassMaterialRef.current.roughness = 0.15;

      // Wheel mounted
      if (frontLeftWheelRef.current) frontLeftWheelRef.current.visible = true;
      if (jackStandMeshRef.current) jackStandMeshRef.current.visible = false;

      headLightsRef.current.forEach((hl) => {
        hl.intensity = 1.6;
        hl.color.setHex(0xfef08a);
      });
    } else if (stage === 'restored') {
      // High-gloss mirror clearcoat with user's selected candy color
      bodyMaterialRef.current.color.setHex(selectedColorHex);
      bodyMaterialRef.current.roughness = 0.12;
      bodyMaterialRef.current.metalness = 0.55;

      chromeMaterialRef.current.color.setHex(0xffffff);
      chromeMaterialRef.current.roughness = 0.08;
      chromeMaterialRef.current.metalness = 0.98;

      glassMaterialRef.current.opacity = 0.5;
      glassMaterialRef.current.roughness = 0.05;

      if (frontLeftWheelRef.current) frontLeftWheelRef.current.visible = true;
      if (jackStandMeshRef.current) jackStandMeshRef.current.visible = false;

      // Bright halo LED headlights
      headLightsRef.current.forEach((hl) => {
        hl.intensity = 3.2;
        hl.color.setHex(0xfffbeb);
      });
    }
  }, [stage, selectedColorHex]);

  // Touch / Pointer interaction handlers for 360 orbit
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    setAutoRotate(false);
    previousPointerPositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousPointerPositionRef.current.x;
    const deltaY = e.clientY - previousPointerPositionRef.current.y;

    targetRotationYRef.current += deltaX * 0.009;
    targetRotationXRef.current = Math.max(-0.2, Math.min(0.4, targetRotationXRef.current + deltaY * 0.005));

    previousPointerPositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // Rev the engine with sound & flame effect
  const handleRevThrottle = () => {
    soundFx.playRevEngine();
    setIsRevving(true);
    revStartTimeRef.current = Date.now();
    if (onRev) onRev();
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-gradient-to-b from-[#0e1117] via-[#0b0d12] to-[#07080a]">
      {/* 3D WebGL Canvas Mount */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
        title="Touch & drag to inspect project car 360°"
      />

      {/* Top Barn Find Identification Plaque */}
      <div className="absolute top-2 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/10 text-[10px] font-badge tracking-wider uppercase text-amber-300">
            BARN FIND: 1969 REBEL 427 V8
          </div>
        </div>

        <button
          onClick={() => {
            soundFx.playClick();
            setAutoRotate(!autoRotate);
          }}
          className="pointer-events-auto p-1.5 rounded-md bg-black/60 border border-white/10 hover:border-amber-500/50 text-zinc-400 hover:text-amber-400 text-[10px] font-tech flex items-center gap-1 transition-colors cursor-pointer shadow-md"
          title="Toggle Turntable Auto-Spin"
        >
          <RefreshCw size={11} className={autoRotate ? 'animate-spin' : ''} />
          <span>{autoRotate ? 'Turntable' : 'Manual'}</span>
        </button>
      </div>

      {/* Center Interactive Stage Selector: [Barn Find] [Guide Primer] [Showroom Finish] */}
      {isInteractive && (
        <div className="absolute bottom-2 left-2 right-2 z-20 flex flex-col gap-2">
          {/* Color swatches if restored */}
          {stage === 'restored' && (
            <div className="flex items-center justify-center gap-2 bg-black/70 backdrop-blur-md p-1.5 rounded-xl border border-white/10 w-fit mx-auto animate-fade-in">
              <Palette size={12} className="text-amber-400 ml-1" />
              <span className="text-[10px] font-tech text-zinc-400 uppercase mr-1">Paint:</span>
              <div className="flex gap-1.5">
                {CAR_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      soundFx.playClick();
                      setSelectedColorHex(c.hex);
                    }}
                    style={{ backgroundColor: `#${c.hex.toString(16).padStart(6, '0')}` }}
                    className={`w-5 h-5 rounded-full border-2 transition-transform cursor-pointer ${
                      selectedColorHex === c.hex
                        ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                        : 'border-transparent opacity-80 hover:opacity-100'
                    }`}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 3-Way Restoration Progress Bar */}
          <div className="flex items-center justify-between gap-1.5 bg-black/80 backdrop-blur-md p-1.5 rounded-xl border border-zinc-800 shadow-xl">
            {/* Stage 1: Barn Find */}
            <button
              onClick={() => {
                soundFx.playToolClank();
                setStage('barn_find');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-display uppercase tracking-wider font-bold transition-all cursor-pointer text-center ${
                stage === 'barn_find'
                  ? 'bg-gradient-to-r from-amber-700 to-amber-900 text-amber-100 shadow-inner border border-amber-500/50'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              1. Barn Find
            </button>

            {/* Stage 2: Primer */}
            <button
              onClick={() => {
                soundFx.playToolClank();
                setStage('primer');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-display uppercase tracking-wider font-bold transition-all cursor-pointer text-center ${
                stage === 'primer'
                  ? 'bg-zinc-700 text-white shadow-inner border border-zinc-500'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              2. Primer
            </button>

            {/* Stage 3: Restored */}
            <button
              onClick={() => {
                soundFx.playToolClank();
                setStage('restored');
              }}
              className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-display uppercase tracking-wider font-bold transition-all cursor-pointer text-center ${
                stage === 'restored'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black shadow-md border border-amber-400'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              3. Restored
            </button>

            {/* Rev Throttle Button */}
            <button
              id="btn-rev-throttle"
              onClick={handleRevThrottle}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 active:scale-95 text-white text-[11px] font-black font-display uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-red-600/30 cursor-pointer transition-all shrink-0"
              title="Rev 427 V8 throttle"
            >
              <Flame size={13} className="text-yellow-300 animate-bounce" />
              REV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
