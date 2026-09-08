import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CharacterCustomization, CharacterPreviewPose } from '../types';
import { createHumanCharacter, CharacterRig } from '../utils/characterModel';
import { Eye, User, Shirt, Play, Pause, Sparkles, RefreshCw } from 'lucide-react';
import { soundFx } from '../utils/audio';

export type ZoomTarget = 'full' | 'torso' | 'face';

interface CharacterPreviewCanvasProps {
  character: CharacterCustomization;
  className?: string;
  initialPose?: CharacterPreviewPose;
}

export const CharacterPreviewCanvas: React.FC<CharacterPreviewCanvasProps> = ({
  character,
  className = 'w-full h-64',
  initialPose = 'hero',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rigRef = useRef<CharacterRig | null>(null);
  const rotationYRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const prevPointerXRef = useRef<number>(0);

  const [zoomTarget, setZoomTarget] = useState<ZoomTarget>('full');
  const [pose, setPoseState] = useState<CharacterPreviewPose>(initialPose);
  const poseRef = useRef<CharacterPreviewPose>(initialPose);
  poseRef.current = pose;

  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const isAutoRotatingRef = useRef<boolean>(true);
  isAutoRotatingRef.current = isAutoRotating;

  // References for camera target and position lerping
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.15, 3.4));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.05, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 1.05, 0));

  // Update target camera positions when zoom preset changes
  useEffect(() => {
    if (zoomTarget === 'face') {
      targetCamPos.current.set(0, 1.62, 1.05);
      targetLookAt.current.set(0, 1.58, 0);
    } else if (zoomTarget === 'torso') {
      targetCamPos.current.set(0, 1.35, 1.9);
      targetLookAt.current.set(0, 1.25, 0);
    } else {
      // Full body view
      targetCamPos.current.set(0, 1.15, 3.3);
      targetLookAt.current.set(0, 1.02, 0);
    }
  }, [zoomTarget]);

  // Update pose in rig
  useEffect(() => {
    if (rigRef.current) {
      rigRef.current.setPose(pose);
    }
  }, [pose]);

  // 1. Initialize Scene, Camera, Renderer and Render Loop ONCE
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.copy(targetCamPos.current);
    camera.lookAt(targetLookAt.current);

    // High Performance WebGLRenderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Warm Studio Lighting (Automotive Garage Key & Fill)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffedd5, 2.0);
    keyLight.position.set(3, 4, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.95);
    fillLight.position.set(-3, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xf59e0b, 1.5);
    rimLight.position.set(0, 3.5, -3);
    scene.add(rimLight);

    // Front portrait fill light for clear face and eye reflections
    const portraitLight = new THREE.DirectionalLight(0xfff7ed, 0.85);
    portraitLight.position.set(0.5, 1.65, 2.5);
    scene.add(portraitLight);

    // Soft ground glow
    const groundLight = new THREE.PointLight(0xf97316, 0.6, 6);
    groundLight.position.set(0, 0.2, 0);
    scene.add(groundLight);

    // Floor pedestal with chamfered rim
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.95, 0.06, 32),
      new THREE.MeshStandardMaterial({
        color: 0x18181b,
        metalness: 0.75,
        roughness: 0.35,
      })
    );
    pedestal.position.set(0, -0.03, 0);
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // Glowing amber pedestal ring
    const pedestalRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.88, 0.015, 8, 32),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    pedestalRing.rotation.x = Math.PI / 2;
    scene.add(pedestalRing);

    // Interactive Drag to Rotate
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      prevPointerXRef.current = clientX;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const dx = clientX - prevPointerXRef.current;
      prevPointerXRef.current = clientX;
      rotationYRef.current += dx * 0.012;
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
    };

    container.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    container.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animation & Turntable Loop
    let animId: number;
    let lastTime = performance.now();

    const renderLoop = () => {
      animId = requestAnimationFrame(renderLoop);
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Auto turntable rotation if idle
      if (isAutoRotatingRef.current && !isDraggingRef.current) {
        rotationYRef.current += dt * 0.22;
      }

      // Smooth camera interpolation toward target zoom preset
      camera.position.lerp(targetCamPos.current, dt * 6);
      currentLookAt.current.lerp(targetLookAt.current, dt * 6);
      camera.lookAt(currentLookAt.current);

      if (rigRef.current) {
        rigRef.current.group.rotation.y = rotationYRef.current;
        const isMoving = poseRef.current === 'walk';
        rigRef.current.updateAnimation(dt, isMoving, false);
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      container.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);

      if (rigRef.current) {
        rigRef.current.dispose();
        rigRef.current = null;
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  // 2. Seamless Character Rig Update whenever ANY Option Changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clean up previous rig instance safely
    if (rigRef.current) {
      scene.remove(rigRef.current.group);
      rigRef.current.dispose();
      rigRef.current = null;
    }

    // Instantiate new custom humanoid character rig
    const newRig = createHumanCharacter(character);
    rigRef.current = newRig;
    newRig.setPose(poseRef.current);
    newRig.group.position.set(0, 0, 0);
    newRig.group.rotation.y = rotationYRef.current;
    scene.add(newRig.group);
  }, [character]);

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none overflow-hidden group">
      <div
        ref={containerRef}
        className={`${className} cursor-grab active:cursor-grabbing`}
        title="Drag or swipe to rotate character 360°"
      />

      {/* Floating Controls: Camera Focus Views */}
      <div className="absolute top-2 left-2 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-zinc-800 shadow-lg">
        <button
          onClick={() => {
            soundFx.playClick();
            setZoomTarget('face');
          }}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-tech uppercase transition-colors cursor-pointer ${
            zoomTarget === 'face'
              ? 'bg-amber-500 text-black font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Zoom to Head & Face details"
        >
          <Eye size={12} />
          <span>Face</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setZoomTarget('torso');
          }}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-tech uppercase transition-colors cursor-pointer ${
            zoomTarget === 'torso'
              ? 'bg-amber-500 text-black font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Zoom to Upper Body & Attire"
        >
          <Shirt size={12} />
          <span>Torso</span>
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setZoomTarget('full');
          }}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-tech uppercase transition-colors cursor-pointer ${
            zoomTarget === 'full'
              ? 'bg-amber-500 text-black font-bold'
              : 'text-zinc-400 hover:text-white'
          }`}
          title="Full Body View"
        >
          <User size={12} />
          <span>Full</span>
        </button>
      </div>

      {/* Floating Pose Switcher & Turntable Toggle */}
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-xl border border-zinc-800 shadow-lg">
        <button
          onClick={() => {
            soundFx.playClick();
            rotationYRef.current = 0;
          }}
          className="p-1.5 rounded-lg text-xs text-zinc-400 hover:text-amber-400 hover:bg-zinc-800/80 transition-colors cursor-pointer"
          title="Reset front orientation"
        >
          <RefreshCw size={13} />
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            setIsAutoRotating(!isAutoRotating);
          }}
          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
            isAutoRotating ? 'text-amber-400 bg-amber-500/20' : 'text-zinc-400 hover:text-white'
          }`}
          title={isAutoRotating ? 'Pause 360° turntable' : 'Play 360° turntable'}
        >
          {isAutoRotating ? <Pause size={13} /> : <Play size={13} />}
        </button>

        <button
          onClick={() => {
            soundFx.playClick();
            const poses: CharacterPreviewPose[] = ['hero', 'inspect', 'walk'];
            const nextIdx = (poses.indexOf(pose) + 1) % poses.length;
            setPoseState(poses[nextIdx]);
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-tech uppercase text-zinc-300 transition-colors cursor-pointer"
          title="Cycle character animation stance"
        >
          <Sparkles size={11} className="text-amber-400" />
          <span>
            {pose === 'hero' ? 'Hero Pose' : pose === 'inspect' ? 'Inspect Pose' : 'Walk Cycle'}
          </span>
        </button>
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/60 border border-zinc-800 backdrop-blur-sm text-[10px] font-tech text-zinc-400 pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
        <span>↔ Drag to Rotate 360°</span>
      </div>
    </div>
  );
};
