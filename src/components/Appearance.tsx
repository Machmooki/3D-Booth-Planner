import { useCallback, useEffect, useRef } from 'react';
import { materialPresets, floorMaterials, palette } from '../domain/appearance';
import { useEditor } from '../store/editor';
export function ColorControl({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
}) {
  const active = useRef(false);
  const finish = useCallback(() => {
    if (active.current) {
      useEditor.getState().end();
      active.current = false;
    }
  }, []);
  // Native pickers may keep focus while dispatching many input events. Their final `change`
  // event closes one history transaction; blur/unmount cover cancellation and keyboard use.
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const element = input.current;
    const end = () => finish();
    element?.addEventListener('change', end);
    return () => {
      element?.removeEventListener('change', end);
      finish();
    };
  }, [finish]);
  return (
    <>
      <div className="color-swatches">
        {palette.map((p) => (
          <button
            type="button"
            key={p.color}
            className={value.toLowerCase() === p.color ? 'selected' : ''}
            style={{ background: p.color }}
            title={p.label}
            aria-label={`${label} ${p.label}`}
            onClick={() => onChange(p.color)}
          />
        ))}
        <label className="custom-color" title="Custom color">
          <span>+</span>
          <input
            ref={input}
            type="color"
            value={value}
            aria-label={`Custom ${label.toLowerCase()} color`}
            onInput={(e) => {
              if (!active.current) {
                useEditor.getState().begin(`Change ${label.toLowerCase()} color`);
                active.current = true;
              }
              onChange(e.currentTarget.value);
            }}
            onBlur={finish}
          />
        </label>
      </div>
      <span className="appearance-hex">{value.toUpperCase()}</span>
    </>
  );
}
export function FloorAppearanceControls() {
  const floor = useEditor((s) => s.project.booth.floor);
  return (
    <section className="property-section floor-appearance">
      <div className="section-title">
        Floor <span>Appearance</span>
      </div>
      <ColorControl
        label="Floor"
        value={floor.color}
        onChange={(color) => useEditor.getState().setFloor({ color })}
      />
      <div className="material-presets" role="group" aria-label="Floor material">
        {floorMaterials.map((material) => (
          <button
            key={material}
            aria-pressed={floor.material === material}
            className={floor.material === material ? 'active' : ''}
            onClick={() => useEditor.getState().setFloor({ material })}
          >
            <span className={`material-sample sample-${material}`} />
            {materialPresets[material].label === 'Natural oak'
              ? 'Wood'
              : materialPresets[material].label}
          </button>
        ))}
      </div>
      <div className="select-row floor-grid-row">
        <span>Measurement grid</span>
        <button
          className="floor-grid-toggle"
          role="switch"
          aria-label="Floor grid"
          aria-checked={floor.gridEnabled}
          onClick={() => useEditor.getState().setFloor({ gridEnabled: !floor.gridEnabled })}
        >
          <span />
          {floor.gridEnabled ? 'On' : 'Off'}
        </button>
      </div>
    </section>
  );
}
