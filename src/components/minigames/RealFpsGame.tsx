"use client";

import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Text } from "@react-three/drei";
import * as THREE from "three";

interface Target {
  id: number;
  position: [number, number, number];
  alive: boolean;
}

interface Bullet {
  id: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  born: number;
}

const TARGET_POSITIONS: [number, number, number][] = [
  [-4, 1, -8],
  [0, 1.5, -10],
  [4, 1, -8],
  [-6, 2, -12],
  [6, 2, -12],
  [0, 0.8, -14],
];

function NeonRoom() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, -6]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 2.5, -15]} receiveShadow castShadow>
        <boxGeometry args={[30, 5, 0.5]} />
        <meshStandardMaterial color="#16213e" />
      </mesh>
      <mesh position={[-15, 2.5, -6]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 5, 20]} />
        <meshStandardMaterial color="#16213e" />
      </mesh>
      <mesh position={[15, 2.5, -6]} receiveShadow castShadow>
        <boxGeometry args={[0.5, 5, 20]} />
        <meshStandardMaterial color="#16213e" />
      </mesh>
      <mesh position={[-8, 0.5, -10]}>
        <boxGeometry args={[3, 1, 3]} />
        <meshStandardMaterial color="#0f3460" emissive="#533483" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[8, 0.5, -10]}>
        <boxGeometry args={[3, 1, 3]} />
        <meshStandardMaterial color="#0f3460" emissive="#e94560" emissiveIntensity={0.3} />
      </mesh>
      <pointLight position={[-6, 3, -8]} color="#ff6b9d" intensity={80} distance={20} castShadow />
      <pointLight position={[6, 3, -8]} color="#00d4ff" intensity={80} distance={20} castShadow />
      <spotLight
        position={[0, 8, 2]}
        angle={0.5}
        penumbra={0.5}
        intensity={120}
        castShadow
        color="#ffffff"
      />
      <ambientLight intensity={0.15} />
    </>
  );
}

function TargetCube({
  position,
  alive,
  onHit,
}: {
  position: [number, number, number];
  alive: boolean;
  onHit: () => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current && alive) {
      ref.current.rotation.y += delta * 0.8;
      ref.current.rotation.x += delta * 0.3;
    }
  });
  if (!alive) return null;
  return (
    <mesh
      ref={ref}
      position={position}
      castShadow
      onClick={(e) => {
        e.stopPropagation();
        onHit();
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff6b9d" emissive="#ff6b9d" emissiveIntensity={0.6} metalness={0.8} />
    </mesh>
  );
}

function Bullets({
  bullets,
  targets,
  onTargetHit,
  onRemove,
}: {
  bullets: Bullet[];
  targets: Target[];
  onTargetHit: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const refs = useRef<Map<number, THREE.Mesh>>(new Map());

  useFrame((_, delta) => {
    const now = Date.now();
    for (const b of bullets) {
      const mesh = refs.current.get(b.id);
      if (!mesh) continue;
      mesh.position.addScaledVector(b.velocity, delta);
      if (now - b.born > 3000) {
        onRemove(b.id);
        continue;
      }
      for (const t of targets) {
        if (!t.alive) continue;
        const dist = mesh.position.distanceTo(new THREE.Vector3(...t.position));
        if (dist < 0.8) {
          onTargetHit(t.id);
          onRemove(b.id);
          break;
        }
      }
    }
  });

  return (
    <>
      {bullets.map((b) => (
        <mesh
          key={b.id}
          ref={(el) => {
            if (el) refs.current.set(b.id, el);
          }}
          position={b.position}
        >
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
        </mesh>
      ))}
    </>
  );
}

function FpsScene({
  onAllClear,
}: {
  onAllClear: () => void;
}) {
  const { camera } = useThree();
  const [targets, setTargets] = useState<Target[]>(() =>
    TARGET_POSITIONS.map((pos, i) => ({ id: i, position: pos, alive: true })),
  );
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const bulletId = useRef(0);
  const clearedRef = useRef(false);

  useEffect(() => {
    camera.position.set(0, 1.6, 2);
  }, [camera]);

  const fire = useCallback(() => {
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const origin = camera.position.clone();
    setBullets((prev) => [
      ...prev,
      {
        id: bulletId.current++,
        position: origin,
        velocity: dir.multiplyScalar(25),
        born: Date.now(),
      },
    ]);
  }, [camera]);

  const hitTarget = useCallback(
    (id: number) => {
      setTargets((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, alive: false } : t));
        if (next.every((t) => !t.alive) && !clearedRef.current) {
          clearedRef.current = true;
          setTimeout(onAllClear, 400);
        }
        return next;
      });
    },
    [onAllClear],
  );

  useEffect(() => {
    const onClick = () => fire();
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [fire]);

  const aliveCount = targets.filter((t) => t.alive).length;

  return (
    <>
      <color attach="background" args={["#050510"]} />
      <fog attach="fog" args={["#050510", 5, 35]} />
      <NeonRoom />
      {targets.map((t) => (
        <TargetCube
          key={t.id}
          position={t.position}
          alive={t.alive}
          onHit={() => hitTarget(t.id)}
        />
      ))}
      <Bullets
        bullets={bullets}
        targets={targets}
        onTargetHit={hitTarget}
        onRemove={(id) => setBullets((prev) => prev.filter((b) => b.id !== id))}
      />
      <PointerLockControls />
      <Text position={[0, 3, -4]} fontSize={0.4} color="#ff6b9d" anchorX="center">
        {`TARGETS: ${aliveCount}`}
      </Text>
      <Text position={[0, 2.4, -4]} fontSize={0.2} color="#9494b0" anchorX="center">
        クリックで射撃 · ESCで解除
      </Text>
    </>
  );
}

interface RealFpsGameProps {
  onClear: () => void;
}

export function RealFpsGame({ onClear }: RealFpsGameProps) {
  const [started, setStarted] = useState(false);

  return (
    <div className="relative w-full h-[70vh] min-h-[400px] rounded-xl overflow-hidden border-2 border-[#ff6b9d]/40 shadow-[0_0_40px_rgba(255,107,157,0.2)]">
      {!started && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <p className="text-white text-lg font-bold mb-2">ネオンFPS — 超高画質モード</p>
          <p className="text-[#9494b0] text-sm mb-4 text-center px-4">
            画面をクリックしてPointer Lock · ターゲット全滅でEXP獲得
          </p>
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#ff6b9d] to-[#533483] text-white font-bold hover:scale-105 transition-transform"
          >
            起動する
          </button>
        </div>
      )}
      {started && (
        <Canvas shadows camera={{ fov: 75, near: 0.1, far: 100 }}>
          <Suspense fallback={null}>
            <FpsScene onAllClear={onClear} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
