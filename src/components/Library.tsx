import { useState } from 'react';
import {
  Search,
  Plus,
  ChevronDown,
  Layers,
  Eye,
  EyeOff,
  LockKeyhole,
  UnlockKeyhole,
} from 'lucide-react';
import { cm, registry } from '../domain/model';
import type { Category, ObjectType } from '../domain/model';
import { useEditor } from '../store/editor';
import { ObjectThumbnail } from './ObjectThumbnail';
const categories: Category[] = [
  'All objects',
  'Structure',
  'Furniture',
  'Display',
  'Decoration',
  'Utility',
];
export function Library() {
  const [category, setCategory] = useState<Category>('All objects');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'library' | 'objects'>('library');
  const objects = useEditor((s) => s.project.objects);
  const selected = useEditor((s) => s.selected);
  const filtered = (Object.entries(registry) as [ObjectType, typeof registry.backdrop][]).filter(
    ([, def]) =>
      (category === 'All objects' || def.category === category) &&
      `${def.name} ${def.category}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <aside className="library">
      <div className="sidebar-tabs">
        <button className={tab === 'library' ? 'active' : ''} onClick={() => setTab('library')}>
          Object library
        </button>
        <button className={tab === 'objects' ? 'active' : ''} onClick={() => setTab('objects')}>
          In this booth <span>{objects.length}</span>
        </button>
      </div>
      {tab === 'library' ? (
        <>
          <div className="library-filters">
            <label className="search">
              <Search size={15} />
              <input
                placeholder="Find an object…"
                aria-label="Search objects"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>⌕</kbd>
            </label>
            <div className="category-select">
              <select
                aria-label="Object category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <ChevronDown size={13} />
            </div>
          </div>
          <div className="library-scroll">
            <div className="section-caption">
              {category === 'All objects' ? 'THE ESSENTIALS' : category.toUpperCase()}{' '}
              <span>{filtered.length} objects</span>
            </div>
            <div className="object-grid">
              {filtered.map(([type, def]) => (
                <button
                  className="object-card"
                  key={type}
                  title={`${def.description} · Click to add`}
                  onClick={() => useEditor.getState().add(type)}
                >
                  <div className="thumbnail">
                    <ObjectThumbnail type={type} />
                    <span className="add-object">
                      <Plus size={13} />
                    </span>
                  </div>
                  <span className="object-card-name">{def.name}</span>
                  <span className="object-card-size">
                    {cm(def.dimensions.width)} × {cm(def.dimensions.height)} cm
                  </span>
                </button>
              ))}
            </div>
            {!filtered.length && (
              <div className="empty-search">No objects found. Try a different name.</div>
            )}
          </div>
          <div className="library-tip">
            <div className="tip-icon">
              <Plus size={15} />
            </div>
            <div>
              <strong>A space, one piece at a time.</strong>
              <p>Click any object to add it to your booth.</p>
            </div>
          </div>
        </>
      ) : (
        <div className="object-list">
          {objects.length === 0 ? (
            <div className="empty-search">
              <Layers size={24} />
              <p>Your booth is a blank canvas. Add an object from the library.</p>
            </div>
          ) : (
            objects.map((o) => (
              <div className={`object-row ${selected === o.id ? 'active' : ''}`} key={o.id}>
                <button
                  className="object-row-main"
                  onClick={() => useEditor.getState().select(o.id)}
                >
                  <ObjectThumbnail type={o.type} />
                  <span>{o.name}</span>
                </button>
                <button
                  title={o.visible ? 'Hide object' : 'Show object'}
                  aria-label={`${o.visible ? 'Hide' : 'Show'} ${o.name}`}
                  onClick={() => useEditor.getState().update(o.id, { visible: !o.visible })}
                >
                  {o.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button
                  title={o.locked ? 'Unlock object' : 'Lock object'}
                  aria-label={`${o.locked ? 'Unlock' : 'Lock'} ${o.name}`}
                  onClick={() => useEditor.getState().update(o.id, { locked: !o.locked })}
                >
                  {o.locked ? <LockKeyhole size={14} /> : <UnlockKeyhole size={14} />}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </aside>
  );
}
