import { useEffect, useMemo } from 'react';
import { CanvasTexture, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace } from 'three';
import { materialPresets, textureRegistry } from '../domain/appearance';
import type { Material, FloorMaterial, TextureId } from '../domain/appearance';

// A small reference-counted pool shares GPU resources, including repeated furniture parts.
// Deferred disposal also allows React StrictMode's effect replay without destroying live assets.
interface Disposable {
  dispose(): void;
}
interface Entry<T> {
  value: T;
  users: number;
  timer: ReturnType<typeof setTimeout> | null;
}
export function resourcePool<T extends Disposable>() {
  const entries = new Map<string, Entry<T>>();
  const retire = (key: string, entry: Entry<T>) => {
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = setTimeout(() => {
      if (entry.users === 0 && entries.get(key) === entry) {
        entry.value.dispose();
        entries.delete(key);
      }
    }, 1000);
  };
  return {
    get(key: string, create: () => T) {
      let entry = entries.get(key);
      if (!entry) {
        entry = { value: create(), users: 0, timer: null };
        entries.set(key, entry);
        retire(key, entry);
      }
      return entry;
    },
    retain(key: string, entry: Entry<T>) {
      entry.users++;
      if (entry.timer) clearTimeout(entry.timer);
      return () => {
        entry.users--;
        retire(key, entry);
      };
    },
  };
}
const textures = resourcePool<CanvasTexture>();
const materials = resourcePool<MeshStandardMaterial>();
function createTexture(id: TextureId) {
  const { size, metersPerTile } = textureRegistry[id];
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const data = ctx.createImageData(size, size);
  // Deterministic periodic grain, never a network download. Low contrast keeps artwork dominant.
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2,
        v = (y / size) * Math.PI * 2;
      const hash = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      const noise = hash - Math.floor(hash) - 0.5;
      let value = 248;
      if (id === 'oak')
        value =
          241 +
          2.5 * Math.sin(u * 17 + 1.6 * Math.sin(v) + 0.4 * Math.sin(v * 3)) +
          1.5 * Math.sin(u * 49 + 0.8 * Math.sin(v * 2)) +
          noise * 3;
      if (id === 'concrete')
        value =
          245 + 2 * Math.sin(u * 3 + Math.sin(v * 2)) + 2 * Math.sin(v * 7 + u * 2) + noise * 5;
      if (id === 'weave') value = 243 + 3 * Math.cos(u * 128) * Math.cos(v * 128) + noise * 5;
      if (id === 'carpet') value = 241 + noise * 13 + 2 * Math.sin(u * 42) * Math.cos(v * 42);
      const i = (y * size + x) * 4;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = Math.round(value);
      data.data[i + 3] = 255;
    }
  ctx.putImageData(data, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.name = `Booth ${id}`;
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(1 / metersPerTile, 1 / metersPerTile);
  texture.anisotropy = 4;
  return texture;
}
export function useSurface(type: Material | FloorMaterial = 'matte', color = '#e6dfd2') {
  const key = `${type}:${color}`;
  const entry = useMemo(
    () =>
      materials.get(key, () => {
        const preset = materialPresets[type];
        const material = new MeshStandardMaterial({
          color,
          roughness: preset.roughness,
          metalness: preset.metalness,
          transparent: !!preset.opacity,
          opacity: preset.opacity ?? 1,
          depthWrite: !preset.opacity,
        });
        material.name = `${type} ${color}`;
        if (preset.texture) {
          const texture = textures.get(preset.texture, () => createTexture(preset.texture!));
          const release = textures.retain(preset.texture, texture);
          material.map = texture.value;
          material.addEventListener('dispose', release);
        }
        return material;
      }),
    [key, type, color],
  );
  useEffect(() => materials.retain(key, entry), [key, entry]);
  return entry.value;
}
