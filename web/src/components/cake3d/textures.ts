import * as THREE from 'three';
import { mulberry32 } from './geometry';

const make = (size: number, paint: (ctx: CanvasRenderingContext2D, size: number) => void) => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  paint(canvas.getContext('2d')!, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
};

// Fine grain for buttercream and sponge crumb: used as a bump map.
export const grainTexture = (seed = 7) =>
  make(256, (ctx, size) => {
    const rand = mulberry32(seed);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 9000; i++) {
      const v = 90 + Math.floor(rand() * 90);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      const r = 0.6 + rand() * 1.6;
      ctx.beginPath();
      ctx.arc(rand() * size, rand() * size, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

// Soft blotches used as a roughness variation so ganache and icing aren't uniformly shiny.
export const mottleTexture = (seed = 3) =>
  make(256, (ctx, size) => {
    const rand = mulberry32(seed);
    ctx.fillStyle = '#c8c8c8';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 160; i++) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
      const v = 150 + Math.floor(rand() * 90);
      g.addColorStop(0, `rgba(${v},${v},${v},.45)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save();
      ctx.translate(rand() * size, rand() * size);
      ctx.fillStyle = g;
      ctx.fillRect(-30, -30, 60, 60);
      ctx.restore();
    }
  });

// The hand-piped message: returns a colour+alpha map and a matching height map.
export function messageTextures(text: string, ink: string) {
  const w = 1024, h = 512;
  const draw = (fill: string, blur: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    if (blur) ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = fill;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = text.trim().split(/\s*\n\s*/).slice(0, 2);
    let size = lines.length > 1 ? 150 : 190;
    ctx.font = `${size}px "Dancing Script", "Brush Script MT", cursive`;
    while (size > 40 && Math.max(...lines.map((l) => ctx.measureText(l).width)) > w * 0.92) {
      size -= 8;
      ctx.font = `${size}px "Dancing Script", "Brush Script MT", cursive`;
    }
    ctx.strokeStyle = fill;
    ctx.lineWidth = size * 0.045;
    ctx.lineJoin = 'round';
    lines.forEach((line, i) => {
      const y = h / 2 + (i - (lines.length - 1) / 2) * size * 1.05;
      ctx.strokeText(line, w / 2, y);
      ctx.fillText(line, w / 2, y);
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    return tex;
  };
  return { map: draw(ink, 0), bump: draw('#ffffff', 4) };
}
