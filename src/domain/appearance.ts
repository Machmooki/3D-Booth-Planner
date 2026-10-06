export const materialTypes = [
  'matte',
  'paint',
  'wood',
  'fabric',
  'metal',
  'glass',
  'plastic',
  'screen',
] as const;
export type Material = (typeof materialTypes)[number];
export const floorMaterials = ['matte', 'wood', 'concrete', 'carpet'] as const;
export type FloorMaterial = (typeof floorMaterials)[number];
export type TextureId = 'oak' | 'weave' | 'concrete' | 'carpet';
export interface FloorAppearance {
  color: string;
  material: FloorMaterial;
  gridEnabled: boolean;
}
export const defaultFloor: FloorAppearance = {
  color: '#e9e4d9',
  material: 'matte',
  gridEnabled: true,
};
export const palette = [
  { color: '#f2eee5', label: 'Warm white' },
  { color: '#d8c9b0', label: 'Sand' },
  { color: '#c4aa8a', label: 'Natural oak' },
  { color: '#b8c2ac', label: 'Muted sage' },
  { color: '#c6c6bf', label: 'Soft gray' },
  { color: '#424741', label: 'Charcoal' },
  { color: '#bd8165', label: 'Terracotta' },
] as const;
interface Preset {
  label: string;
  roughness: number;
  metalness: number;
  texture?: TextureId;
  opacity?: number;
}
export const materialPresets: Record<Material | FloorMaterial, Preset> = {
  matte: { label: 'Matte', roughness: 0.9, metalness: 0 },
  paint: { label: 'Matte paint', roughness: 0.72, metalness: 0 },
  wood: { label: 'Natural oak', roughness: 0.76, metalness: 0, texture: 'oak' },
  fabric: { label: 'Fabric', roughness: 0.98, metalness: 0, texture: 'weave' },
  metal: { label: 'Brushed metal', roughness: 0.38, metalness: 0.5 },
  glass: { label: 'Glass', roughness: 0.12, metalness: 0.08, opacity: 0.28 },
  plastic: { label: 'Plastic', roughness: 0.48, metalness: 0 },
  screen: { label: 'Screen', roughness: 0.2, metalness: 0.12 },
  concrete: { label: 'Concrete', roughness: 0.94, metalness: 0, texture: 'concrete' },
  carpet: { label: 'Carpet', roughness: 1, metalness: 0, texture: 'carpet' },
};
export const textureRegistry: Record<TextureId, { metersPerTile: number; size: number }> = {
  oak: { metersPerTile: 0.6, size: 512 },
  weave: { metersPerTile: 0.18, size: 512 },
  concrete: { metersPerTile: 1, size: 512 },
  carpet: { metersPerTile: 0.25, size: 512 },
};
export function calculateTextureRepeat(
  width: number,
  height: number,
  metersPerTile: number,
): [number, number] {
  if (!Number.isFinite(metersPerTile) || metersPerTile <= 0)
    throw new Error('Texture scale must be positive.');
  return [width / metersPerTile, height / metersPerTile];
}
export function gridColor(color: string) {
  const linear = color
    .slice(1)
    .match(/.{2}/g)!
    .map((c) => {
      const v = parseInt(c, 16) / 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
  const luminance = linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  return luminance < 0.25 ? '#aeb6a7' : '#939487';
}
