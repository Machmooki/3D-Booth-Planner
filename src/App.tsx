import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownToLine,
  Box,
  Check,
  ChevronDown,
  CircleHelp,
  CloudOff,
  Grid2X2,
  Magnet,
  Maximize2,
  MousePointer2,
  Redo2,
  Ruler,
  Undo2,
  UserRound,
  X,
} from 'lucide-react';
import { Library } from './components/Library';
import { Properties } from './components/Properties';
import { Viewport } from './scene/Viewport';
import { ExportDialog, HelpDialog, ProjectDialog } from './components/Dialogs';
import { useEditor } from './store/editor';
import { cm, overflow } from './domain/model';
import { loadActive, saveProject } from './persistence/projects';
import type { Project } from './domain/model';
let saveQueue: Promise<void> = Promise.resolve();
function queueSave(project: Project) {
  const next = saveQueue.catch(() => {}).then(() => saveProject(project));
  saveQueue = next;
  return next;
}
export default function App() {
  const project = useEditor((s) => s.project);
  const ready = useEditor((s) => s.ready);
  const status = useEditor((s) => s.saveStatus);
  const grid = useEditor((s) => s.project.booth.floor.gridEnabled);
  const dimensions = useEditor((s) => s.dimensions);
  const human = useEditor((s) => s.human);
  const snap = useEditor((s) => s.snap);
  const step = useEditor((s) => s.step);
  const tool = useEditor((s) => s.tool);
  const past = useEditor((s) => s.past.length);
  const future = useEditor((s) => s.future.length);
  const notice = useEditor((s) => s.notice);
  const [modal, setModal] = useState<'projects' | 'export' | 'help' | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [projectMenu, setProjectMenu] = useState(false);
  const latest = useRef(project);
  latest.current = project;
  useEffect(() => {
    let active = true;
    void loadActive()
      .then((saved) => {
        if (active) useEditor.getState().load(saved ?? useEditor.getState().project);
      })
      .catch(() => {
        if (active) {
          useEditor.setState({ ready: true, saveStatus: 'error' });
          useEditor
            .getState()
            .notify('Local storage is unavailable. Export your project to keep a backup.');
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    useEditor.setState({ saveStatus: 'saving' });
    const timer = setTimeout(() => {
      void queueSave(project)
        .then(() => {
          if (useEditor.getState().project === project) useEditor.setState({ saveStatus: 'saved' });
        })
        .catch(() => {
          useEditor.setState({ saveStatus: 'error' });
          useEditor
            .getState()
            .notify('Could not save on this device. Export your project as a backup.');
        });
    }, 600);
    return () => clearTimeout(timer);
  }, [project, ready]);
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden' && useEditor.getState().ready)
        void queueSave(latest.current).catch(() => {});
    };
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (useEditor.getState().saveStatus !== 'saved') {
        e.preventDefault();
      }
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => useEditor.setState({ notice: '' }), 5000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const keydown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('input,textarea,select,[contenteditable="true"],dialog') || modal) return;
      const state = useEditor.getState();
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) state.redo();
        else state.undo();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (state.selected) state.duplicate(state.selected);
      } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void queueSave(state.project)
          .then(() => useEditor.getState().notify('Project saved on this device.'))
          .catch(() => state.notify('Could not save. Export a JSON backup.'));
      } else if (['Delete', 'Backspace'].includes(e.key) && state.selected) {
        e.preventDefault();
        state.remove(state.selected);
      } else if (e.key === 'Escape') {
        state.select(null);
        useEditor.setState({ tool: 'select' });
      } else if (e.key.toLowerCase() === 'v') useEditor.setState({ tool: 'select' });
      else if (e.key.toLowerCase() === 'm') useEditor.setState({ tool: 'measure' });
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [modal]);
  const outside = project.objects.filter((o) => overflow(o, project.booth) > 0.001).length;
  return (
    <div className="app">
      <header className="app-header">
        <a
          href="#"
          className="brand"
          aria-label="Booth Studio home"
          onClick={(e) => {
            e.preventDefault();
            setModal('projects');
          }}
        >
          <span className="brand-mark">
            <Box size={23} strokeWidth={1.6} />
          </span>
          <span>
            booth<span className="brand-light">studio</span>
            <span className="brand-period">.</span>
          </span>
        </a>
        <div className="project-heading">
          <span className="header-divider" />
          {renaming ? (
            <input
              autoFocus
              aria-label="Project name"
              className="project-rename"
              defaultValue={project.name}
              maxLength={100}
              onBlur={(e) => {
                const name = e.target.value.trim();
                if (name && name !== project.name)
                  useEditor.getState().commit({ ...project, name }, 'Rename project');
                setRenaming(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') setRenaming(false);
              }}
            />
          ) : (
            <div className="project-dropdown">
              <button onClick={() => setProjectMenu(!projectMenu)}>
                {project.name}
                <ChevronDown size={14} />
              </button>
              {projectMenu && (
                <>
                  <button
                    className="menu-scrim"
                    aria-label="Close project menu"
                    onClick={() => setProjectMenu(false)}
                  />
                  <div className="menu">
                    <button
                      onClick={() => {
                        setProjectMenu(false);
                        setModal('projects');
                      }}
                    >
                      All projects <span>↗</span>
                    </button>
                    <button
                      onClick={() => {
                        setProjectMenu(false);
                        setRenaming(true);
                      }}
                    >
                      Rename project
                    </button>
                    <button
                      onClick={() => {
                        setProjectMenu(false);
                        setModal('projects');
                      }}
                    >
                      New / import project
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <span className={`save-status ${status === 'error' ? 'error' : ''}`}>
            {status === 'saved' ? (
              <Check size={12} />
            ) : status === 'error' ? (
              <CloudOff size={13} />
            ) : (
              <span className="saving-dot" />
            )}
            {status === 'saved'
              ? 'All changes saved'
              : status === 'saving'
                ? 'Saving…'
                : 'Not saved'}
          </span>
        </div>
        <div className="header-actions">
          <button
            className="icon-button help-button"
            title="Help and keyboard shortcuts"
            aria-label="Help and keyboard shortcuts"
            onClick={() => setModal('help')}
          >
            <CircleHelp size={18} />
          </button>
          <span className="local-badge">LOCAL PROJECT</span>
          <button className="primary export-button" onClick={() => setModal('export')}>
            <ArrowDownToLine size={15} />
            Export <ChevronDown size={12} />
          </button>
        </div>
      </header>
      <div className="workspace-toolbar">
        <div className="toolbar-left">
          <span className="workspace-label">DESIGN WORKSPACE</span>
        </div>
        <div className="toolbar-main">
          <div className="toolbar-group">
            <button
              className={tool === 'select' ? 'tool active' : 'tool'}
              title="Select and move (V)"
              aria-label="Select and move"
              onClick={() => useEditor.setState({ tool: 'select' })}
            >
              <MousePointer2 size={16} />
            </button>
            <button
              className={tool === 'measure' ? 'tool active' : 'tool'}
              title="Measure distance (M)"
              aria-label="Measure distance"
              onClick={() =>
                useEditor.setState({ tool: tool === 'measure' ? 'select' : 'measure' })
              }
            >
              <Ruler size={17} />
            </button>
          </div>
          <span className="toolbar-divider" />
          <div className="toolbar-group history-controls">
            <button
              className="tool"
              disabled={!past}
              title="Undo (⌘Z)"
              aria-label="Undo"
              onClick={() => useEditor.getState().undo()}
            >
              <Undo2 size={16} />
            </button>
            <button
              className="tool"
              disabled={!future}
              title="Redo (⌘⇧Z)"
              aria-label="Redo"
              onClick={() => useEditor.getState().redo()}
            >
              <Redo2 size={16} />
            </button>
          </div>
          <span className="toolbar-divider" />
          <button
            className={`toolbar-toggle ${snap ? 'enabled' : ''}`}
            aria-pressed={snap}
            onClick={() => useEditor.setState({ snap: !snap })}
          >
            <Magnet size={14} />
            Snap
          </button>
          <select
            className="snap-select"
            aria-label="Snap increment"
            value={step}
            onChange={(e) => useEditor.setState({ step: Number(e.target.value) })}
          >
            {[0.01, 0.05, 0.1, 0.25, 0.5].map((v) => (
              <option key={v} value={v}>
                {cm(v)} cm
              </option>
            ))}
          </select>
          <div className="toolbar-spacer" />
          <button
            className={`toolbar-toggle ${grid ? 'enabled' : ''}`}
            aria-pressed={grid}
            onClick={() => useEditor.getState().setFloor({ gridEnabled: !grid })}
          >
            <Grid2X2 size={14} />
            <span>Grid</span>
          </button>
          <button
            className={`toolbar-toggle ${dimensions ? 'enabled' : ''}`}
            aria-pressed={dimensions}
            onClick={() => useEditor.setState({ dimensions: !dimensions })}
          >
            <Maximize2 size={14} />
            <span>Dimensions</span>
          </button>
          <button
            className={`toolbar-toggle ${human ? 'enabled' : ''}`}
            aria-pressed={human}
            onClick={() => useEditor.setState({ human: !human })}
          >
            <UserRound size={14} />
            <span>Human scale</span>
          </button>
        </div>
        <div className="toolbar-right">
          <span className="scale-dot" />
          1:1 real-world scale
        </div>
      </div>
      <div className="editor-layout">
        <Library />
        <Viewport />
        <Properties />
      </div>
      <footer className="status-bar">
        <div>
          <span className="green-dot" />
          All good things start with a plan.
        </div>
        <div>
          <button onClick={() => useEditor.getState().select(null)}>
            {cm(project.booth.width)} × {cm(project.booth.depth)} cm booth
          </button>
          <span>·</span>
          <span>{project.objects.length} objects</span>
          {outside > 0 && (
            <>
              <span>·</span>
              <span className="outside-status">{outside} outside limits</span>
            </>
          )}
          <span className="footer-divider" />
          <span>Units: centimeters</span>
        </div>
        <span className="version">BOOTH STUDIO / 01</span>
      </footer>
      <div className="mobile-message">
        <Box size={20} />
        <span>Room to create. Open on a tablet or desktop for the full editor.</span>
      </div>
      {notice && (
        <div className="toast" role="status">
          <InfoIcon />
          <span>{notice}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => useEditor.setState({ notice: '' })}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {modal === 'projects' && <ProjectDialog onClose={() => setModal(null)} />}{' '}
      {modal === 'export' && <ExportDialog onClose={() => setModal(null)} />}{' '}
      {modal === 'help' && <HelpDialog onClose={() => setModal(null)} />}
    </div>
  );
}
function InfoIcon() {
  return <Check size={16} />;
}
