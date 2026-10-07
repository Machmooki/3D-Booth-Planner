import { useEffect, useState } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { BoothObject } from '../domain/model';
import { resourcePool } from './materials';
const artworkTextures = resourcePool<CanvasTexture>();
export function Artwork({
  object,
  z = 0.505,
  y = 0.5,
  width = 1,
  height = 1,
}: {
  object: BoothObject;
  z?: number;
  y?: number;
  width?: number;
  height?: number;
}) {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);
  useEffect(() => {
    let cancelled = false;
    let release: (() => void) | null = null;
    setTexture(null);
    if (!object.branding) return;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const key = `${width}:${height}:${object.dimensions.width}:${object.dimensions.height}:${object.color}:${object.branding?.fit}:${object.branding?.data}`;
      const entry = artworkTextures.get(key, () => {
        const canvas = document.createElement('canvas');
        const ratio = (object.dimensions.width * width) / (object.dimensions.height * height);
        canvas.width = ratio >= 1 ? 2048 : Math.max(1, Math.round(2048 * ratio));
        canvas.height = ratio >= 1 ? Math.max(1, Math.round(2048 / ratio)) : 2048;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Image canvas unavailable.');
        context.fillStyle = object.color;
        context.fillRect(0, 0, canvas.width, canvas.height);
        const fit = object.branding?.fit;
        const scale =
          fit === 'fill'
            ? Math.max(canvas.width / image.width, canvas.height / image.height)
            : Math.min(canvas.width / image.width, canvas.height / image.height);
        const w = fit === 'stretch' ? canvas.width : image.width * scale;
        const h = fit === 'stretch' ? canvas.height : image.height * scale;
        context.drawImage(image, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
        const created = new CanvasTexture(canvas);
        created.colorSpace = SRGBColorSpace;
        return created;
      });
      release = artworkTextures.retain(key, entry);
      setTexture(entry.value);
    };
    image.onerror = () => setTexture(null);
    image.src = object.branding.data;
    return () => {
      cancelled = true;
      release?.();
    };
  }, [
    object.branding,
    object.dimensions.width,
    object.dimensions.height,
    object.color,
    width,
    height,
  ]);
  return texture ? (
    <mesh position={[0, y, z]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  ) : null;
}
