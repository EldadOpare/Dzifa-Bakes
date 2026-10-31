import * as THREE from 'three';
import type { CakeShape } from '@/lib/cake-design';

// A closed ring of points on the cake's floor plan (x, z), counter-clockwise,
// with an outward normal at every point and equal spacing along the edge.
export type Outline = {
  count: number;
  x: Float32Array;
  z: Float32Array;
  nx: Float32Array;
  nz: Float32Array;
  arc: Float32Array; // distance along the edge at each point
  perimeter: number;
};

type Pt = [number, number];

const polygon = (corners: Pt[], perEdge = 48): Pt[] => {
  const out: Pt[] = [];
  corners.forEach((a, i) => {
    const b = corners[(i + 1) % corners.length]!;
    for (let k = 0; k < perEdge; k++) out.push([a[0] + ((b[0] - a[0]) * k) / perEdge, a[1] + ((b[1] - a[1]) * k) / perEdge]);
  });
  return out;
};

const regularPolygon = (sides: number, circumradius: number, phase: number): Pt[] =>
  polygon(Array.from({ length: sides }, (_, i) => [Math.cos(phase + (i * 2 * Math.PI) / sides) * circumradius, Math.sin(phase + (i * 2 * Math.PI) / sides) * circumradius] as Pt));

const heart = (): Pt[] => {
  const raw: Pt[] = [];
  for (let i = 0; i < 400; i++) {
    const t = (i / 400) * Math.PI * 2;
    raw.push([16 * Math.sin(t) ** 3, 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)]);
  }
  const ys = raw.map((p) => p[1]);
  const mid = (Math.max(...ys) + Math.min(...ys)) / 2;
  // Point towards the viewer (+z), lobes at the back.
  return raw.map(([x, y]) => [(x / 16) * 1.04, -((y - mid) / 16) * 1.04]);
};

const rawShape = (shape: CakeShape): Pt[] => {
  switch (shape) {
    case 'Square': return polygon([[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]], 60);
    case 'Rectangle': return polygon([[-1.2, -0.74], [1.2, -0.74], [1.2, 0.74], [-1.2, 0.74]], 60);
    case 'Hexagon': return regularPolygon(6, 1, Math.PI / 6);
    case 'Octagon': return regularPolygon(8, 1, Math.PI / 8);
    case 'Heart': return heart();
    default: return Array.from({ length: 360 }, (_, i) => [Math.cos((i / 360) * Math.PI * 2), Math.sin((i / 360) * Math.PI * 2)] as Pt);
  }
};

const resample = (pts: Pt[], n: number): Pt[] => {
  const cum = [0];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!, b = pts[(i + 1) % pts.length]!;
    cum.push(cum[i]! + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  const total = cum[cum.length - 1]!;
  const out: Pt[] = [];
  let seg = 0;
  for (let i = 0; i < n; i++) {
    const d = (i / n) * total;
    while (cum[seg + 1]! < d) seg++;
    const a = pts[seg]!, b = pts[(seg + 1) % pts.length]!;
    const f = (d - cum[seg]!) / Math.max(1e-9, cum[seg + 1]! - cum[seg]!);
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return out;
};

// Circular box blur: this is what turns sharp polygon corners into soft, baked-looking ones.
const soften = (pts: Pt[], radius: number, passes: number): Pt[] => {
  let cur = pts;
  const n = pts.length;
  for (let p = 0; p < passes; p++) {
    cur = cur.map((_, i) => {
      let sx = 0, sz = 0;
      for (let k = -radius; k <= radius; k++) {
        const q = cur[(i + k + n * 4) % n]!;
        sx += q[0]; sz += q[1];
      }
      return [sx / (2 * radius + 1), sz / (2 * radius + 1)] as Pt;
    });
  }
  return cur;
};

const cache = new Map<string, Outline>();

export function buildOutline(shape: CakeShape, radius: number, count: number): Outline {
  const key = `${shape}|${radius.toFixed(3)}|${count}`;
  const hit = cache.get(key);
  if (hit) return hit;

  let pts = resample(rawShape(shape), count);
  if (shape !== 'Round') pts = soften(pts, Math.max(2, Math.round(count * (shape === 'Heart' ? 0.004 : 0.016))), 3);

  // Force counter-clockwise.
  let area = 0;
  pts.forEach((a, i) => { const b = pts[(i + 1) % count]!; area += a[0] * b[1] - b[0] * a[1]; });
  if (area < 0) pts.reverse();

  const x = new Float32Array(count), z = new Float32Array(count);
  const nx = new Float32Array(count), nz = new Float32Array(count);
  const arc = new Float32Array(count);
  let acc = 0;
  for (let i = 0; i < count; i++) {
    const a = pts[(i - 1 + count) % count]!, b = pts[(i + 1) % count]!;
    const tx = b[0] - a[0], tz = b[1] - a[1];
    const len = Math.hypot(tx, tz) || 1;
    x[i] = pts[i]![0] * radius;
    z[i] = pts[i]![1] * radius;
    nx[i] = tz / len; // tangent rotated -90deg: outward for a counter-clockwise ring
    nz[i] = -tx / len;
    if (i > 0) { acc += Math.hypot(x[i]! - x[i - 1]!, z[i]! - z[i - 1]!); arc[i] = acc; }
  }
  acc += Math.hypot(x[0]! - x[count - 1]!, z[0]! - z[count - 1]!);

  // Guard: if the normals point inward on average, flip them.
  let sign = 0;
  for (let i = 0; i < count; i++) sign += nx[i]! * x[i]! + nz[i]! * z[i]!;
  if (sign < 0) for (let i = 0; i < count; i++) { nx[i] = -nx[i]!; nz[i] = -nz[i]!; }

  const outline = { count, x, z, nx, nz, arc, perimeter: acc };
  cache.set(key, outline);
  return outline;
}

export function outlineCount(radius: number): number {
  return Math.min(520, Math.max(200, Math.round(radius * 2 * Math.PI * 38)));
}

// Floor-plan points pushed out (or in) by `offset`, as a THREE shape for flat extrusions.
export function offsetShape(outline: Outline, offset: number): THREE.Shape {
  const shape = new THREE.Shape();
  for (let i = 0; i < outline.count; i++) {
    const px = outline.x[i]! + outline.nx[i]! * offset;
    const pz = outline.z[i]! + outline.nz[i]! * offset;
    if (i === 0) shape.moveTo(px, -pz); else shape.lineTo(px, -pz);
  }
  shape.closePath();
  return shape;
}
