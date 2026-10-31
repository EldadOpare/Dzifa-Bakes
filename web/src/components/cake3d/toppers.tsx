import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mulberry32 } from './geometry';
import { messageTextures } from './textures';

// Every topper is placed relative to the middle of the top of the cake, which sits at y = 0.
type Spot = { radius: number; shape: string };

const tau = Math.PI * 2;

// A crescent of positions around the upper-back rim, which reads well from the default camera.
function clusterPositions(count: number, radius: number, seed: number, spread = 1.7): [number, number, number][] {
  const rand = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => {
    const a = -Math.PI * 0.5 + (i / Math.max(1, count - 1) - 0.5) * spread * Math.PI + (rand() - 0.5) * 0.12;
    const r = radius * (0.5 + rand() * 0.18);
    return [Math.cos(a + Math.PI * 0.18) * r, 0, Math.sin(a + Math.PI * 0.18) * r];
  });
}

/* ---------------------------------- flowers ---------------------------------- */

const petalGeometry = (() => {
  const g = new THREE.SphereGeometry(1, 18, 12);
  g.scale(0.5, 0.1, 0.42);
  g.translate(0.44, 0, 0);
  return g;
})();

function Bloom({ position, scale, colour, seed }: { position: [number, number, number]; scale: number; colour: string; seed: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const rings = useMemo(() => [
    { n: 5, tilt: 1.15, lift: 0.1, size: 0.55 },
    { n: 7, tilt: 0.85, lift: 0.07, size: 0.8 },
    { n: 9, tilt: 0.55, lift: 0.04, size: 1.0 },
    { n: 11, tilt: 0.25, lift: 0.0, size: 1.2 },
  ], []);
  const total = rings.reduce((s, r) => s + r.n, 0);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const rand = mulberry32(seed);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let k = 0;
    rings.forEach((ring, ri) => {
      for (let i = 0; i < ring.n; i++) {
        const yaw = (i / ring.n) * tau + ri * 0.7 + (rand() - 0.5) * 0.25;
        e.set(0, yaw, ring.tilt + (rand() - 0.5) * 0.15, 'YZX');
        q.setFromEuler(e);
        m.compose(new THREE.Vector3(0, ring.lift, 0), q, new THREE.Vector3(ring.size, ring.size, ring.size * (0.9 + rand() * 0.2)));
        mesh.setMatrixAt(k++, m);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [rings, seed]);
  const lighter = useMemo(() => new THREE.Color(colour).lerp(new THREE.Color('#ffffff'), 0.55), [colour]);
  return (
    <group position={position} scale={scale}>
      <instancedMesh ref={ref} args={[petalGeometry, undefined, total]} castShadow>
        <meshPhysicalMaterial color={colour} roughness={0.5} sheen={1} sheenRoughness={0.4} sheenColor={lighter} side={THREE.DoubleSide} />
      </instancedMesh>
      <mesh position={[0, 0.05, 0]}>
        <sphereGeometry args={[0.1, 12, 8]} />
        <meshStandardMaterial color="#e0b44c" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Leaf({ position, rotation, scale }: { position: [number, number, number]; rotation: [number, number, number]; scale: number }) {
  return (
    <mesh position={position} rotation={rotation} scale={[scale, scale * 0.07, scale * 0.38]} castShadow>
      <sphereGeometry args={[1, 16, 8]} />
      <meshPhysicalMaterial color="#58784a" roughness={0.55} clearcoat={0.3} clearcoatRoughness={0.5} />
    </mesh>
  );
}

export function Flowers({ radius }: Spot) {
  const colours = ['#f6cdd2', '#fff4ea', '#efa9ae', '#ffffff', '#f9d9bd'];
  const spots = useMemo(() => clusterPositions(5, radius, 11), [radius]);
  const s = Math.min(0.26, radius * 0.23);
  return (
    <group>
      {spots.map((p, i) => (
        <group key={i}>
          <Bloom position={[p[0], 0.03 + (i % 2) * 0.03, p[2]]} scale={s * (i === 2 ? 1.25 : 0.95)} colour={colours[i % colours.length]!} seed={i + 4} />
          <Leaf position={[p[0] * 1.18, 0.01, p[2] * 1.18]} rotation={[0, -Math.atan2(p[2], p[0]) + 0.5, 0.15]} scale={s * 1.5} />
          <Leaf position={[p[0] * 0.86, 0.01, p[2] * 0.86]} rotation={[0, -Math.atan2(p[2], p[0]) - 0.7, 0.1]} scale={s * 1.3} />
        </group>
      ))}
    </group>
  );
}

/* ----------------------------------- berries ----------------------------------- */

const strawberryGeometry = (() => {
  const pts = [[0, -0.5], [0.08, -0.46], [0.22, -0.3], [0.34, -0.05], [0.4, 0.18], [0.36, 0.34], [0.2, 0.44], [0, 0.46]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 28);
})();

function Strawberry({ position, scale, rotation }: { position: [number, number, number]; scale: number; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={strawberryGeometry} castShadow>
        <meshPhysicalMaterial color="#c3102c" roughness={0.32} clearcoat={0.7} clearcoatRoughness={0.25} />
      </mesh>
      {Array.from({ length: 6 }, (_, i) => (
        <mesh key={i} position={[Math.cos((i / 6) * tau) * 0.14, 0.45, Math.sin((i / 6) * tau) * 0.14]} rotation={[0.4 * Math.sin((i / 6) * tau), 0, 0.5 * Math.cos((i / 6) * tau)]} scale={[0.2, 0.025, 0.07]}>
          <sphereGeometry args={[1, 10, 6]} />
          <meshStandardMaterial color="#4f7d3a" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Blueberry({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <sphereGeometry args={[0.5, 20, 16]} />
        <meshPhysicalMaterial color="#2b3a6e" roughness={0.45} sheen={1} sheenColor="#9aa8d8" sheenRoughness={0.6} />
      </mesh>
      <mesh position={[0, 0.46, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.1, 0.03, 8, 14]} />
        <meshStandardMaterial color="#1b2447" roughness={0.7} />
      </mesh>
    </group>
  );
}

function Raspberry({ position, scale }: { position: [number, number, number]; scale: number }) {
  const drupelets = useMemo(() => {
    const out: [number, number, number][] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < 34; i++) {
      const y = 1 - (i / 33) * 1.0;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      out.push([Math.cos(i * golden) * r * 0.42, y * 0.45 - 0.05, Math.sin(i * golden) * r * 0.42]);
    }
    return out;
  }, []);
  return (
    <group position={position} scale={scale}>
      {drupelets.map((p, i) => (
        <mesh key={i} position={p} castShadow>
          <sphereGeometry args={[0.13, 10, 8]} />
          <meshPhysicalMaterial color="#b3123f" roughness={0.38} clearcoat={0.5} clearcoatRoughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

export function Berries({ radius }: Spot) {
  const rand = useMemo(() => mulberry32(21), []);
  const items = useMemo(() => {
    const spots = clusterPositions(9, radius, 5, 2.1);
    return spots.map((p, i) => ({ p, kind: ['straw', 'blue', 'rasp'][i % 3] as 'straw' | 'blue' | 'rasp', rot: rand() * tau, lean: (rand() - 0.5) * 0.5 }));
  }, [radius, rand]);
  const s = Math.min(0.26, radius * 0.23);
  return (
    <group>
      {items.map(({ p, kind, rot, lean }, i) => {
        const pos: [number, number, number] = [p[0], 0, p[2]];
        if (kind === 'straw') return <Strawberry key={i} position={[pos[0], 0.2 * s * 1.7, pos[2]]} scale={s * 1.7} rotation={[Math.PI * 0.5 + lean, rot, 0.2]} />;
        if (kind === 'blue') return <Blueberry key={i} position={[pos[0], 0.5 * s * 1.1, pos[2]]} scale={s * 1.1} />;
        return <Raspberry key={i} position={[pos[0], 0.2 * s * 1.5, pos[2]]} scale={s * 1.5} />;
      })}
    </group>
  );
}

/* ---------------------------------- macarons ---------------------------------- */

const macaronShell = (() => {
  const pts = [[0, 0], [0.5, 0], [0.54, 0.02], [0.53, 0.06], [0.48, 0.1], [0.5, 0.15], [0.46, 0.22], [0.3, 0.27], [0, 0.29]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 40);
})();

function Macaron({ position, colour, scale, rotation }: { position: [number, number, number]; colour: string; scale: number; rotation: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={macaronShell} position={[0, 0, 0]} castShadow>
        <meshPhysicalMaterial color={colour} roughness={0.55} sheen={0.6} sheenColor="#ffffff" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.47, 0.47, 0.16, 36]} />
        <meshStandardMaterial color="#fbf3e4" roughness={0.7} />
      </mesh>
      <mesh geometry={macaronShell} position={[0, 0.7, 0]} scale={[1, -1, 1]} castShadow>
        <meshPhysicalMaterial color={colour} roughness={0.55} sheen={0.6} sheenColor="#ffffff" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export function Macarons({ radius }: Spot) {
  const colours = ['#f4b6c2', '#a8d8c6', '#f9dd8d', '#c9b8e6', '#f6c3a0'];
  const spots = useMemo(() => clusterPositions(5, radius, 8, 1.9), [radius]);
  const s = Math.min(0.26, radius * 0.23);
  return (
    <group>
      {spots.map((p, i) => (
        <Macaron key={i} position={[p[0], 0.04 + s * 0.46, p[2]]} colour={colours[i % colours.length]!} scale={s * 1.25} rotation={[Math.PI / 2 - 0.25, 0, -Math.atan2(p[2], p[0]) + Math.PI / 2]} />
      ))}
    </group>
  );
}

/* ------------------------------- chocolate sails ------------------------------- */

function Sail({ position, rotationY, height, curve }: { position: [number, number, number]; rotationY: number; height: number; curve: number }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(0.55, height, 14, 16);
    const p = g.getAttribute('position');
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / height + 0.5;
      const x = p.getX(i);
      p.setZ(i, Math.sin(x * 4.2 + curve) * 0.07 * (0.4 + y) + y * y * curve * 0.2);
      p.setX(i, x * (1 - y * 0.25));
    }
    g.translate(0, height / 2, 0);
    g.computeVertexNormals();
    return g;
  }, [height, curve]);
  return (
    <mesh geometry={geometry} position={position} rotation={[0, rotationY, 0.16 * Math.sign(curve || 1)]} castShadow>
      <meshPhysicalMaterial color="#2a150c" roughness={0.18} clearcoat={1} clearcoatRoughness={0.1} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function ChocolateSails({ radius }: Spot) {
  const spots = useMemo(() => clusterPositions(5, radius, 3, 1.5), [radius]);
  const s = Math.min(1, radius / 1.0);
  return (
    <group>
      {spots.map((p, i) => (
        <Sail key={i} position={[p[0], 0.01, p[2]]} rotationY={-Math.atan2(p[2], p[0]) + Math.PI / 2 + (i - 2) * 0.28} height={(0.55 + (i % 3) * 0.18) * s} curve={(i % 2 ? 1 : -1) * (0.6 + i * 0.1)} />
      ))}
    </group>
  );
}

/* ------------------------------ hand-piped message ------------------------------ */

export function PipedMessage({ radius, text, ink }: Spot & { text: string; ink: string }) {
  const textures = useMemo(() => messageTextures(text.trim() ? text : 'Your message', ink), [text, ink]);
  const size = Math.min(radius * 1.9, 2.6);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
      <planeGeometry args={[size, size / 2]} />
      <meshStandardMaterial map={textures.map} bumpMap={textures.bump} bumpScale={6} transparent alphaTest={0.05} roughness={0.5} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}
