import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  dripColours, fillingColours, sizeInches, spongeColours,
  type CakeShape, type IcingStyle,
} from '@/lib/cake-design';
import { buildDripGeometry, buildTierGeometry, makeSurface, noise2, type TierSpec } from './geometry';
import { buildOutline, offsetShape, outlineCount, type Outline } from './outline';
import { grainTexture, mottleTexture } from './textures';
import { Berries, ChocolateSails, Flowers, Macarons, PipedMessage } from './toppers';

export type CakeDesign = {
  size: string;
  layers: number;
  tiers: number;
  shape: CakeShape;
  flavour: string;
  frosting: string;
  icingColour: string;
  icingStyle: IcingStyle;
  drip: string;
  topper: string;
  message: string;
  visible: boolean;
  slice: boolean;
};

type Slice = { planes: THREE.Plane[]; theta1: number; theta2: number };

// The slice faces the viewer: a wedge straight out of the cake, cut with two planes through its middle.
const sliceCentre = 0.5;
const sliceHalfAngle = 0.5;
function makeSlice(): Slice {
  const theta1 = sliceCentre + sliceHalfAngle, theta2 = sliceCentre - sliceHalfAngle;
  const n1 = new THREE.Vector3(-Math.cos(theta1), 0, Math.sin(theta1));
  const n2 = new THREE.Vector3(Math.cos(theta2), 0, -Math.sin(theta2));
  // Clip where both inside-the-wedge tests hold, so the planes face away from the wedge.
  return { planes: [new THREE.Plane(n1.negate(), 0), new THREE.Plane(n2.negate(), 0)], theta1, theta2 };
}

const LAYER_HEIGHT = 0.3;
const TIER_SHRINK = 0.74;

const luminance = (c: THREE.Color) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;

function inradius(outline: Outline) {
  let min = Infinity;
  for (let i = 0; i < outline.count; i++) min = Math.min(min, Math.hypot(outline.x[i]!, outline.z[i]!));
  return min;
}

// Where a ray from the cake's centre meets the outline.
function rayHit(outline: Outline, ux: number, uz: number) {
  let best = Infinity;
  const n = outline.count;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const ax = outline.x[i]!, az = outline.z[i]!;
    const ex = outline.x[j]! - ax, ez = outline.z[j]! - az;
    const det = ux * -ez - uz * -ex;
    if (Math.abs(det) < 1e-9) continue;
    const t = (ax * -ez - az * -ex) / det;
    const k = (ux * az - uz * ax) / det;
    if (t > 0 && k >= 0 && k <= 1) best = Math.min(best, t);
  }
  return Number.isFinite(best) ? best : 1;
}

// The freshly cut face of a slice: sponge layers, filling between them, icing on the outside.
function CutWall({ spec, theta }: { spec: TierSpec; theta: number }) {
  const geometry = useMemo(() => {
    const ux = Math.sin(theta), uz = Math.cos(theta);
    const R = rayHit(spec.outline, ux, uz);
    const cols = 30;
    const rows = spec.layers * 24;
    const layerH = spec.height / spec.layers;
    const pos = new Float32Array((cols + 1) * (rows + 1) * 3);
    const col = new Float32Array((cols + 1) * (rows + 1) * 3);
    const c = new THREE.Color();
    for (let ri = 0; ri <= rows; ri++) {
      const y = (ri / rows) * spec.height;
      for (let ci = 0; ci <= cols; ci++) {
        const r = (ci / cols) * R;
        const idx = (ri * (cols + 1) + ci) * 3;
        pos.set([ux * r, y, uz * r], idx);
        const k = y / layerH;
        const interior = Math.round(k) > 0 && Math.round(k) < spec.layers;
        const nearSeam = Math.abs(k - Math.round(k)) * layerH;
        const crumb = 0.9 + 0.2 * noise2(r * 45, y * 45);
        if (r > R - 0.05 || y > spec.height - 0.05 || y < 0.02) c.copy(spec.icing);
        else if (interior && nearSeam < layerH * 0.075) c.copy(spec.filling);
        else c.copy(spec.sponge).multiplyScalar(crumb);
        col.set([c.r, c.g, c.b], idx);
      }
    }
    const index: number[] = [];
    for (let ri = 0; ri < rows; ri++) for (let ci = 0; ci < cols; ci++) {
      const a = ri * (cols + 1) + ci, b = a + 1, d = a + cols + 1, e = d + 1;
      index.push(a, d, b, b, d, e);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(index);
    g.computeVertexNormals();
    return g;
  }, [spec, theta]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial vertexColors roughness={0.85} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Border({ outline, y, kind, colour, offset }: { outline: Outline; y: number; kind: 'rosette' | 'pearl'; colour: THREE.Color; offset: (i: number) => number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const spacing = kind === 'rosette' ? 0.15 : 0.085;
  const count = Math.max(8, Math.round(outline.perimeter / spacing));
  const geometry = useMemo(() => {
    if (kind === 'pearl') return new THREE.SphereGeometry(0.032, 14, 10);
    // A piped star-tip rosette: a tapering twisted dollop.
    const profile = Array.from({ length: 14 }, (_, k) => {
      const t = k / 13;
      return new THREE.Vector2(0.075 * (1 - t) ** 0.8 * (1 + 0.18 * Math.sin(t * 18)), t * 0.11);
    });
    return new THREE.LatheGeometry(profile, 18);
  }, [kind]);
  useEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    for (let k = 0; k < count; k++) {
      const i = Math.floor((k / count) * outline.count);
      const o = offset(i) + (kind === 'pearl' ? 0.0 : -0.012);
      const px = outline.x[i]! + outline.nx[i]! * o, pz = outline.z[i]! + outline.nz[i]! * o;
      m.compose(new THREE.Vector3(px, y + (kind === 'pearl' ? 0.01 : 0), pz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, k * 0.7, 0)), new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(k, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, outline, y, offset, kind]);
  return (
    <instancedMesh ref={ref} args={[geometry, undefined, count]} castShadow>
      {kind === 'pearl'
        ? <meshPhysicalMaterial color="#fbf6ea" roughness={0.22} metalness={0.25} clearcoat={1} clearcoatRoughness={0.1} sheen={1} sheenColor="#ffe9d6" />
        : <meshPhysicalMaterial color={colour} roughness={0.55} sheen={0.7} sheenColor={colour.clone().lerp(new THREE.Color('#ffffff'), 0.5)} />}
    </instancedMesh>
  );
}

function Tier({ spec, baseY, drip, border, icingColour, children, seed, clip }: {
  spec: TierSpec; baseY: number; drip: string; border: 'rosette' | 'pearl' | null; icingColour: THREE.Color; children?: React.ReactNode; seed: number; clip: Slice | null;
}) {
  const surface = useMemo(() => makeSurface(spec), [spec]);
  const geometry = useMemo(() => buildTierGeometry(spec, surface), [spec, surface]);
  const dripGeo = useMemo(() => (drip === 'No drip' ? null : buildDripGeometry(spec, surface, seed)), [drip, spec, surface, seed]);
  const grain = useMemo(() => grainTexture(), []);
  const mottle = useMemo(() => mottleTexture(), []);
  useEffect(() => () => { geometry.dispose(); dripGeo?.wall.dispose(); dripGeo?.cap.dispose(); }, [geometry, dripGeo]);
  const naked = spec.style === 'Naked' || spec.style === 'Semi-naked';
  const dripColour = dripColours[drip] ?? '#3a1e12';
  const edgeOffset = useMemo(() => (i: number) => surface.offset(i, spec.height - 0.03), [surface, spec.height]);
  const baseOffset = useMemo(() => (i: number) => surface.offset(i, 0.05), [surface]);

  return (
    <group position={[0, baseY, 0]}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial
          vertexColors
          clippingPlanes={clip ? clip.planes : null}
          clipIntersection
          side={clip ? THREE.DoubleSide : THREE.FrontSide}
          roughness={naked ? 0.82 : 0.58}
          roughnessMap={naked ? undefined : mottle}
          bumpMap={grain}
          bumpScale={naked ? 2.4 : 0.9}
          sheen={naked ? 0.2 : 0.75}
          sheenRoughness={0.55}
          sheenColor={icingColour.clone().lerp(new THREE.Color('#ffffff'), 0.6)}
        />
      </mesh>
      {dripGeo && (
        <>
          <mesh geometry={dripGeo.wall} castShadow>
            <meshPhysicalMaterial color={dripColour} roughness={0.14} clearcoat={1} clearcoatRoughness={0.06} side={THREE.DoubleSide} envMapIntensity={1.4} clippingPlanes={clip ? clip.planes : null} clipIntersection />
          </mesh>
          <mesh geometry={dripGeo.cap}>
            <meshPhysicalMaterial color={dripColour} roughness={0.14} clearcoat={1} clearcoatRoughness={0.06} envMapIntensity={1.4} clippingPlanes={clip ? clip.planes : null} clipIntersection side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
      {clip && <><CutWall spec={spec} theta={clip.theta1} /><CutWall spec={spec} theta={clip.theta2} /></>}
      {border && <Border outline={spec.outline} y={spec.height - 0.02} kind={border} colour={icingColour} offset={edgeOffset} />}
      {border === 'rosette' && <Border outline={spec.outline} y={0.04} kind={border} colour={icingColour} offset={baseOffset} />}
      {children}
    </group>
  );
}

export function Cake({ design }: { design: CakeDesign }) {
  const group = useRef<THREE.Group>(null);
  const pulse = useRef(0);
  const key = JSON.stringify([design.size, design.layers, design.tiers, design.shape, design.icingStyle, design.drip]);
  useEffect(() => { pulse.current = 1; }, [key]);
  const cakeGroup = useRef<THREE.Group>(null);
  const grow = useRef(0);
  const slice = useMemo(() => makeSlice(), []);
  useFrame((_, dt) => {
    pulse.current = Math.max(0, pulse.current - dt * 3.2);
    grow.current = design.visible ? Math.min(1, grow.current + dt * 1.6) : 0;
    if (group.current) group.current.scale.setScalar(1);
    if (cakeGroup.current) {
      const eased = 1 - (1 - grow.current) ** 3;
      const bump = 1 - 0.035 * Math.sin(pulse.current * Math.PI);
      cakeGroup.current.scale.set(bump * (0.92 + 0.08 * eased), Math.max(0.001, eased) * bump, bump * (0.92 + 0.08 * eased));
      cakeGroup.current.visible = grow.current > 0.001;
    }
  });

  const baseRadius = (sizeInches[design.size] ?? 8) / 8;
  const icing = useMemo(() => new THREE.Color(design.icingColour), [design.icingColour]);
  const sponge = useMemo(() => new THREE.Color(spongeColours[design.flavour] ?? '#EFD79B'), [design.flavour]);
  const filling = useMemo(() => new THREE.Color(fillingColours[design.frosting] ?? '#FFFDF6'), [design.frosting]);

  const tiers = useMemo(() => {
    let y = 0;
    return Array.from({ length: design.tiers }, (_, i) => {
      const radius = baseRadius * TIER_SHRINK ** i;
      const outline = buildOutline(design.shape, radius, outlineCount(radius));
      const height = design.layers * LAYER_HEIGHT;
      const spec: TierSpec = { outline, height, layers: design.layers, style: design.icingStyle, icing, sponge, filling };
      const tier = { spec, baseY: y, radius };
      y += height;
      return tier;
    });
  }, [design.tiers, design.layers, design.shape, design.icingStyle, baseRadius, icing, sponge, filling]);

  const top = tiers[tiers.length - 1]!;
  const topY = top.baseY + top.spec.height;
  const topInradius = inradius(top.spec.outline);
  const border = design.icingStyle === 'Rosette border' ? 'rosette' : design.icingStyle === 'Pearl border' ? 'pearl' : null;
  const boardShape = useMemo(() => offsetShape(tiers[0]!.spec.outline, 0.1), [tiers]);
  const plateRadius = useMemo(() => {
    let max = 0;
    const o = tiers[0]!.spec.outline;
    for (let i = 0; i < o.count; i++) max = Math.max(max, Math.hypot(o.x[i]!, o.z[i]!));
    return max + 0.55;
  }, [tiers]);

  const messageInk = useMemo(() => {
    const base = design.drip !== 'No drip' ? new THREE.Color(dripColours[design.drip] ?? '#3a1e12') : icing;
    return luminance(base) > 0.45 ? '#7a4a38' : '#ffffff';
  }, [design.drip, icing]);

  return (
    <group ref={group}>
      {/* Porcelain cake stand */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <cylinderGeometry args={[plateRadius, plateRadius * 0.92, 0.06, 96]} />
        <meshPhysicalMaterial color="#ffffff" roughness={0.12} clearcoat={1} clearcoatRoughness={0.05} />
      </mesh>
      <mesh position={[0, -0.095, 0]}>
        <cylinderGeometry args={[plateRadius * 0.3, plateRadius * 0.38, 0.14, 48]} />
        <meshPhysicalMaterial color="#f4f1ec" roughness={0.2} clearcoat={1} />
      </mesh>
      <group ref={cakeGroup}>
      {/* Foil cake board */}
      <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[boardShape, { depth: 0.03, bevelEnabled: false, curveSegments: 4 }]} />
        <meshPhysicalMaterial color="#e6d3a8" roughness={0.25} metalness={0.85} />
      </mesh>

      {tiers.map((tier, i) => (
        <Tier key={i} spec={tier.spec} baseY={tier.baseY} drip={design.drip} border={border} icingColour={icing} seed={31 + i * 17} clip={design.slice ? slice : null}>
          {i === tiers.length - 1 && (
            <group position={[0, tier.spec.height + (design.drip !== 'No drip' ? 0.01 : 0), 0]}>
              {design.topper === 'Fresh flowers' && <Flowers radius={topInradius} shape={design.shape} />}
              {design.topper === 'Fresh berries' && <Berries radius={topInradius} shape={design.shape} />}
              {design.topper === 'Macarons' && <Macarons radius={topInradius} shape={design.shape} />}
              {design.topper === 'Chocolate sails' && <ChocolateSails radius={topInradius} shape={design.shape} />}
              {design.topper === 'Hand-piped message' && <PipedMessage radius={topInradius} shape={design.shape} text={design.message} ink={messageInk} />}
            </group>
          )}
        </Tier>
      ))}
      <group position={[0, topY, 0]} />
      </group>
    </group>
  );
}

export const cakeHeight = (design: CakeDesign) => design.tiers * design.layers * LAYER_HEIGHT;
export const cakeBaseRadius = (design: CakeDesign) => (sizeInches[design.size] ?? 8) / 8;
