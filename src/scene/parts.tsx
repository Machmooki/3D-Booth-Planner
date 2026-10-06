import { createContext, useContext, useEffect, useMemo } from 'react';
import { BoxGeometry, BufferGeometry, CylinderGeometry, LatheGeometry, Vector2 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Dimensions } from '../domain/model';
import type { Material } from '../domain/appearance';
import { resourcePool, useSurface } from './materials';
export type V3 = [number, number, number];
export const ModelDimensions = createContext<Dimensions>({ width: 1, height: 1, depth: 1 });
const geometries = resourcePool<BufferGeometry>();
export function boxUVs(geometry: BufferGeometry) {
  const p = geometry.attributes.position,
    n = geometry.attributes.normal,
    uv = geometry.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = Math.abs(n.getX(i)),
      y = Math.abs(n.getY(i)),
      z = Math.abs(n.getZ(i));
    if (y >= x && y >= z) uv.setXY(i, p.getX(i), p.getZ(i));
    else if (x >= z) uv.setXY(i, p.getZ(i), p.getY(i));
    else uv.setXY(i, p.getX(i), p.getY(i));
  }
  uv.needsUpdate = true;
  return geometry;
}
interface PartProps {
  position?: V3;
  size: V3;
  color: string;
  material?: Material;
  radius?: number;
  rotation?: V3;
}
export function Part({
  position = [0, 0.5, 0],
  size,
  color,
  material = 'matte',
  radius = 0.008,
  rotation,
}: PartProps) {
  const dim = useContext(ModelDimensions);
  const [w, h, d] = [size[0] * dim.width, size[1] * dim.height, size[2] * dim.depth];
  const r = Math.min(radius, w * 0.24, h * 0.24, d * 0.24);
  const key = `box:${w}:${h}:${d}:${r}`;
  const entry = useMemo(
    () =>
      geometries.get(key, () =>
        boxUVs(r > 0 ? new RoundedBoxGeometry(w, h, d, 2, r) : new BoxGeometry(w, h, d)),
      ),
    [key, w, h, d, r],
  );
  useEffect(() => geometries.retain(key, entry), [key, entry]);
  const surface = useSurface(material, color);
  return (
    <mesh
      geometry={entry.value}
      material={surface}
      dispose={null}
      position={[position[0] * dim.width, position[1] * dim.height, position[2] * dim.depth]}
      rotation={rotation}
      castShadow={material !== 'glass'}
      receiveShadow
    />
  );
}
export function Cylinder({
  position,
  size,
  color,
  material = 'metal',
  rounded = false,
  open = false,
}: {
  position: V3;
  size: V3;
  color: string;
  material?: Material;
  rounded?: boolean;
  open?: boolean;
}) {
  const dim = useContext(ModelDimensions);
  const top = size[0] * dim.width,
    bottom = size[1] * dim.width,
    h = size[2] * dim.height;
  const ratio = dim.depth / dim.width;
  const key = `cyl:${top}:${bottom}:${h}:${ratio}:${rounded}:${open}`;
  const entry = useMemo(
    () =>
      geometries.get(key, () => {
        let g: BufferGeometry;
        if (rounded && top === bottom) {
          const r = Math.min(0.008, h * 0.23, top * 0.12);
          g = new LatheGeometry(
            [
              new Vector2(0, -h / 2),
              new Vector2(bottom - r, -h / 2),
              new Vector2(bottom - r * 0.3, -h / 2 + r * 0.3),
              new Vector2(bottom, -h / 2 + r),
              new Vector2(top, h / 2 - r),
              new Vector2(top - r * 0.3, h / 2 - r * 0.3),
              new Vector2(top - r, h / 2),
              new Vector2(0, h / 2),
            ],
            40,
          );
        } else g = new CylinderGeometry(top, bottom, h, 32, 1, open);
        g.scale(1, 1, ratio);
        const p = g.attributes.position,
          n = g.attributes.normal,
          uv = g.attributes.uv;
        for (let i = 0; i < p.count; i++) {
          if (Math.abs(n.getY(i)) > 0.7) uv.setXY(i, p.getX(i), p.getZ(i));
          else
            uv.setXY(
              i,
              Math.atan2(p.getX(i), p.getZ(i) / ratio) * Math.max(top, bottom),
              p.getY(i),
            );
        }
        return g;
      }),
    [key, top, bottom, h, ratio, rounded, open],
  );
  useEffect(() => geometries.retain(key, entry), [key, entry]);
  const surface = useSurface(material, color);
  return (
    <mesh
      geometry={entry.value}
      material={surface}
      dispose={null}
      position={[position[0] * dim.width, position[1] * dim.height, position[2] * dim.depth]}
      castShadow
      receiveShadow
    />
  );
}
