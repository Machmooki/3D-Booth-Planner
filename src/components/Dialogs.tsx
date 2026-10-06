import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Copy, FileJson, FolderOpen, Image, Plus, Trash2, Upload, X } from 'lucide-react';
import { createProject, parseProject, serializeProject } from '../domain/model';
import type { Project } from '../domain/model';
import { deleteProject, downloadFile, listProjects, saveProject } from '../persistence/projects';
import { useEditor } from '../store/editor';
import { sceneActions } from '../scene/Viewport';
export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-header">
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function ExportDialog({ onClose }: { onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [busy, setBusy] = useState(false);
  const project = useEditor((s) => s.project);
  return (
    <Dialog title="Take your idea with you" onClose={onClose}>
      <p className="dialog-description">A preview to share. A project to keep creating.</p>
      <div className="export-option">
        <div className="export-icon">
          <Image size={23} />
        </div>
        <div>
          <h3>Booth preview</h3>
          <p>A clean PNG of your current view.</p>
        </div>
      </div>
      <div className="resolution-picker">
        <button className={scale === 1 ? 'active' : ''} onClick={() => setScale(1)}>
          Normal <span>Screen resolution</span>
        </button>
        <button className={scale === 2 ? 'active' : ''} onClick={() => setScale(2)}>
          High resolution <span>2× detail · up to 4K</span>
        </button>
      </div>
      <button
        className="primary full"
        disabled={busy}
        onClick={async () => {
          if (!sceneActions.exportPNG) {
            useEditor.getState().notify('The 3D view is still loading. Try again in a moment.');
            return;
          }
          setBusy(true);
          await sceneActions.exportPNG(scale);
          setBusy(false);
        }}
      >
        <Image size={16} />
        {busy ? 'Preparing image…' : 'Export PNG'}
      </button>
      <div className="export-option divided">
        <div className="export-icon">
          <FileJson size={23} />
        </div>
        <div>
          <h3>Editable project</h3>
          <p>All objects, dimensions, and artwork.</p>
        </div>
        <button
          className="secondary"
          onClick={() => {
            downloadFile(
              new Blob([serializeProject(project)], { type: 'application/json' }),
              `${project.name.replace(/[^\w-]+/g, '-')}.json`,
            );
            useEditor.getState().notify('Your editable project has been exported.');
          }}
        >
          <FileJson size={14} />
          Export JSON
        </button>
      </div>
      <p className="dialog-footnote">Your files are created on this device. No uploads needed.</p>
    </Dialog>
  );
}
export function ProjectDialog({ onClose }: { onClose: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('Untitled booth');
  const [size, setSize] = useState('3,3');
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const current = useEditor((s) => s.project);
  const refresh = async () => {
    const saved = await listProjects();
    const active = useEditor.getState().project;
    setProjects([active, ...saved.filter((project) => project.id !== active.id)]);
  };
  useEffect(() => {
    void refresh().catch(() =>
      setError('Saved projects are unavailable. You can still export your current project.'),
    );
  }, []);
  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'This action could not be completed. Try exporting a backup.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function open(project: Project) {
    const active = useEditor.getState().project;
    await saveProject(active);
    const target = project.id === active.id ? active : project;
    useEditor.getState().load(target);
    await saveProject(target);
    onClose();
  }
  return (
    <Dialog title="Your projects" onClose={onClose}>
      <p className="dialog-description">A home for every possibility. Saved in this browser.</p>
      <div className="new-project-form">
        <label>
          Project name
          <input
            aria-label="New project name"
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Booth size
          <select
            aria-label="New booth size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          >
            {['2,2', '3,3', '3,6', '6,6'].map((s) => (
              <option value={s} key={s}>
                {s.replace(',', ' × ')} m
              </option>
            ))}
          </select>
        </label>
        <button
          className="primary"
          disabled={busy || !name.trim()}
          onClick={() =>
            void run(async () => {
              const [w, d] = size.split(',').map(Number);
              await open(createProject(name.trim(), w, d));
            })
          }
        >
          <Plus size={16} />
          New project
        </button>
      </div>
      <div className="project-list">
        {projects.length === 0 ? (
          <div className="empty-projects">
            <FolderOpen size={24} />
            <p>Your saved projects will appear here.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div className="project-card" key={project.id}>
              <div className="project-mark">
                <Box size={22} />
              </div>
              <button
                className="project-open"
                disabled={busy}
                onClick={() => void run(() => open(project))}
              >
                <strong>
                  {project.name}{' '}
                  {project.id === current.id && <span className="current-label">Current</span>}
                </strong>
                <span>
                  {project.booth.width} × {project.booth.depth} m · {project.objects.length} objects
                </span>
              </button>
              <button
                className="icon-button"
                disabled={busy}
                title="Duplicate project"
                aria-label={`Duplicate project ${project.name}`}
                onClick={() =>
                  void run(async () => {
                    await saveProject(
                      {
                        ...project,
                        id: crypto.randomUUID(),
                        name: `${project.name.slice(0, 90)} copy`,
                        updatedAt: new Date().toISOString(),
                      },
                      false,
                    );
                    await refresh();
                  })
                }
              >
                <Copy size={15} />
              </button>
              <button
                className="icon-button"
                disabled={busy}
                title="Delete project"
                aria-label={`Delete project ${project.name}`}
                onClick={() => setConfirm(project.id)}
              >
                <Trash2 size={15} />
              </button>
              {confirm === project.id && (
                <div className="delete-confirm">
                  <span>Delete this project permanently?</span>
                  <button onClick={() => setConfirm(null)}>Cancel</button>
                  <button
                    className="danger"
                    onClick={() =>
                      void run(async () => {
                        if (project.id === useEditor.getState().project.id) {
                          const next = createProject();
                          useEditor.getState().load(next);
                          await saveProject(next);
                        }
                        await deleteProject(project.id);
                        setConfirm(null);
                        await refresh();
                      })
                    }
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog-bottom">
        <input
          ref={input}
          hidden
          type="file"
          accept=".json,application/json"
          aria-label="Import project file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            void run(async () => {
              if (file.size > 30_000_000)
                throw new Error('Project files must be smaller than 30 MB.');
              const project = parseProject(await file.text());
              await open({
                ...project,
                id: crypto.randomUUID(),
                updatedAt: new Date().toISOString(),
              });
            });
            e.target.value = '';
          }}
        />
        <button className="secondary" disabled={busy} onClick={() => input.current?.click()}>
          <Upload size={15} />
          Import project
        </button>
        <span>Booth Studio .json files</span>
      </div>
    </Dialog>
  );
}
export function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="A little help goes a long way" onClose={onClose}>
      <p className="dialog-description">Everything you need to shape your space.</p>
      <div className="help-grid">
        {[
          ['Move an object', 'Click and drag on the floor'],
          ['Orbit the camera', 'Drag an empty area'],
          ['Pan the camera', 'Right-click and drag'],
          ['Zoom', 'Scroll or use + / −'],
          ['Duplicate', '⌘ / Ctrl + D'],
          ['Undo', '⌘ / Ctrl + Z'],
          ['Redo', '⌘ / Ctrl + Shift + Z'],
          ['Delete selection', 'Delete / Backspace'],
          ['Deselect', 'Escape'],
        ].map(([label, key]) => (
          <div key={label}>
            <span>{label}</span>
            <kbd>{key}</kbd>
          </div>
        ))}
      </div>
      <p className="dialog-footnote">
        Dimensions are in centimeters. One grid square is 25 cm. Use the snap menu for precise
        positioning.
      </p>
    </Dialog>
  );
}
