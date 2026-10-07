import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ChevronDown,
  Copy,
  Crosshair,
  Info,
  LockKeyhole,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useEditor } from '../store/editor';
import {
  cm,
  meters,
  overflow,
  registry,
  SCALE_THRESHOLDS,
  changeVariant,
  defaultOilLabels,
} from '../domain/model';
import type { Dimensions, Material } from '../domain/model';
import { readArtwork } from '../persistence/projects';
import { ObjectThumbnail } from './ObjectThumbnail';
import { ColorControl, FloorAppearanceControls } from './Appearance';
import { materialTypes, materialPresets } from '../domain/appearance';
export function NumberField({
  label,
  value,
  onChange,
  suffix = 'cm',
  min = 0,
  max = 2000,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(Math.round(value * 10) / 10)), [value]);
  const submit = () => {
    const n = Number(draft);
    if (draft.trim() && Number.isFinite(n) && n >= min && n <= max) {
      if (n !== value) onChange(n);
    } else setDraft(String(value));
  };
  return (
    <label className="number-field">
      <span>{label}</span>
      <div>
        <input
          type="number"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
          }}
        />
        <span>{suffix}</span>
      </div>
    </label>
  );
}
export function Properties() {
  const project = useEditor((s) => s.project);
  const selected = useEditor((s) => s.selected);
  const object = project.objects.find((o) => o.id === selected);
  const [advanced, setAdvanced] = useState(false);
  const [uploading, setUploading] = useState(false);
  const artworkInput = useRef<HTMLInputElement>(null);
  const update = useEditor((s) => s.update);
  const resize = useEditor((s) => s.resize);
  const notify = useEditor((s) => s.notify);
  async function upload(file?: File) {
    if (!file || !object) return;
    const id = object.id;
    setUploading(true);
    try {
      const data = await readArtwork(file);
      if (useEditor.getState().project.objects.some((o) => o.id === id))
        update(id, { branding: { data, fit: 'fit' } }, 'Add artwork');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'This image could not be opened.');
    } finally {
      setUploading(false);
      if (artworkInput.current) artworkInput.current.value = '';
    }
  }
  const editBooth = (key: keyof Dimensions, value: number) =>
    useEditor
      .getState()
      .commit({ ...project, booth: { ...project.booth, [key]: meters(value) } }, 'Resize booth');
  return (
    <aside className="properties">
      <div className="properties-heading">
        <span>{object ? 'Object properties' : 'Booth settings'}</span>
        {object ? (
          <button
            className="icon-button"
            title="Deselect object"
            aria-label="Deselect object"
            onClick={() => useEditor.getState().select(null)}
          >
            <X size={15} />
          </button>
        ) : (
          <span className="unit-tag">cm</span>
        )}
      </div>
      <div className="properties-scroll">
        {object ? (
          <>
            <div className="selected-summary">
              <div className="selected-thumbnail">
                <ObjectThumbnail type={object.type} />
              </div>
              <div>
                <span className="eyebrow">{registry[object.type].category}</span>
                <input
                  className="object-name-input"
                  aria-label="Object name"
                  key={`${object.id}-name`}
                  defaultValue={object.name}
                  maxLength={100}
                  onBlur={(e) => {
                    const name = e.target.value.trim();
                    if (name && name !== object.name) update(object.id, { name });
                    else e.target.value = object.name;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur();
                  }}
                />
              </div>
            </div>
            {object.locked && (
              <div className="feedback">
                <LockKeyhole size={15} />
                <span>This object is locked.</span>
                <button onClick={() => update(object.id, { locked: false })}>Unlock</button>
              </div>
            )}
            <fieldset disabled={object.locked}>
              <section className="property-section">
                <div className="section-title">
                  Dimensions <span>cm</span>
                </div>
                <div className="dimensions-fields">
                  {(['width', 'height', 'depth'] as const).map((key) => (
                    <NumberField
                      key={`${object.id}${key}`}
                      label={key[0].toUpperCase() + key.slice(1)}
                      value={cm(object.dimensions[key])}
                      min={cm(registry[object.type].min[key])}
                      max={cm(registry[object.type].max[key])}
                      onChange={(v) =>
                        resize(object.id, { ...object.dimensions, [key]: meters(v) })
                      }
                    />
                  ))}
                </div>
                {registry[object.type].sizePresets && (
                  <div className="preset-row" aria-label="Banner size presets">
                    {registry[object.type].sizePresets!.map((preset) => (
                      <button
                        key={preset.label}
                        className={
                          Object.entries(preset.dimensions).every(
                            ([key, value]) => object.dimensions[key as keyof Dimensions] === value,
                          )
                            ? 'active'
                            : ''
                        }
                        onClick={() => resize(object.id, { ...preset.dimensions })}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
                {object.type === 'human' && (
                  <div className="preset-row">
                    {[160, 170, 180].map((h) => (
                      <button
                        key={h}
                        onClick={() =>
                          resize(object.id, { ...object.dimensions, height: meters(h) })
                        }
                      >
                        {h} cm
                      </button>
                    ))}
                  </div>
                )}
              </section>
              <section className="property-section">
                <div className="section-title">
                  Position <Crosshair size={14} />
                </div>
                <div className="alignment-grid">
                  {(
                    [
                      { key: 'center', name: 'Center', Icon: Crosshair },
                      { key: 'back', name: 'Back wall', Icon: ArrowDownToLine },
                      { key: 'left', name: 'Left wall', Icon: ArrowLeftToLine },
                      { key: 'right', name: 'Right wall', Icon: ArrowRightToLine },
                    ] as const
                  ).map(({ key, name, Icon }) => (
                    <button key={key} onClick={() => useEditor.getState().align(object.id, key)}>
                      <Icon size={15} />
                      {name}
                    </button>
                  ))}
                </div>
                <button className="advanced-toggle" onClick={() => setAdvanced(!advanced)}>
                  <ChevronDown size={13} className={advanced ? 'rotated' : ''} />
                  Advanced position
                </button>
                {advanced && (
                  <div className="dimensions-fields">
                    {(['x', 'y', 'z'] as const).map((axis) => (
                      <NumberField
                        key={axis}
                        label={axis.toUpperCase()}
                        value={cm(object.position[axis])}
                        min={axis === 'y' ? 0 : -10000}
                        max={10000}
                        onChange={(v) => {
                          if (axis === 'y' && !registry[object.type].mounted) {
                            notify(
                              'This object stays on the floor. Height determines its vertical position.',
                            );
                            return;
                          }
                          update(object.id, {
                            position: { ...object.position, [axis]: meters(v) },
                          });
                        }}
                      />
                    ))}
                  </div>
                )}
                <div className="rotation-row">
                  <NumberField
                    label="Rotation"
                    value={object.rotation}
                    min={-360}
                    max={360}
                    suffix="°"
                    onChange={(v) => update(object.id, { rotation: v }, 'Rotate object')}
                  />
                  <button
                    title="Rotate 90 degrees"
                    aria-label="Rotate 90 degrees"
                    onClick={() =>
                      update(object.id, { rotation: (object.rotation + 90) % 360 }, 'Rotate object')
                    }
                  >
                    <RotateCw size={15} />
                    <span>90°</span>
                  </button>
                </div>
              </section>
              <section className="property-section">
                <div className="section-title">Appearance</div>
                <ColorControl
                  key={object.id}
                  label="Object"
                  value={object.color}
                  onChange={(color) => update(object.id, { color }, 'Change color')}
                />
                <div className="select-row">
                  <span>Material</span>
                  <select
                    aria-label="Material"
                    value={object.material}
                    onChange={(e) =>
                      update(
                        object.id,
                        {
                          material: e.target.value as Material,
                        },
                        'Change material',
                      )
                    }
                  >
                    {materialTypes.map((material) => (
                      <option key={material} value={material}>
                        {materialPresets[material].label}
                      </option>
                    ))}
                  </select>
                </div>
                {registry[object.type].variants && (
                  <div className="variant-control">
                    <span>Style</span>
                    <div className="segmented" role="group" aria-label="Furniture style">
                      {registry[object.type].variants!.map((variant) => (
                        <button
                          key={variant.id}
                          className={
                            (object.variant ?? registry[object.type].variants![0].id) === variant.id
                              ? 'active'
                              : ''
                          }
                          aria-pressed={
                            (object.variant ?? registry[object.type].variants![0].id) === variant.id
                          }
                          onClick={() =>
                            update(
                              object.id,
                              changeVariant(object, variant.id),
                              'Change furniture style',
                            )
                          }
                        >
                          {variant.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </section>
              {object.type === 'oilDisplayStand' && (
                <section className="property-section">
                  <div className="section-title">Oil names</div>
                  <p className="oil-names-hint">Left to right. Leave blank to hide a label.</p>
                  {(object.oilLabels ?? defaultOilLabels).map((name, index) => (
                    <label className="oil-name-field" key={`${object.id}-${index}-${name}`}>
                      <span>{index + 1}</span>
                      <input
                        aria-label={`Oil name ${index + 1}`}
                        type="text"
                        maxLength={40}
                        defaultValue={name}
                        onBlur={(event) => {
                          const value = event.target.value.trim();
                          if (value === name) return;
                          const oilLabels = [...(object.oilLabels ?? defaultOilLabels)];
                          oilLabels[index] = value;
                          update(object.id, { oilLabels }, 'Change oil name');
                        }}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') event.currentTarget.blur();
                        }}
                      />
                    </label>
                  ))}
                </section>
              )}
              {registry[object.type].branding && (
                <section className="property-section">
                  <div className="section-title">
                    Artwork <span>Optional</span>
                  </div>
                  <input
                    ref={artworkInput}
                    hidden
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    aria-label="Upload artwork file"
                    onChange={(e) => void upload(e.target.files?.[0])}
                  />
                  {object.branding ? (
                    <>
                      <div className="artwork-preview">
                        <img src={object.branding.data} alt="Uploaded artwork" />
                        <button
                          title="Remove artwork"
                          aria-label="Remove artwork"
                          onClick={() =>
                            update(object.id, { branding: undefined }, 'Remove artwork')
                          }
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div className="segmented">
                        {(['fit', 'fill', 'stretch'] as const).map((fit) => (
                          <button
                            key={fit}
                            className={object.branding?.fit === fit ? 'active' : ''}
                            onClick={() =>
                              update(
                                object.id,
                                { branding: { data: object.branding!.data, fit } },
                                'Fit artwork',
                              )
                            }
                          >
                            {fit}
                          </button>
                        ))}
                      </div>
                      <button className="text-button" onClick={() => artworkInput.current?.click()}>
                        Replace artwork
                      </button>
                    </>
                  ) : (
                    <button
                      className="upload-area"
                      disabled={uploading}
                      onClick={() => artworkInput.current?.click()}
                    >
                      <Upload size={20} />
                      <strong>{uploading ? 'Preparing image…' : 'Upload your artwork'}</strong>
                      <span>PNG, JPG or WebP · up to 10 MB</span>
                    </button>
                  )}
                </section>
              )}
            </fieldset>
            {overflow(object, project.booth) > 0.001 && (
              <div className="feedback warning">
                <Info size={16} />
                <p>
                  Object extends <strong>{cm(overflow(object, project.booth))} cm</strong> beyond
                  the booth limits. You can keep it here or reposition it.
                </p>
              </div>
            )}
            {object.type === 'backdrop' && (
              <div className="feedback">
                <Info size={16} />
                <p>
                  Covers{' '}
                  <strong>
                    {Math.round((object.dimensions.width / project.booth.width) * 100)}%
                  </strong>{' '}
                  of the rear booth width.
                  <br />
                  <span>
                    {object.dimensions.width / project.booth.width < SCALE_THRESHOLDS.small
                      ? 'A compact backdrop'
                      : object.dimensions.width / project.booth.width < SCALE_THRESHOLDS.balanced
                        ? 'A balanced backdrop'
                        : 'A strong visual presence'}
                  </span>
                </p>
              </div>
            )}
            <div className="object-actions">
              <button onClick={() => useEditor.getState().duplicate(object.id)}>
                <Copy size={14} />
                Duplicate <kbd>⌘D</kbd>
              </button>
              <button
                disabled={object.locked}
                title="Reset object dimensions and appearance"
                onClick={() => {
                  const def = registry[object.type];
                  update(
                    object.id,
                    {
                      dimensions: { ...def.dimensions },
                      rotation: 0,
                      color: def.color,
                      material: def.material,
                      variant: def.variants?.[0].id,
                      branding: undefined,
                      oilLabels: undefined,
                      position: { x: 0, y: def.mounted ? 1.5 : def.dimensions.height / 2, z: 0 },
                    },
                    'Reset object',
                  );
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
              <button
                disabled={object.locked}
                className="danger"
                onClick={() => useEditor.getState().remove(object.id)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="booth-intro">
              <span className="eyebrow">YOUR SPACE, YOUR WAY</span>
              <h2>
                Every great idea
                <br />
                starts with a space.
              </h2>
              <p>Set the footprint. Make it yours.</p>
            </div>
            <section className="property-section">
              <div className="section-title">Booth size</div>
              <div className="booth-presets">
                {[
                  [2, 2],
                  [3, 3],
                  [3, 6],
                  [6, 6],
                ].map(([w, d]) => (
                  <button
                    key={`${w}${d}`}
                    className={
                      project.booth.width === w && project.booth.depth === d ? 'active' : ''
                    }
                    onClick={() =>
                      useEditor
                        .getState()
                        .commit(
                          { ...project, booth: { ...project.booth, width: w, depth: d } },
                          'Change booth size',
                        )
                    }
                  >
                    <span
                      className="preset-shape"
                      style={{ width: Math.min(28, w * 5), height: Math.min(28, d * 5) }}
                    />
                    {w} × {d} m
                  </button>
                ))}
              </div>
              <div className="dimensions-fields two">
                <NumberField
                  label="Width"
                  value={cm(project.booth.width)}
                  min={100}
                  onChange={(v) => editBooth('width', v)}
                />
                <NumberField
                  label="Depth"
                  value={cm(project.booth.depth)}
                  min={100}
                  onChange={(v) => editBooth('depth', v)}
                />
              </div>
              <NumberField
                label="Maximum height"
                value={cm(project.booth.height)}
                min={100}
                max={1000}
                onChange={(v) => editBooth('height', v)}
              />
              <div className="floor-area">
                <span>Total floor area</span>
                <strong>
                  {Math.round(project.booth.width * project.booth.depth * 100) / 100}{' '}
                  <span>m²</span>
                </strong>
              </div>
            </section>
            <FloorAppearanceControls />
            <section className="property-section">
              <div className="section-title">A few small pointers</div>
              <div className="pointer-item">
                <span>01</span>
                <p>
                  <strong>Build your space</strong>Add pieces from the object library.
                </p>
              </div>
              <div className="pointer-item">
                <span>02</span>
                <p>
                  <strong>Get the fit just right</strong>Select an object to set its exact size.
                </p>
              </div>
              <div className="pointer-item">
                <span>03</span>
                <p>
                  <strong>See the bigger picture</strong>Switch views. Check scale. Make it yours.
                </p>
              </div>
            </section>
            <div className="local-note">
              <span className="green-dot" />
              <div>
                <strong>Made to stay with you.</strong>
                <p>
                  Your projects save automatically
                  <br />
                  in this browser.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
      <div className="properties-footer">
        <span className="green-dot" />
        Real dimensions. Real possibilities.
      </div>
    </aside>
  );
}
