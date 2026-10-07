import { ExtrudeGeometry, Shape, Vector2 } from 'three';
import { boxUVs } from './parts';

/** Rounded footprint, independent of height: even a thin plinth keeps curved ends. */
export function podiumGeometry(width: number, height: number, depth: number) {
  const r = Math.min(depth * 0.46, width * 0.15);
  const x = -width / 2,
    y = -depth / 2;
  const s = new Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + width - r, y);
  s.quadraticCurveTo(x + width, y, x + width, y + r);
  s.lineTo(x + width, y + depth - r);
  s.quadraticCurveTo(x + width, y + depth, x + width - r, y + depth);
  s.lineTo(x + r, y + depth);
  s.quadraticCurveTo(x, y + depth, x, y + depth - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  const g = new ExtrudeGeometry(s, { depth: height, bevelEnabled: false, curveSegments: 10 });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -height / 2, 0);
  return boxUVs(g);
}

/** Raised leaf shoulder and lower wordmark shoulder, like the reference monument. */
export function signGeometry(width: number, height: number, depth: number) {
  const s = new Shape();
  s.moveTo(-0.5, 0);
  s.lineTo(0.5, 0);
  s.lineTo(0.5, 0.74);
  s.quadraticCurveTo(0.5, 0.82, 0.46, 0.82);
  s.lineTo(-0.14, 0.82);
  s.quadraticCurveTo(-0.16, 0.82, -0.16, 0.85);
  s.lineTo(-0.16, 0.99);
  s.quadraticCurveTo(-0.16, 1, -0.17, 1);
  s.bezierCurveTo(-0.34, 1, -0.5, 0.9, -0.5, 0.63);
  s.closePath();
  // Inset before beveling so the softened edges stay inside the declared envelope.
  const r = Math.min(0.012, width * 0.008, height * 0.008, depth * 0.04);
  const inset = new Shape(
    s.getPoints(10).map((p) => new Vector2(p.x * (width - 2 * r), p.y * (height - 2 * r))),
  );
  const g = new ExtrudeGeometry(inset, {
    depth: depth - 2 * r,
    bevelEnabled: true,
    bevelSize: r,
    bevelThickness: r,
    bevelSegments: 3,
    steps: 1,
  });
  g.translate(0, -(height - 2 * r) / 2, -(depth - 2 * r) / 2);
  return boxUVs(g);
}
