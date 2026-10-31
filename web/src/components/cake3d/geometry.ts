import * as THREE from 'three';
import type { IcingStyle } from '@/lib/cake-design';
import type { Outline } from './outline';

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Cheap deterministic value noise, so the same cake always looks the same.
const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const noise2 = (x: number, y: number) => {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const BOTTOM_ROUND = 0.03;
export const TOP_ROUND = 0.06;
const ROWS_PER_LAYER = 10;

export type TierSpec = {
  outline: Outline;
  height: number;
  layers: number;
  style: IcingStyle;
  icing: THREE.Color;
  sponge: THREE.Color;
  filling: THREE.Color;
};

// How far the tier wall sits from the floor-plan outline at point `i`, height `y`.
// Negative is inwards. The rounded top and bottom edges plus all the icing texture
// live in here, so the drip and the toppers can sit exactly on the surface.
export function makeSurface(spec: TierSpec) {
  const { outline, height, layers, style } = spec;
  const layerH = height / layers;
  const total = outline.perimeter;
  const ridgeCount = Math.max(12, Math.round(total / 0.17));
  const ruffleCount = Math.max(8, Math.round(total / 0.36));

  const edgeInset = (y: number) => {
    let inset = 0;
    if (y < BOTTOM_ROUND) inset = BOTTOM_ROUND - Math.sqrt(Math.max(0, BOTTOM_ROUND ** 2 - (BOTTOM_ROUND - y) ** 2));
    const topStart = height - TOP_ROUND;
    if (y > topStart) inset = TOP_ROUND - Math.sqrt(Math.max(0, TOP_ROUND ** 2 - (y - topStart) ** 2));
    return inset;
  };

  const bandMask = (i: number, y: number, thickness: number) => {
    // Returns 1 inside a filling band between two sponge layers, with a wobbly edge.
    const k = Math.round(y / layerH);
    if (k <= 0 || k >= layers) return 0;
    const wobble = (noise2(outline.arc[i]! * 9, k * 3.7) - 0.5) * layerH * 0.1;
    const d = Math.abs(y - k * layerH + wobble);
    return 1 - smoothstep(thickness * 0.55, thickness, d);
  };

  const groove = (y: number) => {
    let g = 0;
    for (let k = 1; k < layers; k++) g += Math.exp(-(((y - k * layerH) / 0.011) ** 2));
    return g;
  };

  const displacement = (i: number, y: number) => {
    const s = outline.arc[i]!;
    const uf = s / total;
    const mid = smoothstep(0.02, 0.1, y) * (1 - smoothstep(height - 0.1, height - 0.03, y));
    switch (style) {
      case 'Ridged':
        return mid * 0.016 * Math.sin(uf * Math.PI * 2 * ridgeCount) - groove(y) * 0.006;
      case 'Ruffled': {
        const wave = Math.sin(uf * Math.PI * 2 * ruffleCount + y * 2.4);
        const fold = Math.sign(wave) * Math.abs(wave) ** 0.65;
        return mid * 0.05 * fold + mid * 0.012 * Math.sin(y * 38 + uf * 40);
      }
      case 'Rustic swirl': {
        const sweep = Math.sin((uf * 5 + y * 2.9 + noise2(s * 2.2, y * 3) * 0.7) * Math.PI * 2);
        return mid * (0.02 * sweep + 0.008 * (noise2(s * 14, y * 14) - 0.5));
      }
      case 'Semi-naked':
        return -0.01 + bandMask(i, y, layerH * 0.34) * 0.028 + 0.006 * (noise2(s * 18, y * 18) - 0.5);
      case 'Naked':
        return -0.014 + bandMask(i, y, layerH * 0.26) * 0.034 + 0.008 * (noise2(s * 20, y * 20) - 0.5);
      default:
        return mid * 0.004 * (noise2(s * 10, y * 10) - 0.5) - groove(y) * 0.011;
    }
  };

  const offset = (i: number, y: number) => -edgeInset(y) + displacement(i, y);

  const colour = (i: number, y: number, out: THREE.Color) => {
    if (style === 'Semi-naked' || style === 'Naked') {
      const s = outline.arc[i]!;
      const band = bandMask(i, y, layerH * (style === 'Naked' ? 0.26 : 0.34));
      const veil = style === 'Naked' ? 0 : 0.5 + 0.35 * (noise2(s * 7, y * 9) - 0.5) * 2;
      const crumb = 0.94 + 0.12 * noise2(s * 60, y * 60);
      out.copy(spec.sponge).multiplyScalar(crumb);
      out.lerp(spec.icing, Math.max(veil * 0.55, band));
      if (band > 0.2) out.lerp(spec.filling, band * (style === 'Naked' ? 0.85 : 0.2));
      return out;
    }
    out.copy(spec.icing);
    const g = groove(y);
    if (g > 0.02) out.lerp(spec.filling, Math.min(0.6, g * 0.6));
    return out;
  };

  return { offset, colour, edgeInset, layerH };
}

export type Surface = ReturnType<typeof makeSurface>;

export function buildTierGeometry(spec: TierSpec, surface: Surface): THREE.BufferGeometry {
  const { outline, height, layers } = spec;
  const n = outline.count;

  // Rows from the floor up: round the bottom edge, run the wall, round the top edge.
  const ys: number[] = [];
  const arcRows = 6;
  for (let r = 0; r <= arcRows; r++) ys.push(BOTTOM_ROUND * (1 - Math.cos((r / arcRows) * (Math.PI / 2))));
  const wallRows = layers * ROWS_PER_LAYER;
  for (let r = 1; r < wallRows; r++) ys.push(BOTTOM_ROUND + ((height - BOTTOM_ROUND - TOP_ROUND) * r) / wallRows);
  for (let r = 0; r <= arcRows + 2; r++) ys.push(height - TOP_ROUND + TOP_ROUND * Math.sin((r / (arcRows + 2)) * (Math.PI / 2)));
  // Snap the wall rows to the layer boundaries so the seams are crisp.
  const sorted = ys.sort((a, b) => a - b);
  const rows = sorted.length;
  const cols = n + 1;

  const positions = new Float32Array(rows * cols * 3);
  const colours = new Float32Array(rows * cols * 3);
  const uvs = new Float32Array(rows * cols * 2);
  const tmp = new THREE.Color();

  for (let r = 0; r < rows; r++) {
    const y = sorted[r]!;
    for (let c = 0; c < cols; c++) {
      const i = c % n;
      const o = surface.offset(i, y);
      const idx = r * cols + c;
      positions[idx * 3] = outline.x[i]! + outline.nx[i]! * o;
      positions[idx * 3 + 1] = y;
      positions[idx * 3 + 2] = outline.z[i]! + outline.nz[i]! * o;
      surface.colour(i, y, tmp);
      colours[idx * 3] = tmp.r; colours[idx * 3 + 1] = tmp.g; colours[idx * 3 + 2] = tmp.b;
      uvs[idx * 2] = (c === n ? outline.perimeter : outline.arc[i]!) / 0.5;
      uvs[idx * 2 + 1] = y / 0.5;
    }
  }

  const index: number[] = [];
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < n; c++) {
      const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
      index.push(a, d, b, b, d, e);
    }
  }

  // Flat top: triangulate the final ring.
  const topRow = rows - 1;
  const topBase = rows * cols;
  const contour: THREE.Vector2[] = [];
  const topPos = new Float32Array(n * 3);
  const topCol = new Float32Array(n * 3);
  const topUv = new Float32Array(n * 2);
  for (let i = 0; i < n; i++) {
    const src = (topRow * cols + i) * 3;
    topPos[i * 3] = positions[src]!; topPos[i * 3 + 1] = height; topPos[i * 3 + 2] = positions[src + 2]!;
    topCol.set([colours[src]!, colours[src + 1]!, colours[src + 2]!], i * 3);
    topUv[i * 2] = positions[src]! / 0.5; topUv[i * 2 + 1] = positions[src + 2]! / 0.5;
    contour.push(new THREE.Vector2(positions[src]!, positions[src + 2]!));
  }
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);

  const geometry = new THREE.BufferGeometry();
  const allPos = new Float32Array(positions.length + topPos.length);
  allPos.set(positions); allPos.set(topPos, positions.length);
  const allCol = new Float32Array(colours.length + topCol.length);
  allCol.set(colours); allCol.set(topCol, colours.length);
  const allUv = new Float32Array(uvs.length + topUv.length);
  allUv.set(uvs); allUv.set(topUv, uvs.length);
  geometry.setAttribute('position', new THREE.BufferAttribute(allPos, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(allCol, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(allUv, 2));

  const sideCount = index.length;
  for (const [a, b, c] of tris) index.push(topBase + a!, topBase + b!, topBase + c!);
  geometry.setIndex(index);

  // Make sure the wall faces outwards, then flip the cap to face up.
  geometry.computeVertexNormals();
  const normals = geometry.getAttribute('normal') as THREE.BufferAttribute;
  const probe = (Math.floor(rows / 2) * cols) + Math.floor(n / 7);
  const pi = probe % cols % n;
  if (normals.getX(probe) * outline.nx[pi]! + normals.getZ(probe) * outline.nz[pi]! < 0) {
    for (let k = 0; k < sideCount; k += 3) { const t = index[k + 1]!; index[k + 1] = index[k + 2]!; index[k + 2] = t; }
  }
  // Cap winding: check the first triangle's normal.
  const t0 = sideCount;
  if (tris.length) {
    const ax = allPos[index[t0]! * 3]!, az = allPos[index[t0]! * 3 + 2]!;
    const bx = allPos[index[t0 + 1]! * 3]!, bz = allPos[index[t0 + 1]! * 3 + 2]!;
    const cx = allPos[index[t0 + 2]! * 3]!, cz = allPos[index[t0 + 2]! * 3 + 2]!;
    const up = (bz - az) * (cx - ax) - (bx - ax) * (cz - az); // y component of (b-a)x(c-a)... sign convention checked below
    if (up < 0) for (let k = t0; k < index.length; k += 3) { const t = index[k + 1]!; index[k + 1] = index[k + 2]!; index[k + 2] = t; }
  }
  geometry.setIndex(index);
  geometry.computeVertexNormals();

  // Close the UV/normal seam where the ring wraps around.
  const nrm = geometry.getAttribute('normal') as THREE.BufferAttribute;
  for (let r = 0; r < rows; r++) {
    const a = r * cols, b = r * cols + n;
    const sx = nrm.getX(a) + nrm.getX(b), sy = nrm.getY(a) + nrm.getY(b), sz = nrm.getZ(a) + nrm.getZ(b);
    const l = Math.hypot(sx, sy, sz) || 1;
    nrm.setXYZ(a, sx / l, sy / l, sz / l);
    nrm.setXYZ(b, sx / l, sy / l, sz / l);
  }
  // The cap's outer ring should share the wall's last-row normals so the rounded edge reads as one surface.
  nrm.needsUpdate = true;
  return geometry;
}

export type DripSpec = { count: number; seed: number };

// A thin glossy sheet that follows the tier wall, hanging lower under each drip.
export function buildDripGeometry(spec: TierSpec, surface: Surface, seed: number): { wall: THREE.BufferGeometry; cap: THREE.BufferGeometry } {
  const { outline, height } = spec;
  const n = outline.count;
  const rand = mulberry32(seed);
  const total = outline.perimeter;
  const dripCount = Math.max(8, Math.round(total / 0.27));
  const drips = Array.from({ length: dripCount }, (_, k) => ({
    c: ((k + 0.5 + (rand() - 0.5) * 0.7) / dripCount) * total,
    w: 0.065 + rand() * 0.06,
    len: 0.07 + Math.pow(rand(), 1.6) * Math.min(0.34, height * 0.5),
  }));
  const base = 0.045;
  const lengthAt = (s: number) => {
    let best = base;
    for (const d of drips) {
      let dist = Math.abs(s - d.c);
      dist = Math.min(dist, total - dist);
      if (dist < d.w) best = Math.max(best, base + d.len * Math.sqrt(1 - (dist / d.w) ** 2));
    }
    return best;
  };

  const rowsN = 18;
  const cols = n + 1;
  const thick = 0.011;
  const pos = new Float32Array(rowsN * cols * 3);
  for (let c = 0; c < cols; c++) {
    const i = c % n;
    const L = lengthAt(outline.arc[i]!);
    for (let r = 0; r < rowsN; r++) {
      const t = r / (rowsN - 1);
      const y = height + 0.004 - t * (L + 0.004);
      const bead = 0.012 * Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.55) / 0.45))) * Math.min(1, L / 0.2);
      const o = surface.offset(i, Math.min(height, y)) + thick + bead;
      const idx = (r * cols + c) * 3;
      pos[idx] = outline.x[i]! + outline.nx[i]! * o;
      pos[idx + 1] = y;
      pos[idx + 2] = outline.z[i]! + outline.nz[i]! * o;
    }
  }
  const idx: number[] = [];
  for (let r = 0; r < rowsN - 1; r++) for (let c = 0; c < n; c++) {
    const a = r * cols + c, b = a + 1, d = a + cols, e = d + 1;
    idx.push(a, d, b, b, d, e);
  }
  const wall = new THREE.BufferGeometry();
  wall.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  wall.setIndex(idx);
  wall.computeVertexNormals();
  const wn = wall.getAttribute('normal') as THREE.BufferAttribute;
  const probe = Math.floor(rowsN / 2) * cols + Math.floor(n / 7);
  if (wn.getX(probe) * outline.nx[probe % n]! + wn.getZ(probe) * outline.nz[probe % n]! < 0) {
    for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]!; idx[k + 1] = idx[k + 2]!; idx[k + 2] = t; }
    wall.setIndex(idx);
    wall.computeVertexNormals();
  }

  // Ganache pool across the top.
  const contour: THREE.Vector2[] = [];
  const capPos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const o = surface.offset(i, height) + thick;
    const px = outline.x[i]! + outline.nx[i]! * o, pz = outline.z[i]! + outline.nz[i]! * o;
    capPos.set([px, height + 0.004, pz], i * 3);
    contour.push(new THREE.Vector2(px, pz));
  }
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  const cap = new THREE.BufferGeometry();
  cap.setAttribute('position', new THREE.BufferAttribute(capPos, 3));
  const capIdx: number[] = [];
  for (const [a, b, c] of tris) capIdx.push(a!, b!, c!);
  const ax = capPos[capIdx[0]! * 3]!, az = capPos[capIdx[0]! * 3 + 2]!;
  const bx = capPos[capIdx[1]! * 3]!, bz = capPos[capIdx[1]! * 3 + 2]!;
  const cx = capPos[capIdx[2]! * 3]!, cz = capPos[capIdx[2]! * 3 + 2]!;
  if ((bz - az) * (cx - ax) - (bx - ax) * (cz - az) < 0) for (let k = 0; k < capIdx.length; k += 3) { const t = capIdx[k + 1]!; capIdx[k + 1] = capIdx[k + 2]!; capIdx[k + 2] = t; }
  cap.setIndex(capIdx);
  cap.computeVertexNormals();
  return { wall, cap };
}
