import { useEffect, useMemo } from 'react';
import { BoxGeometry, BufferGeometry, Float32BufferAttribute } from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { Project } from '../domain/model';
import { gridColor } from '../domain/appearance';
import { boxUVs } from './parts';
import { useSurface } from './materials';
export function Floor({
  booth,
  onClick,
}: {
  booth: Project['booth'];
  onClick: (event: ThreeEvent<MouseEvent>) => void;
}) {
  const { width, depth, floor } = booth;
  const surface = useSurface(floor.material, floor.color);
  const geometry = useMemo(() => boxUVs(new BoxGeometry(width, 0.06, depth)), [width, depth]);
  const grid = useMemo(() => {
    const points: number[] = [];
    for (let x = 0; x <= width + 0.0001; x += 0.25)
      points.push(-width / 2 + x, 0.003, -depth / 2, -width / 2 + x, 0.003, depth / 2);
    for (let z = 0; z <= depth + 0.0001; z += 0.25)
      points.push(-width / 2, 0.003, -depth / 2 + z, width / 2, 0.003, -depth / 2 + z);
    const g = new BufferGeometry();
    g.setAttribute('position', new Float32BufferAttribute(points, 3));
    return g;
  }, [width, depth]);
  useEffect(
    () => () => {
      geometry.dispose();
      grid.dispose();
    },
    [geometry, grid],
  );
  return (
    <>
      <mesh
        name="booth-floor"
        geometry={geometry}
        material={surface}
        position={[0, -0.03, 0]}
        receiveShadow
        onClick={onClick}
      />
      {floor.gridEnabled && (
        <lineSegments name="booth-grid" geometry={grid} renderOrder={1}>
          <lineBasicMaterial
            color={gridColor(floor.color)}
            transparent
            opacity={0.42}
            depthWrite={false}
          />
        </lineSegments>
      )}
    </>
  );
}
