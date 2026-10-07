import { useContext, useEffect, useMemo, useState } from 'react';
import { BufferGeometry, CanvasTexture, SRGBColorSpace } from 'three';
import { defaultOilLabels } from '../domain/model';
import type { BoothObject, Material } from '../domain/model';
import { Artwork } from './Artwork';
import { ModelDimensions, Part, Cylinder, type V3 } from './parts';
import { resourcePool, useSurface } from './materials';
import { podiumGeometry, signGeometry } from './exhibitionGeometry';

const geometries = resourcePool<BufferGeometry>();
const graphics = resourcePool<CanvasTexture>();
type ModelProps = { object: BoothObject };
type GraphicKind = 'bangchak' | 'labels' | 'rollup';

function CurvedPart({
  size,
  position,
  color,
  material = 'paint',
  sign = false,
}: {
  size: V3;
  position: V3;
  color: string;
  material?: Material;
  sign?: boolean;
}) {
  const dim = useContext(ModelDimensions);
  const w = size[0] * dim.width,
    h = size[1] * dim.height,
    d = size[2] * dim.depth;
  const key = `${sign}:${w}:${h}:${d}`;
  const entry = useMemo(
    () => geometries.get(key, () => (sign ? signGeometry : podiumGeometry)(w, h, d)),
    [key, w, h, d, sign],
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

function drawGraphic(
  kind: GraphicKind,
  logo?: HTMLImageElement,
  labels: readonly string[] = defaultOilLabels,
) {
  const c = document.createElement('canvas');
  c.width = kind === 'rollup' ? 680 : 2048;
  c.height = kind === 'rollup' ? 1600 : kind === 'labels' ? 256 : 900;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#205e30';
  if (kind === 'bangchak') {
    if (logo) ctx.drawImage(logo, -65, -82, 2175, 654);
    ctx.textAlign = 'right';
    ctx.font = 'italic 180px Arial';
    ctx.fillText('group', 1970, 550);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#5c6057';
    ctx.font = '700 94px Arial';
    ctx.fillText('FROM BIO MOLECULES TO', 1050, 745);
    ctx.fillStyle = '#206129';
    ctx.font = '900 114px Arial';
    ctx.fillText('FUTURE MOBILITY', 1050, 860);
  } else if (kind === 'labels') {
    ctx.textAlign = 'center';
    labels.forEach((label, i) => {
      const x = 204.8 + i * 409.6;
      const words = label.trim().split(/\s+/);
      const last = words.pop() ?? '';
      ctx.font = 'italic 700 84px Arial';
      ctx.fillText(last, x, 180, 355);
      if (words.length) {
        ctx.font = '700 35px Arial';
        ctx.fillText(words.join(' '), x, 91, 355);
      }
    });
  } else if (kind === 'rollup') {
    ctx.fillStyle = '#efeee5';
    ctx.fillRect(0, 0, 680, 1600);
    ctx.fillStyle = '#355444';
    ctx.fillRect(0, 1100, 680, 500);
    ctx.font = '24px Arial';
    ctx.fillText('S P A C E   F O R   I D E A S', 55, 120);
    ctx.font = '72px Georgia';
    ctx.fillText('Make room', 55, 285);
    ctx.fillText('for possibility.', 55, 375);
    ctx.strokeStyle = '#a9b5a0';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(340, 810, 205, Math.PI, 0);
    ctx.lineTo(545, 1100);
    ctx.lineTo(135, 1100);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#dfe6d8';
    ctx.font = '42px Georgia';
    ctx.fillText('Your story starts here.', 55, 1260);
    ctx.font = '24px Arial';
    ctx.fillText('Thoughtfully made. Built to connect.', 55, 1330);
    ctx.fillRect(55, 1470, 72, 3);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}
function Graphic({
  kind,
  position,
  size,
  labels = defaultOilLabels,
}: {
  kind: GraphicKind;
  labels?: readonly string[];
  position: V3;
  size: [number, number];
}) {
  const [logo, setLogo] = useState<HTMLImageElement | undefined>();
  useEffect(() => {
    if (kind !== 'bangchak') return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) setLogo(image);
    };
    image.src = '/artwork/bangchak-logo.png';
    return () => {
      cancelled = true;
    };
  }, [kind]);
  const ready = kind !== 'bangchak' || !!logo;
  const labelKey = JSON.stringify(labels);
  const key = `${kind}:${ready}:${kind === 'labels' ? labelKey : ''}`;
  const entry = useMemo(
    () => graphics.get(key, () => drawGraphic(kind, logo, JSON.parse(labelKey))),
    [key, kind, logo, labelKey],
  );
  useEffect(() => graphics.retain(key, entry), [key, entry]);
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshStandardMaterial map={entry.value} transparent depthWrite={false} roughness={0.85} />
    </mesh>
  );
}
function Plinth({ object }: ModelProps) {
  return (
    <>
      <CurvedPart size={[1, 0.025, 1]} position={[0, 0.0125, 0]} color="#a9ada6" material="metal" />
      <CurvedPart
        size={[0.995, 0.038, 0.98]}
        position={[0, 0.044, 0]}
        color={object.color}
        material={object.material}
      />
      <CurvedPart
        size={[0.978, 0.025, 0.94]}
        position={[0, 0.0755, 0]}
        color={object.color}
        material={object.material}
      />
    </>
  );
}
export function BangchakSign({ object }: ModelProps) {
  const { width, height, depth } = object.dimensions;
  return (
    <>
      <Plinth object={object} />
      <CurvedPart
        sign
        size={[0.952, 0.912, 0.77]}
        position={[0, 0.544, 0]}
        color={object.color}
        material={object.material}
      />
      <group scale={[width, height, depth]}>
        {object.branding ? (
          <Artwork object={object} y={0.46} z={0.387} width={0.88} height={0.65} />
        ) : (
          <Graphic kind="bangchak" position={[0, 0.545, 0.387]} size={[0.9, 0.78]} />
        )}
      </group>
    </>
  );
}

/** A local square footprint keeps the sample vessels circular on a long podium. */
function Sample({ index, object }: { index: number; object: BoothObject }) {
  const { width, height, depth } = object.dimensions;
  const diameter = Math.min(width * 0.116, depth * 0.58);
  return (
    <group position={[(index - 2) * width * 0.175, height * 0.689, 0]}>
      <ModelDimensions.Provider
        value={{ width: diameter, depth: diameter, height: height * 0.311 }}
      >
        <Cylinder size={[0.5, 0.5, 0.065]} position={[0, 0.0325, 0]} color="#acb6b4" rounded />
        <Cylinder size={[0.46, 0.46, 0.035]} position={[0, 0.0825, 0]} color="#e0e4df" rounded />
        <Cylinder
          size={[0.31, 0.31, 0.81]}
          position={[0, 0.525, 0]}
          color="#c4e2d8"
          material="glass"
          open
        />
        <Cylinder
          size={[0.28, 0.28, [0.57, 0.6, 0.51, 0.62, 0.55][index]]}
          position={[0, 0.115 + [0.57, 0.6, 0.51, 0.62, 0.55][index] / 2, 0]}
          color={['#292d20', '#242c25', '#d4dfb6', '#202826', '#accc8c'][index]}
          material={index === 2 || index === 4 ? 'glass' : 'plastic'}
        />
        <Cylinder size={[0.39, 0.39, 0.025]} position={[0, 0.9425, 0]} color="#b2bdbb" rounded />
        <Cylinder size={[0.36, 0.36, 0.035]} position={[0, 0.9825, 0]} color="#cbd3ce" rounded />
        {[-1, 1].map((side) => (
          <Part
            key={side}
            size={[0.018, 0.83, 0.018]}
            position={[side * 0.35, 0.52, 0]}
            color="#b9c8c2"
            material="metal"
          />
        ))}
      </ModelDimensions.Provider>
    </group>
  );
}
export function OilDisplayStand({ object }: ModelProps) {
  const { width, height, depth } = object.dimensions;
  return (
    <>
      <Plinth object={object} />
      <CurvedPart
        size={[0.958, 0.58, 0.85]}
        position={[0, 0.378, 0]}
        color={object.color}
        material={object.material}
      />
      <CurvedPart
        size={[0.965, 0.021, 0.87]}
        position={[0, 0.6785, 0]}
        color={object.color}
        material={object.material}
      />
      <Graphic
        kind="labels"
        labels={object.oilLabels}
        position={[0, height * 0.46, depth * 0.426]}
        size={[width * 0.875, height * 0.23]}
      />
      {object.variant !== 'withoutProducts' &&
        [0, 1, 2, 3, 4].map((index) => <Sample key={index} object={object} index={index} />)}
    </>
  );
}
export function RollupBanner({ object }: ModelProps) {
  const { width, height, depth } = object.dimensions;
  return (
    <>
      {[-0.31, 0.31].map((x) => (
        <Part
          key={x}
          size={[0.085, 0.009, 1]}
          position={[x, 0.0045, 0]}
          color="#a2aaa8"
          material="metal"
          radius={0.008}
        />
      ))}
      <Part
        size={[1, 0.035, 0.43]}
        position={[0, 0.0265, 0]}
        color="#ced3d0"
        material="metal"
        radius={0.028}
      />
      {[-0.489, 0.489].map((x) => (
        <Part
          key={x}
          size={[0.022, 0.032, 0.44]}
          position={[x, 0.027, 0]}
          color="#535e59"
          material="plastic"
        />
      ))}
      <Part
        size={[0.016, 0.944, 0.052]}
        position={[0, 0.516, -0.17]}
        color="#b4beb8"
        material="metal"
      />
      <Part
        size={[0.955, 0.939, 0.006]}
        position={[0, 0.5195, 0.035]}
        color={object.color}
        material={object.material}
        radius={0}
      />
      <Part
        size={[0.978, 0.011, 0.068]}
        position={[0, 0.9945, 0.035]}
        color="#bec7c1"
        material="metal"
        radius={0.004}
      />
      <group scale={[width, height, depth]}>
        {object.branding ? (
          <Artwork object={object} y={0.5195} z={0.04} width={0.948} height={0.938} />
        ) : (
          <Graphic kind="rollup" position={[0, 0.5195, 0.04]} size={[0.948, 0.938]} />
        )}
      </group>
    </>
  );
}
