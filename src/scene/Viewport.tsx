import { Component, Suspense, memo, useEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import {
  Edges,
  Environment,
  Lightformer,
  Html,
  Line,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from '@react-three/drei';
import { Group, Plane, Vector3, VSMShadowMap, SRGBColorSpace, ACESFilmicToneMapping } from 'three';
import { Floor } from './Floor';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Maximize, Plus, Minus, RotateCcw, Box, ChevronDown, MousePointer2 } from 'lucide-react';
import { useEditor } from '../store/editor';
import { cm, createObject, overflow, snapValue } from '../domain/model';
import type { BoothObject, View } from '../domain/model';
import { ObjectModel } from './Models';
import { downloadFile } from '../persistence/projects';
export const sceneActions: {
  exportPNG?: (scale: number) => Promise<void>;
  zoom?: (amount: number) => void;
} = {};
const floorPlane = new Plane(new Vector3(0, 1, 0), 0);
function SceneObject({
  object,
  onDragging,
  labels,
}: {
  object: BoothObject;
  onDragging: (dragging: boolean) => void;
  labels: RefObject<HTMLDivElement>;
}) {
  const selected = useEditor((s) => s.selected === object.id);
  const booth = useEditor((s) => s.project.booth);
  const exporting = useEditor((s) => s.exporting);
  const dimensions = useEditor((s) => s.dimensions);
  const tool = useEditor((s) => s.tool);
  const drag = useRef<{ offset: Vector3; pointer: number; plane: Plane } | null>(null);
  const invalid = overflow(object, booth) > 0.001;
  const finish = () => {
    if (drag.current) {
      drag.current = null;
      onDragging(false);
      useEditor.getState().end();
    }
  };
  useEffect(() => {
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('blur', finish);
    return () => {
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('blur', finish);
    };
  });
  const down = (event: ThreeEvent<PointerEvent>) => {
    if (tool === 'measure' || event.button !== 0) return;
    event.stopPropagation();
    useEditor.getState().select(object.id);
    if (object.locked) return;
    const view = useEditor.getState().view;
    const plane =
      view === 'Front'
        ? new Plane(new Vector3(0, 0, 1), -object.position.z)
        : view === 'Left' || view === 'Right'
          ? new Plane(new Vector3(1, 0, 0), -object.position.x)
          : floorPlane;
    const hit = event.ray.intersectPlane(plane, new Vector3());
    if (!hit) return;
    drag.current = {
      offset: new Vector3(object.position.x, 0, object.position.z).sub(hit),
      pointer: event.pointerId,
      plane,
    };
    useEditor.getState().begin();
    onDragging(true);
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };
  const move = (event: ThreeEvent<PointerEvent>) => {
    if (!drag.current) return;
    event.stopPropagation();
    const hit = event.ray.intersectPlane(drag.current.plane, new Vector3());
    if (!hit) return;
    hit.add(drag.current.offset);
    const state = useEditor.getState();
    const x = state.snap ? snapValue(hit.x, state.step) : hit.x;
    const z = state.snap ? snapValue(hit.z, state.step) : hit.z;
    state.update(object.id, { position: { ...object.position, x, z } }, 'Move object');
  };
  if (!object.visible) return null;
  return (
    <group
      position={[object.position.x, object.position.y, object.position.z]}
      rotation={[0, (object.rotation * Math.PI) / 180, 0]}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={(event) => {
        if (drag.current) {
          event.stopPropagation();
          (event.target as HTMLElement).releasePointerCapture(event.pointerId);
          finish();
        }
      }}
    >
      <ObjectModel object={object} />
      {!exporting && (selected || invalid) && (
        <group name="editor-helper">
          <mesh>
            <boxGeometry
              args={[
                object.dimensions.width + 0.012,
                object.dimensions.height + 0.012,
                object.dimensions.depth + 0.012,
              ]}
            />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            <Edges color={invalid ? '#cf6842' : '#e86d47'} linewidth={1.5} />
          </mesh>
          {selected && dimensions && (
            <Html
              portal={labels}
              position={[0, object.dimensions.height / 2 + 0.12, 0]}
              center
              style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
            >
              <div className="dimension-label">
                {cm(object.dimensions.width)} × {cm(object.dimensions.height)} ×{' '}
                {cm(object.dimensions.depth)} cm
              </div>
            </Html>
          )}
        </group>
      )}
    </group>
  );
}
// Keep the one-frame environment independent of object edits and pointer movement.
const StudioEnvironment = memo(function StudioEnvironment() {
  return (
    <Environment resolution={64} frames={1} environmentIntensity={0.3}>
      <Lightformer
        form="rect"
        intensity={3}
        color="#fffaf0"
        position={[0, 5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[8, 8, 1]}
      />
      <Lightformer
        form="rect"
        intensity={2}
        color="#f3f6ff"
        position={[-5, 2, 2]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[5, 4, 1]}
      />
    </Environment>
  );
});
function Stage({ labels }: { labels: RefObject<HTMLDivElement> }) {
  const project = useEditor((s) => s.project);
  const view = useEditor((s) => s.view);
  const cameraTick = useEditor((s) => s.cameraTick);
  const dims = useEditor((s) => s.dimensions);
  const human = useEditor((s) => s.human);
  const tool = useEditor((s) => s.tool);
  const exporting = useEditor((s) => s.exporting);
  const controls = useRef<OrbitControlsImpl>(null);
  const helpers = useRef<Group>(null);
  const [dragging, setDragging] = useState(false);
  const [points, setPoints] = useState<Vector3[]>([]);
  const { camera, gl, scene, size, invalidate } = useThree();
  const span = Math.max(project.booth.width, project.booth.depth, project.booth.height);
  const w = project.booth.width / 2,
    d = project.booth.depth / 2;
  const target: [number, number, number] = [0, 0.6, 0];
  const framing = Math.max(1, size.height / size.width);
  const positions: Record<View, [number, number, number]> = {
    Perspective: [span * 1.65 * framing, span * 1.35 * framing, span * 1.95 * framing],
    Top: [0, span * 2, 0.001],
    Front: [0, 0.6, span * 2],
    Left: [-span * 2, 0.6, 0],
    Right: [span * 2, 0.6, 0],
  };
  useEffect(() => {
    camera.position.set(...positions[view]);
    camera.lookAt(...target);
    if (controls.current) {
      controls.current.target.set(...target);
      controls.current.update();
    }
    invalidate(); /* Camera reset is intentionally driven only by view, booth size, or explicit reset. */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, cameraTick, span, camera, framing]);
  useEffect(() => {
    setPoints([]);
  }, [tool, project.id]);
  useEffect(() => {
    sceneActions.zoom = (amount) => {
      if ('isOrthographicCamera' in camera) {
        camera.zoom = Math.max(15, Math.min(250, camera.zoom * amount));
        camera.updateProjectionMatrix();
      } else {
        camera.position
          .sub(controls.current?.target ?? new Vector3())
          .multiplyScalar(1 / amount)
          .add(controls.current?.target ?? new Vector3());
      }
      invalidate();
    };
    sceneActions.exportPNG = async (scale) => {
      const oldRatio = gl.getPixelRatio();
      const hidden: Group[] = [];
      useEditor.setState({ exporting: true });
      try {
        scene.traverse((o) => {
          if (o.name === 'editor-helper' && o.visible) {
            o.visible = false;
            hidden.push(o as Group);
          }
        });
        gl.setPixelRatio(Math.min(scale, 4096 / Math.max(size.width, size.height)));
        gl.setSize(size.width, size.height, false);
        gl.render(scene, camera);
        const blob = await new Promise<Blob>((resolve, reject) =>
          gl.domElement.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Unable to create image.'))),
            'image/png',
          ),
        );
        downloadFile(blob, `${project.name.replace(/[^\w-]+/g, '-')}.png`);
        useEditor.getState().notify('Your booth preview has been exported.');
      } catch {
        useEditor.getState().notify('The image could not be exported. Try normal resolution.');
      } finally {
        hidden.forEach((o) => (o.visible = true));
        gl.setPixelRatio(oldRatio);
        gl.setSize(size.width, size.height, false);
        useEditor.setState({ exporting: false });
        invalidate();
      }
    };
    return () => {
      delete sceneActions.exportPNG;
      delete sceneActions.zoom;
    };
  }, [camera, gl, scene, size, project.name, invalidate]);
  const reference = {
    ...createObject('human'),
    id: 'reference',
    position: { x: w + 0.45, y: 0.85, z: 0.15 },
  };
  return (
    <>
      <color attach="background" args={['#f0f0eb']} />
      {view === 'Perspective' ? (
        <PerspectiveCamera makeDefault position={positions[view]} fov={37} near={0.05} far={200} />
      ) : (
        <OrthographicCamera
          makeDefault
          position={positions[view]}
          zoom={Math.min(size.width, size.height) / (span * 1.65)}
          near={0.01}
          far={200}
        />
      )}
      <OrbitControls
        ref={controls}
        makeDefault
        enabled={!dragging && tool !== 'measure'}
        enableRotate={view === 'Perspective'}
        minDistance={1}
        maxDistance={60}
        maxPolarAngle={Math.PI / 2 - 0.02}
        target={target}
        enableDamping
        dampingFactor={0.12}
      />
      <StudioEnvironment />
      <ambientLight intensity={0.7} />
      <hemisphereLight args={['#fffdf7', '#c5c6ba', 0.9]} />
      <directionalLight position={[-4, 3, -2]} intensity={0.45} color="#f5f7ff" />
      <directionalLight
        position={[3, 8, 4]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-span * 1.4}
        shadow-camera-right={span * 1.4}
        shadow-camera-top={span * 1.4}
        shadow-camera-bottom={-span * 1.4}
        shadow-bias={-0.00008}
        shadow-radius={3}
        shadow-blurSamples={4}
        shadow-normalBias={0.005}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.055, 0]}
        receiveShadow
        onClick={(e) => {
          if (tool !== 'measure') return;
          e.stopPropagation();
          setPoints((p) =>
            p.length === 2 ? [e.point.clone().setY(0.02)] : [...p, e.point.clone().setY(0.02)],
          );
        }}
      >
        <planeGeometry args={[150, 150]} />
        <meshStandardMaterial color="#f0f0eb" roughness={1} />
      </mesh>
      <Floor
        booth={project.booth}
        onClick={(e) => {
          if (tool !== 'measure') return;
          e.stopPropagation();
          setPoints((p) =>
            p.length === 2 ? [e.point.clone().setY(0.02)] : [...p, e.point.clone().setY(0.02)],
          );
        }}
      />
      {project.objects.map((object) => (
        <SceneObject key={object.id} object={object} onDragging={setDragging} labels={labels} />
      ))}
      {human && (
        <group position={[reference.position.x, 0.85, reference.position.z]}>
          <ObjectModel object={reference} />
        </group>
      )}
      {!exporting && (
        <group ref={helpers} name="editor-helper">
          {dims && (
            <>
              <Line
                points={[
                  [-w, 0.005, d + 0.28],
                  [w, 0.005, d + 0.28],
                ]}
                color="#8f9488"
                lineWidth={1}
              />
              <Line
                points={[
                  [w + 0.28, 0.005, -d],
                  [w + 0.28, 0.005, d],
                ]}
                color="#8f9488"
                lineWidth={1}
              />
              {[-w, w].map((x) => (
                <Line
                  key={x}
                  points={[
                    [x, 0.005, d + 0.21],
                    [x, 0.005, d + 0.35],
                  ]}
                  color="#8f9488"
                />
              ))}
              {[-d, d].map((z) => (
                <Line
                  key={z}
                  points={[
                    [w + 0.21, 0.005, z],
                    [w + 0.35, 0.005, z],
                  ]}
                  color="#8f9488"
                />
              ))}
              <Html portal={labels} position={[0, 0.01, d + 0.32]} center>
                <span className="floor-dimension">{cm(project.booth.width)} cm</span>
              </Html>
              <Html portal={labels} position={[w + 0.35, 0.01, 0]} center>
                <span className="floor-dimension">{cm(project.booth.depth)} cm</span>
              </Html>
            </>
          )}
          {points.length > 0 &&
            points.map((p, i) => (
              <mesh key={i} position={p}>
                <sphereGeometry args={[0.035, 16, 16]} />
                <meshBasicMaterial color="#e76540" />
              </mesh>
            ))}
          {points.length === 2 && (
            <>
              <Line points={points} color="#e76540" lineWidth={2} />
              <Html
                portal={labels}
                position={points[0]
                  .clone()
                  .lerp(points[1], 0.5)
                  .add(new Vector3(0, 0.12, 0))}
                center
              >
                <span className="dimension-label">{cm(points[0].distanceTo(points[1]))} cm</span>
              </Html>
            </>
          )}
        </group>
      )}
    </>
  );
}
class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="webgl-error">
        <Box size={36} />
        <h2>We couldn’t open the 3D view</h2>
        <p>
          Enable hardware acceleration or try a WebGL-compatible browser. Your project data is still
          available.
        </p>
        <button onClick={() => this.setState({ failed: false })}>Try again</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function Viewport() {
  const labels = useRef<HTMLDivElement>(null!);
  const view = useEditor((s) => s.view);
  const selected = useEditor((s) => s.project.objects.find((o) => o.id === s.selected));
  const tool = useEditor((s) => s.tool);
  const empty = useEditor((s) => s.project.objects.length === 0);
  const [viewMenu, setViewMenu] = useState(false);
  return (
    <main className="viewport" aria-label="3D booth workspace">
      <SceneBoundary>
        <Suspense fallback={<div className="scene-loading">Preparing your space…</div>}>
          <Canvas
            frameloop="demand"
            shadows={{ type: VSMShadowMap }}
            dpr={[1, 2]}
            gl={{
              antialias: true,
              preserveDrawingBuffer: true,
              outputColorSpace: SRGBColorSpace,
              toneMapping: ACESFilmicToneMapping,
              toneMappingExposure: 1,
            }}
            onPointerMissed={(e) => {
              if (e.type === 'click') useEditor.getState().select(null);
            }}
          >
            <Stage labels={labels} />
          </Canvas>
        </Suspense>
      </SceneBoundary>
      <div className="viewport-labels" ref={labels} />
      <div className="viewport-top">
        <div className="scene-tag">
          <span className="green-dot" /> LIVE WORKSPACE
        </div>
        <div className="view-picker">
          <button onClick={() => setViewMenu(!viewMenu)}>
            <Box size={15} />
            {view} <ChevronDown size={13} />
          </button>
          {viewMenu && (
            <div className="menu">
              {(['Perspective', 'Top', 'Front', 'Left', 'Right'] as View[]).map((v) => (
                <button
                  className={v === view ? 'active' : ''}
                  key={v}
                  onClick={() => {
                    useEditor.setState({ view: v });
                    setViewMenu(false);
                  }}
                >
                  {v}
                  <span>{v === view ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      {empty && (
        <div className="onboarding">
          <span className="eyebrow">A BLANK CANVAS</span>
          <h2>Make room for your idea.</h2>
          <p>Choose your booth size, then add your first object from the library.</p>
          <button onClick={() => useEditor.getState().add('backdrop')}>
            Add a backdrop <Plus size={15} />
          </button>
        </div>
      )}
      <div className="viewport-bottom">
        <div className="scene-hint">
          {tool === 'measure' ? (
            <>
              <span className="orange-dot" />
              Click two points on the floor to measure
            </>
          ) : selected ? (
            <>
              <MousePointer2 size={13} />
              {selected.name}
              <span className="hint-divider" />
              Drag to move
            </>
          ) : (
            <>
              <MousePointer2 size={13} />
              Drag to orbit <span className="hint-divider" />
              Scroll to zoom
            </>
          )}
        </div>
        <div className="zoom-controls">
          <button title="Zoom out" aria-label="Zoom out" onClick={() => sceneActions.zoom?.(0.85)}>
            <Minus size={16} />
          </button>
          <button
            title="Fit booth to view"
            aria-label="Fit booth to view"
            onClick={() => useEditor.setState((s) => ({ cameraTick: s.cameraTick + 1 }))}
          >
            <Maximize size={15} />
          </button>
          <button title="Zoom in" aria-label="Zoom in" onClick={() => sceneActions.zoom?.(1.15)}>
            <Plus size={16} />
          </button>
          <span />
          <button
            title="Reset camera"
            aria-label="Reset camera"
            onClick={() =>
              useEditor.setState((s) => ({ view: 'Perspective', cameraTick: s.cameraTick + 1 }))
            }
          >
            <RotateCcw size={15} />
          </button>
        </div>
      </div>
    </main>
  );
}
