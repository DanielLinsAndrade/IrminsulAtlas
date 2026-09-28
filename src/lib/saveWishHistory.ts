import { invoke, isTauri } from '@tauri-apps/api/core';
import { downloadJson } from './downloadJson';

interface SavePickerWindow extends Window {
  showSaveFilePicker?: (options: { suggestedName: string; types: { description: string; accept: Record<string, string[]> }[] }) => Promise<{
    createWritable(): Promise<{ write(content: string): Promise<void>; close(): Promise<void> }>;
  }>;
}

export async function saveWishHistory(content: string): Promise<void> {
  const filename = `irminsul-atlas-wishes-${new Date().toISOString().slice(0, 10)}.json`;
  if (isTauri()) {
    await invoke('save_wish_history', { content, filename });
    return;
  }
  const pickerWindow = window as SavePickerWindow;
  if (!pickerWindow.showSaveFilePicker) { downloadJson(filename, content); return; }
  try {
    const handle = await pickerWindow.showSaveFilePicker({ suggestedName: filename, types: [{ description: 'Histórico Irminsul Atlas JSON', accept: { 'application/json': ['.json'] } }] });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return;
    throw error;
  }
}
