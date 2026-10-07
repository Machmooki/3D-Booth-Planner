import { memo, useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { BoothObject, ObjectType } from '../domain/model';
import { ModelDimensions, Part as Box, Cylinder } from './parts';
import { resourcePool, useSurface } from './materials';
import { Artwork } from './Artwork';
import { BangchakSign, OilDisplayStand, RollupBanner } from './ExhibitionModels';
const brandTextures = resourcePool<CanvasTexture>();
type ModelProps = { object: BoothObject };
function Brand({
  color = '#364436',
  counter = false,
  z = 0.506,
}: {
  color?: string;
  counter?: boolean;
  z?: number;
}) {
  const key = `${color}:${counter}`;
  const entry = useMemo(
    () =>
      brandTextures.get(key, () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 700;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, 1200, 700);
        ctx.fillStyle = color;
        if (counter) {
          ctx.font = '500 94px Arial';
          ctx.fillText('form & field', 170, 365);
        } else {
          ctx.font = '500 37px Arial';
          ctx.fillText('F O R M   &   F I E L D', 100, 115);
          ctx.font = '500 113px Georgia';
          ctx.fillText('A little space.', 100, 305);
          ctx.fillText('A lot of possibility.', 100, 435);
          ctx.font = '28px Arial';
          ctx.fillText('Thoughtfully made. Naturally connected.', 105, 550);
          ctx.beginPath();
          ctx.arc(1000, 260, 135, Math.PI, Math.PI * 2);
          ctx.lineTo(1135, 580);
          ctx.lineTo(865, 580);
          ctx.closePath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(1000, 420, 100, Math.PI, 0, true);
          ctx.stroke();
        }
        const t = new CanvasTexture(canvas);
        t.colorSpace = SRGBColorSpace;
        return t;
      }),
    [key, color, counter],
  );
  useEffect(() => brandTextures.retain(key, entry), [key, entry]);
  const texture = entry.value;
  return (
    <mesh position={[0, 0.53, z]}>
      <planeGeometry args={[0.94, 0.85]} />
      <meshStandardMaterial map={texture} transparent depthWrite={false} roughness={1} />
    </mesh>
  );
}
function Branding({
  object,
  z = 0.506,
  y = 0.5,
  width = 1,
  height = 1,
  demo = false,
  counter = false,
}: ModelProps & {
  z?: number;
  y?: number;
  width?: number;
  height?: number;
  demo?: boolean;
  counter?: boolean;
}) {
  return (
    <group scale={[object.dimensions.width, object.dimensions.height, object.dimensions.depth]}>
      {object.branding ? (
        <Artwork object={object} z={z} y={y} width={width} height={height} />
      ) : demo ? (
        <Brand counter={counter} z={z} />
      ) : null}
    </group>
  );
}
function Solid({ object }: ModelProps) {
  return (
    <>
      <Box size={[1, 1, 1]} color={object.color} material={object.material} />
      <Branding object={object} />
    </>
  );
}
function Backdrop({ object }: ModelProps) {
  return (
    <>
      <Box size={[1, 1, 1]} color={object.color} material={object.material} radius={0.006} />
      <Box
        position={[0, 0.018, 0]}
        size={[0.98, 0.036, 0.96]}
        color="#73786c"
        material="metal"
        radius={0.002}
      />
      <Branding object={object} demo width={0.985} height={0.985} />
    </>
  );
}
function Counter({ object }: ModelProps) {
  const open = object.variant === 'open';
  return (
    <>
      <Box
        position={[0, 0.955, 0]}
        size={[1, 0.09, 1]}
        color="#eee8dc"
        material={object.material === 'wood' ? 'wood' : 'paint'}
        radius={0.012}
      />
      {open ? (
        <>
          <Box
            position={[-0.44, 0.495, -0.02]}
            size={[0.075, 0.86, 0.87]}
            color={object.color}
            material={object.material}
          />
          <Box
            position={[0.44, 0.495, -0.02]}
            size={[0.075, 0.86, 0.87]}
            color={object.color}
            material={object.material}
          />
          <Box
            position={[0, 0.11, 0]}
            size={[0.88, 0.045, 0.87]}
            color={object.color}
            material={object.material}
          />
          <Box
            position={[0, 0.5, 0]}
            size={[0.88, 0.035, 0.87]}
            color={object.color}
            material={object.material}
          />
        </>
      ) : (
        <Box
          position={[0, 0.485, 0]}
          size={[0.94, 0.85, 0.9]}
          color={object.color}
          material={object.material}
          radius={0.012}
        />
      )}
      <Box
        position={[0, 0.49, 0.446]}
        size={[0.84, 0.73, 0.016]}
        color={object.color}
        material={object.material}
        radius={0.004}
      />
      <Box
        position={[0, 0.035, 0]}
        size={[0.84, 0.07, 0.79]}
        color="#686a60"
        material="metal"
        radius={0.004}
      />
      <Branding object={object} z={0.457} y={0.49} width={0.82} height={0.71} demo counter />
    </>
  );
}
function Table({ object }: ModelProps) {
  const square = object.variant === 'square' || object.variant === 'rectangle';
  return (
    <>
      {square ? (
        <Box
          position={[0, 0.974, 0]}
          size={[1, 0.052, 1]}
          color={object.color}
          material={object.material}
          radius={0.016}
        />
      ) : (
        <Cylinder
          position={[0, 0.974, 0]}
          size={[0.5, 0.5, 0.052]}
          color={object.color}
          material={object.material}
          rounded
        />
      )}
      <Cylinder position={[0, 0.49, 0]} size={[0.036, 0.048, 0.918]} color="#555d51" />
      <Cylinder position={[0, 0.022, 0]} size={[0.265, 0.265, 0.044]} color="#555d51" rounded />
    </>
  );
}
function Chair({ object }: ModelProps) {
  const modern = object.variant === 'modern';
  return (
    <>
      <Box
        position={[0, 0.57, 0.015]}
        size={[1, 0.105, 0.91]}
        color={object.color}
        material={object.material}
        radius={0.026}
      />
      <Box
        position={[0, 0.825, -0.405]}
        size={[0.95, 0.35, 0.15]}
        color={object.color}
        material={object.material}
        radius={0.03}
      />
      {[-0.37, 0.37].flatMap((x) =>
        [-0.34, 0.34].map((z) => (
          <Box
            key={`${x}${z}`}
            position={[x, 0.265, z]}
            size={[0.055, 0.53, 0.055]}
            color="#535c50"
            material="metal"
            radius={0.008}
          />
        )),
      )}
      {modern &&
        [-1, 1].map((side) => (
          <group key={side}>
            <Box
              position={[side * 0.458, 0.705, 0.01]}
              size={[0.074, 0.07, 0.67]}
              color={object.color}
              material={object.material}
              radius={0.015}
            />
            <Box
              position={[side * 0.458, 0.636, 0.26]}
              size={[0.035, 0.14, 0.035]}
              color="#535c50"
              material="metal"
              radius={0.004}
            />
          </group>
        ))}
    </>
  );
}
function Stool({ object }: ModelProps) {
  return (
    <>
      <Cylinder
        position={[0, 0.96, 0]}
        size={[0.5, 0.5, 0.08]}
        color={object.color}
        material={object.material}
        rounded
      />
      <Cylinder position={[0, 0.488, 0]} size={[0.045, 0.06, 0.9]} color="#58604f" />
      <Cylinder position={[0, 0.024, 0]} size={[0.34, 0.34, 0.048]} color="#58604f" rounded />
      <FootRing object={object} />
    </>
  );
}
function FootRing({ object }: ModelProps) {
  const surface = useSurface('metal', '#626b59');
  return (
    <mesh
      material={surface}
      position={[0, object.dimensions.height * 0.31, 0]}
      rotation={[Math.PI / 2, 0, 0]}
      scale={[1, object.dimensions.depth / object.dimensions.width, 1]}
      castShadow
    >
      <torusGeometry
        args={[
          object.dimensions.width * 0.3,
          Math.min(0.009, object.dimensions.width * 0.025),
          6,
          32,
        ]}
      />
    </mesh>
  );
}
function Stand({ object }: ModelProps) {
  const shelf = object.variant === 'shelf';
  return (
    <>
      <Box
        position={[0, 0.025, 0]}
        size={[0.9, 0.05, 0.9]}
        color="#686e61"
        material="metal"
        radius={0.006}
      />
      <Box
        position={[0, 0.964, 0]}
        size={[1, 0.072, 1]}
        color={object.color}
        material={object.material}
        radius={0.011}
      />
      {shelf ? (
        <>
          <Box
            position={[0, 0.49, -0.37]}
            size={[0.8, 0.89, 0.09]}
            color={object.color}
            material={object.material}
          />
          <Branding object={object} z={-0.319} y={0.49} width={0.77} height={0.85} />
          {[0.12, 0.4, 0.67].map((y) => (
            <Box
              key={y}
              position={[0, y, 0]}
              size={[0.88, 0.045, 0.9]}
              color={object.color}
              material={object.material}
            />
          ))}
        </>
      ) : (
        <>
          <Box
            position={[0, 0.49, 0]}
            size={[0.8, 0.88, 0.8]}
            color={object.color}
            material={object.material}
            radius={0.01}
          />
          <Branding object={object} z={0.406} y={0.5} width={0.77} height={0.82} />
        </>
      )}
    </>
  );
}
function Shelf({ object }: ModelProps) {
  return (
    <>
      {[-0.46, 0.46].flatMap((x) =>
        [-0.42, 0.42].map((z) => (
          <Box
            key={`${x}${z}`}
            position={[x, 0.5, z]}
            size={[0.035, 1, 0.045]}
            color="#626b58"
            material="metal"
            radius={0.004}
          />
        )),
      )}
      {[0.045, 0.28, 0.51, 0.74, 0.975].map((y) => (
        <Box
          key={y}
          position={[0, y, 0]}
          size={[1, 0.027, 1]}
          color={object.color}
          material={object.material}
          radius={0.006}
        />
      ))}
      <Box
        position={[0, 0.52, -0.48]}
        size={[0.93, 0.9, 0.025]}
        color={object.color}
        material={object.material}
        radius={0.002}
      />
    </>
  );
}
function TV({ object }: ModelProps) {
  return (
    <>
      <Box
        position={[0, 0.5, -0.14]}
        size={[0.82, 0.8, 0.68]}
        color="#393d39"
        material="plastic"
        radius={0.008}
      />
      <Box
        position={[0, 0.5, 0.31]}
        size={[1, 1, 0.37]}
        color={object.color}
        material={object.material}
        radius={0.008}
      />
      <Box
        position={[0, 0.5, 0.498]}
        size={[0.975, 0.954, 0.005]}
        color="#1f2a28"
        material="screen"
        radius={0.002}
      />
      <Branding object={object} z={0.507} width={0.975} height={0.954} />
    </>
  );
}
function Banner({ object }: ModelProps) {
  return (
    <>
      <Box
        position={[0, 0.52, 0]}
        size={[0.96, 0.96, 0.08]}
        color={object.color}
        material={object.material}
        radius={0.003}
      />
      <Cylinder position={[0, 0.018, 0]} size={[0.02, 0.02, 0.035]} color="#757f6d" />
      <Box
        position={[0, 0.021, 0]}
        size={[1, 0.042, 1]}
        color="#858c7c"
        material="metal"
        radius={0.01}
      />
      <Branding object={object} z={0.046} y={0.52} width={0.95} height={0.95} />
    </>
  );
}
function Plant({ object }: ModelProps) {
  const leaves = useSurface(object.material, object.color);
  const stem = useSurface('matte', '#77765a');
  const w = object.dimensions.width,
    h = object.dimensions.height,
    d = object.dimensions.depth;
  return (
    <>
      <Cylinder
        position={[0, 0.145, 0]}
        size={[0.29, 0.23, 0.29]}
        color="#e0d9cb"
        material="matte"
      />
      <Cylinder
        position={[0, 0.29, 0]}
        size={[0.272, 0.272, 0.008]}
        color="#635d46"
        material="matte"
      />
      <Cylinder
        position={[0, 0.56, 0]}
        size={[0.011, 0.018, 0.54]}
        color="#77765a"
        material="wood"
      />
      {Array.from({ length: 11 }, (_, i) => {
        const a = i * 2.4,
          y = 0.42 + i * 0.046;
        const x = Math.sin(a) * 0.26,
          z = Math.cos(a) * 0.26;
        return (
          <group key={i}>
            <mesh
              material={stem}
              position={[x * w * 0.45, (y - 0.05) * h, z * d * 0.45]}
              rotation={[Math.cos(a) * 0.65, 0, -Math.sin(a) * 0.65]}
            >
              <cylinderGeometry args={[0.003, 0.004, h * 0.19, 6]} />
            </mesh>
            <mesh
              material={leaves}
              position={[x * w, y * h, z * d]}
              rotation={[Math.cos(a) * 0.55, a, Math.sin(a) * 0.6]}
              scale={[w * 0.12, h * 0.115, d * 0.027]}
              castShadow
            >
              <sphereGeometry args={[1, 10, 6]} />
            </mesh>
          </group>
        );
      })}
    </>
  );
}
function Light({ object }: ModelProps) {
  return (
    <>
      <Cylinder
        position={[0, 0.015, 0]}
        size={[0.4, 0.4, 0.03]}
        color={object.color}
        material={object.material}
        rounded
      />
      <Cylinder
        position={[0, 0.46, 0]}
        size={[0.024, 0.027, 0.88]}
        color={object.color}
        material={object.material}
      />
      <Cylinder
        position={[0, 0.91, 0]}
        size={[0.3, 0.5, 0.18]}
        color="#e8e0ce"
        material="fabric"
        open
      />
      <Cylinder
        position={[0, 0.825, 0]}
        size={[0.46, 0.46, 0.009]}
        color="#f6edda"
        material="matte"
      />
    </>
  );
}
function Human({ object }: ModelProps) {
  return (
    <group scale={[object.dimensions.width, object.dimensions.height, object.dimensions.depth]}>
      <mesh position={[0, 0.91, 0]} scale={[0.19, 0.09, 0.28]} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={object.color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.655, 0]} scale={[0.3, 0.19, 0.28]} castShadow>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color={object.color} roughness={0.9} />
      </mesh>
      {[-1, 1].map((sign) => (
        <group key={sign}>
          <mesh position={[sign * 0.18, 0.26, 0]} castShadow>
            <capsuleGeometry args={[0.1, 0.32, 4, 10]} />
            <meshStandardMaterial color={object.color} roughness={0.9} />
          </mesh>
          <mesh position={[sign * 0.38, 0.625, 0]} rotation={[0, 0, sign * 0.1]} castShadow>
            <capsuleGeometry args={[0.075, 0.27, 4, 10]} />
            <meshStandardMaterial color={object.color} roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
const renderers: Record<ObjectType, React.ComponentType<ModelProps>> = {
  bangchakSign: BangchakSign,
  oilDisplayStand: OilDisplayStand,
  rollupBanner: RollupBanner,
  backdrop: Backdrop,
  wall: Solid,
  counter: Counter,
  table: Table,
  chair: Chair,
  stool: Stool,
  tv: TV,
  banner: Banner,
  stand: Stand,
  shelf: Shelf,
  plant: Plant,
  light: Light,
  sign: Solid,
  human: Human,
  box: Solid,
};
export const ObjectModel = memo(function ObjectModel({ object }: ModelProps) {
  const Renderer = renderers[object.type];
  return (
    <ModelDimensions.Provider value={object.dimensions}>
      <group name={`booth-model:${object.id}`} position={[0, -object.dimensions.height / 2, 0]}>
        <Renderer object={object} />
      </group>
    </ModelDimensions.Provider>
  );
});
