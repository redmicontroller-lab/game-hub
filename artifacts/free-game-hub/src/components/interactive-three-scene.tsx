import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

export type Piece3D = {
  id: string;
  shape: 'tile' | 'cube' | 'sphere' | 'cylinder' | 'cone' | 'ring' | 'car' | 'coin' | 'gate' | 'star';
  position: [number, number, number];
  color: string;
  label?: string;
  size?: number;
  selected?: boolean;
  disabled?: boolean;
  rotation?: [number, number, number];
  pulse?: boolean;
};

export type SceneTheme = 'board' | 'race' | 'space' | 'garden' | 'neon' | 'arcade';

export type InteractiveThreeSceneProps = {
  pieces: Piece3D[];
  theme: SceneTheme;
  onPieceClick: (id: string) => void;
  label: string;
  cameraMode?: 'tabletop' | 'follow' | 'orbit';
  showGrid?: boolean;
};

type ThemeStyle = {
  background: string;
  floor: string;
  grid: string;
  accent: string;
  ambient: number;
  sun: string;
  fog: string;
};

const THEMES: Record<SceneTheme, ThemeStyle> = {
  board: { background: '#e4eddf', floor: '#cbdcc8', grid: '#92ad95', accent: '#f47d5c', ambient: 1.7, sun: '#fff0d0', fog: '#e4eddf' },
  race: { background: '#c6dce0', floor: '#77967e', grid: '#f0d27d', accent: '#ed7658', ambient: 1.35, sun: '#fff2d7', fog: '#c6dce0' },
  space: { background: '#222844', floor: '#303752', grid: '#687299', accent: '#f1d46c', ambient: 1.25, sun: '#d1dcff', fog: '#222844' },
  garden: { background: '#dce9d7', floor: '#a5c39d', grid: '#83a981', accent: '#e87859', ambient: 1.7, sun: '#fff4d8', fog: '#dce9d7' },
  neon: { background: '#28334a', floor: '#323e55', grid: '#76c9bd', accent: '#f37c65', ambient: 1.15, sun: '#c5edeb', fog: '#28334a' },
  arcade: { background: '#eee5ce', floor: '#d7c8a8', grid: '#9b9679', accent: '#e96c4e', ambient: 1.65, sun: '#fff1ce', fog: '#eee5ce' },
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

function CarModel({ color }: { color: string }) {
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.19, 0]}>
        <boxGeometry args={[0.92, 0.27, 1.58]} />
        <meshStandardMaterial color={color} roughness={0.32} metalness={0.12} />
      </mesh>
      <mesh castShadow position={[0, 0.4, -0.16]}>
        <boxGeometry args={[0.63, 0.29, 0.72]} />
        <meshStandardMaterial color="#dce9e6" roughness={0.22} metalness={0.08} />
      </mesh>
      <mesh position={[0, 0.23, 0.69]}>
        <boxGeometry args={[0.66, 0.055, 0.12]} />
        <meshStandardMaterial color="#fff0bf" emissive="#d5a84d" emissiveIntensity={0.28} />
      </mesh>
      {[-1, 1].map((side) => [-0.48, 0.49].map((z) => (
        <mesh key={`${side}-${z}`} castShadow rotation={[0, 0, Math.PI / 2]} position={[side * 0.48, 0.17, z]}>
          <cylinderGeometry args={[0.17, 0.17, 0.12, 12]} />
          <meshStandardMaterial color="#252b40" roughness={0.78} />
        </mesh>
      )))}
      <mesh position={[0, 0.34, -0.6]}>
        <boxGeometry args={[0.72, 0.06, 0.12]} />
        <meshStandardMaterial color="#252b40" />
      </mesh>
    </group>
  );
}

function PieceMesh({
  piece,
  onPieceClick,
  reduceMotion,
}: {
  piece: Piece3D;
  onPieceClick: (id: string) => void;
  reduceMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const size = Math.max(0.25, piece.size ?? 0.78);

  useFrame(({ clock }) => {
    if (!group.current) return;
    if (piece.pulse && !reduceMotion) {
      const scale = 1 + Math.sin(clock.elapsedTime * 3.4 + piece.position[0] * 2) * 0.045;
      group.current.scale.setScalar(scale);
    } else {
      group.current.scale.setScalar(hovered ? 1.065 : 1);
    }
    if (piece.shape === 'coin' && !reduceMotion && !piece.rotation) {
      group.current.rotation.y = clock.elapsedTime * 0.9;
    }
  });

  const materialColor = piece.disabled ? '#92958c' : piece.color;
  const highlight = hovered || piece.selected;
  const handleClick = (event: { stopPropagation: () => void }) => {
    event.stopPropagation();
    if (!piece.disabled) onPieceClick(piece.id);
  };
  const pointerProps = piece.disabled ? {} : {
    onClick: handleClick,
    onPointerOver: (event: { stopPropagation: () => void }) => { event.stopPropagation(); setHovered(true); },
    onPointerOut: () => setHovered(false),
  };

  return (
    <group ref={group} position={piece.position} rotation={piece.rotation ?? [0, 0, 0]}>
      <group {...pointerProps} scale={size}>
        {piece.shape === 'tile' && (
          <mesh castShadow receiveShadow position={[0, 0.09, 0]}>
            <boxGeometry args={[1.08, 0.18, 1.08]} />
            <meshStandardMaterial color={materialColor} roughness={0.72} />
          </mesh>
        )}
        {piece.shape === 'cube' && <mesh castShadow receiveShadow position={[0, 0.45, 0]}><boxGeometry args={[0.82, 0.82, 0.82]} /><meshStandardMaterial color={materialColor} roughness={0.38} /></mesh>}
        {piece.shape === 'sphere' && <mesh castShadow position={[0, 0.47, 0]}><sphereGeometry args={[0.47, 28, 20]} /><meshStandardMaterial color={materialColor} roughness={0.28} metalness={0.08} /></mesh>}
        {piece.shape === 'cylinder' && <mesh castShadow position={[0, 0.42, 0]}><cylinderGeometry args={[0.38, 0.38, 0.8, 24]} /><meshStandardMaterial color={materialColor} roughness={0.42} /></mesh>}
        {piece.shape === 'cone' && <mesh castShadow position={[0, 0.46, 0]}><coneGeometry args={[0.46, 0.92, 24]} /><meshStandardMaterial color={materialColor} roughness={0.4} /></mesh>}
        {piece.shape === 'ring' && <mesh castShadow position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.34, 0.12, 12, 32]} /><meshStandardMaterial color={materialColor} metalness={0.35} roughness={0.27} /></mesh>}
        {piece.shape === 'car' && <group position={[0, 0, 0]}><CarModel color={materialColor} /></group>}
        {piece.shape === 'coin' && <group position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}><mesh castShadow><cylinderGeometry args={[0.36, 0.36, 0.12, 32]} /><meshStandardMaterial color={materialColor} metalness={0.58} roughness={0.23} /></mesh><mesh position={[0, 0, 0.067]}><torusGeometry args={[0.23, 0.035, 8, 28]} /><meshStandardMaterial color="#fff1bd" metalness={0.5} roughness={0.24} /></mesh></group>}
        {piece.shape === 'gate' && <group><mesh castShadow position={[-0.48, 0.58, 0]}><boxGeometry args={[0.14, 1.16, 0.16]} /><meshStandardMaterial color={materialColor} /></mesh><mesh castShadow position={[0.48, 0.58, 0]}><boxGeometry args={[0.14, 1.16, 0.16]} /><meshStandardMaterial color={materialColor} /></mesh><mesh castShadow position={[0, 1.13, 0]}><boxGeometry args={[1.1, 0.16, 0.16]} /><meshStandardMaterial color={materialColor} /></mesh></group>}
        {piece.shape === 'star' && <mesh castShadow position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}><dodecahedronGeometry args={[0.48, 0]} /><meshStandardMaterial color={materialColor} metalness={0.22} roughness={0.3} /></mesh>}
        {highlight && !piece.disabled && <mesh position={[0, 0.025, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.57, 0.66, 40]} /><meshBasicMaterial color={piece.selected ? '#f47d5c' : '#fff0b6'} transparent opacity={0.9} /></mesh>}
      </group>
      {piece.label && (
        <Text
          position={[0, size * (piece.shape === 'gate' ? 1.42 : 1.36), 0]}
          fontSize={Math.min(0.22, 0.18 / Math.max(0.7, size))}
          color="#252b40"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.012}
          outlineColor="#f8f2e4"
          maxWidth={2.5}
          textAlign="center"
        >
          {piece.label}
        </Text>
      )}
    </group>
  );
}

function RaceRoad({ pieces }: { pieces: Piece3D[] }) {
  const roadLength = Math.max(8, Math.min(16, pieces.length * 1.7 + 5));
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
        <planeGeometry args={[5.7, roadLength]} />
        <meshStandardMaterial color="#4a5058" roughness={0.9} />
      </mesh>
      {[-1, 1].map((x) => (
        <mesh key={`edge-${x}`} rotation={[-Math.PI / 2, 0, 0]} position={[x * 2.72, 0.03, 0]}>
          <planeGeometry args={[0.13, roadLength]} />
          <meshStandardMaterial color="#ee795d" />
        </mesh>
      ))}
      {[-0.95, 0.95].map((x) => (
        <group key={`lane-${x}`}>
          {Array.from({ length: Math.ceil(roadLength / 1.8) }, (_, index) => (
            <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.035, -roadLength / 2 + index * 1.8 + 0.55]}>
              <planeGeometry args={[0.075, 0.76]} />
              <meshBasicMaterial color="#f4ecd4" />
            </mesh>
          ))}
        </group>
      ))}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[-4.3, 0, 0]}>
        <planeGeometry args={[3, roadLength + 2]} />
        <meshStandardMaterial color="#83a986" roughness={1} />
      </mesh>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[4.3, 0, 0]}>
        <planeGeometry args={[3, roadLength + 2]} />
        <meshStandardMaterial color="#83a986" roughness={1} />
      </mesh>
    </group>
  );
}

function SceneBackdrop({ theme, pieces, showGrid }: { theme: SceneTheme; pieces: Piece3D[]; showGrid: boolean }) {
  const style = THEMES[theme];
  const span = Math.max(9, Math.min(18, Math.sqrt(pieces.length + 1) * 3.3));
  if (theme === 'race') return <RaceRoad pieces={pieces} />;
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.075, 0]}>
        <planeGeometry args={[span, span]} />
        <meshStandardMaterial color={style.floor} roughness={theme === 'neon' || theme === 'space' ? 0.46 : 0.86} metalness={theme === 'neon' ? 0.12 : 0} />
      </mesh>
      {showGrid && (
        <gridHelper args={[span, Math.round(span * 2), style.grid, style.grid]} position={[0, -0.06, 0]}>
          <lineBasicMaterial color={style.grid} transparent opacity={theme === 'space' || theme === 'neon' ? 0.45 : 0.35} />
        </gridHelper>
      )}
      {theme === 'space' && (
        <group>
          {[-4.2, 4.2].map((x, i) => <mesh key={i} position={[x, 0.08, -2.7 + i * 5.4]}><sphereGeometry args={[0.58, 24, 20]} /><meshStandardMaterial color={i ? '#e88768' : '#7ab3c0'} roughness={0.72} /></mesh>)}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}><ringGeometry args={[2.7, 2.76, 64]} /><meshBasicMaterial color={style.accent} transparent opacity={0.35} /></mesh>
        </group>
      )}
      {theme === 'garden' && [-1, 1].map((side) => (
        <group key={side} position={[side * (span * 0.34), 0, -span * 0.28]}>
          <mesh castShadow position={[0, 0.22, 0]}><cylinderGeometry args={[0.13, 0.2, 0.44, 10]} /><meshStandardMaterial color="#98775a" /></mesh>
          <mesh castShadow position={[0, 0.66, 0]}><sphereGeometry args={[0.48, 14, 12]} /><meshStandardMaterial color={side > 0 ? '#5c9a72' : '#76a97d'} roughness={0.88} /></mesh>
        </group>
      ))}
      {theme === 'neon' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <ringGeometry args={[span * 0.36, span * 0.365, 64]} />
          <meshBasicMaterial color={style.accent} transparent opacity={0.55} />
        </mesh>
      )}
      {(theme === 'arcade' || theme === 'board') && (
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]}>
          <planeGeometry args={[span * 0.72, span * 0.72]} />
          <meshStandardMaterial color={theme === 'board' ? '#d9e6d5' : '#e8dec7'} roughness={0.95} />
        </mesh>
      )}
    </group>
  );
}

function FollowCamera({ target, enabled }: { target: THREE.Vector3; enabled: boolean }) {
  const { camera } = useThree();
  useFrame((_, delta) => {
    if (!enabled) return;
    const goal = new THREE.Vector3(target.x, 7.4, target.z + 9);
    camera.position.lerp(goal, 1 - Math.exp(-delta * 2.5));
    camera.lookAt(target.x, 0, target.z);
  });
  return null;
}

function SceneContents({
  pieces,
  theme,
  onPieceClick,
  cameraMode,
  showGrid,
  reducedMotion,
}: Required<Pick<InteractiveThreeSceneProps, 'pieces' | 'theme' | 'onPieceClick' | 'cameraMode' | 'showGrid'>> & { reducedMotion: boolean }) {
  const style = THEMES[theme];
  const center = useMemo(() => {
    if (!pieces.length) return new THREE.Vector3(0, 0, 0);
    const mean = pieces.reduce((acc, piece) => {
      acc.x += piece.position[0];
      acc.z += piece.position[2];
      return acc;
    }, { x: 0, z: 0 });
    return new THREE.Vector3(mean.x / pieces.length, 0, mean.z / pieces.length);
  }, [pieces]);

  return (
    <>
      <color attach="background" args={[style.background]} />
      <fog attach="fog" args={[style.fog, 12, 27]} />
      <ambientLight intensity={style.ambient} />
      <hemisphereLight args={['#fff8e8', theme === 'space' || theme === 'neon' ? '#414b70' : '#82977e', 0.85]} />
      <directionalLight castShadow position={[-5, 9, 5]} intensity={2.2} color={style.sun} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
      <directionalLight position={[5, 4, -4]} intensity={0.75} color={theme === 'neon' || theme === 'space' ? '#9dc7ed' : '#f1b794'} />
      <SceneBackdrop theme={theme} pieces={pieces} showGrid={showGrid} />
      {pieces.map((piece) => <PieceMesh key={piece.id} piece={piece} onPieceClick={onPieceClick} reduceMotion={reducedMotion} />)}
      {cameraMode === 'orbit' && (
        <OrbitControls
          target={center}
          enablePan={false}
          enableDamping={!reducedMotion}
          dampingFactor={0.08}
          minDistance={5}
          maxDistance={17}
          minPolarAngle={0.25}
          maxPolarAngle={Math.PI / 2.15}
          rotateSpeed={0.58}
        />
      )}
      {cameraMode === 'follow' && <FollowCamera target={center} enabled={!reducedMotion} />}
    </>
  );
}

export function InteractiveThreeScene({
  pieces,
  theme,
  onPieceClick,
  label,
  cameraMode = 'tabletop',
  showGrid = true,
}: InteractiveThreeSceneProps) {
  const reducedMotion = useReducedMotion();
  const style = THEMES[theme];
  const cameraPosition: [number, number, number] = cameraMode === 'tabletop' ? [0, 11, 10] : [0, 8, 10];
  return (
    <div
      role="application"
      aria-label={label}
      data-testid="interactive-three-scene"
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 240,
        height: '100%',
        overflow: 'hidden',
        borderRadius: 16,
        background: style.background,
        touchAction: cameraMode === 'orbit' ? 'pan-y' : 'manipulation',
      }}
    >
      <Canvas
        shadows
        dpr={[1, 1.6]}
        camera={{ position: cameraPosition, fov: 38, near: 0.1, far: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(style.background, 1);
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        <SceneContents
          pieces={pieces}
          theme={theme}
          onPieceClick={onPieceClick}
          cameraMode={cameraMode}
          showGrid={showGrid}
          reducedMotion={reducedMotion}
        />
      </Canvas>
      {pieces.length === 0 && (
        <div
          aria-live="polite"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            color: '#3b4651',
            font: '600 14px Outfit, sans-serif',
            pointerEvents: 'none',
          }}
        >
          Ready when you are
        </div>
      )}
    </div>
  );
}
