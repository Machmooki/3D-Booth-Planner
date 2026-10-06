import { openDB } from 'idb';
import { migrateProject } from '../domain/model';
import type { Project } from '../domain/model';
const db = () =>
  openDB('booth-studio', 1, {
    upgrade(database) {
      database.createObjectStore('projects', { keyPath: 'id' });
      database.createObjectStore('settings');
    },
  });
let writeQueue: Promise<void> = Promise.resolve();
async function writeProject(project: Project, activate: boolean) {
  const database = await db();
  const tx = database.transaction(['projects', 'settings'], 'readwrite');
  await tx.objectStore('projects').put(project);
  if (activate) await tx.objectStore('settings').put(project.id, 'active');
  await tx.done;
}
export function saveProject(project: Project, activate = true): Promise<void> {
  const write = writeQueue.catch(() => {}).then(() => writeProject(project, activate));
  writeQueue = write;
  return write;
}
export async function listProjects(): Promise<Project[]> {
  const database = await db();
  const values: unknown[] = await database.getAll('projects');
  return values
    .flatMap((value) => {
      try {
        return [migrateProject(value)];
      } catch {
        return [];
      }
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export async function loadActive(): Promise<Project | null> {
  const database = await db();
  const id = await database.get('settings', 'active');
  if (!id) return null;
  const value = await database.get('projects', id);
  return value ? migrateProject(value) : null;
}
export async function deleteProject(id: string) {
  const database = await db();
  await database.delete('projects', id);
}
export function downloadFile(content: Blob | string, name: string) {
  const url = typeof content === 'string' ? content : URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  if (typeof content !== 'string') setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function readArtwork(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type))
    throw new Error('Choose a PNG, JPG, or WebP image.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Choose an image smaller than 10 MB.');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('This image could not be opened. Try another PNG, JPG, or WebP file.');
  });
  try {
    const factor = Math.min(1, 2048 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * factor));
    canvas.height = Math.max(1, Math.round(bitmap.height * factor));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Your browser could not process this image.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', 0.88);
  } finally {
    bitmap.close();
  }
}
