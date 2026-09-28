import { appSettingsRepository } from '../db/appSettingsRepository';
export type ArtContext = 'character' | 'build' | 'goal' | 'dashboard' | 'banners' | 'builds';
export type ArtVariant = 'splash' | 'portrait' | 'card';
export interface CustomArt { id: string; name: string; characterId: string; context: ArtContext; variant: ArtVariant; dataUri: string; createdAt: string; focusX: number; focusY: number; zoom?: number }
const key = 'custom_art_library_v1';
export function validateArtLibrary(value: unknown): CustomArt[] {
  const contexts = ['character', 'build', 'goal', 'dashboard', 'banners', 'builds'];
  if (!Array.isArray(value) || value.some(item => !item || typeof item.id !== 'string' || !item.id ||
    typeof item.name !== 'string' || typeof item.characterId !== 'string' || !contexts.includes(item.context) ||
    !['splash', 'portrait', 'card'].includes(item.variant) || typeof item.dataUri !== 'string' ||
    !/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(item.dataUri) || item.dataUri.length > 6_700_000 ||
    (item.zoom !== undefined && (!Number.isFinite(item.zoom) || item.zoom < 1 || item.zoom > 4)) ||
    !Number.isFinite(item.focusX) || item.focusX < 0 || item.focusX > 100 ||
    !Number.isFinite(item.focusY) || item.focusY < 0 || item.focusY > 100 || !Number.isFinite(Date.parse(item.createdAt)))) {
    throw new Error('Biblioteca de artes inválida; os dados existentes foram preservados.');
  }
  if (new Set(value.map(item => item.id)).size !== value.length) throw new Error('IDs de artes duplicados.');
  return value as CustomArt[];
}
export async function listCustomArt(): Promise<CustomArt[]> {
  const text = await appSettingsRepository.getSetting(key);
  if (!text) return [];
  const value: unknown = JSON.parse(text);
  return validateArtLibrary(value);
}
export async function saveCustomArt(items: CustomArt[]): Promise<void> {
  const text = JSON.stringify(validateArtLibrary(items));
  if (text.length > 30_000_000) throw new Error('A biblioteca excede 30 MB. Remova artes que não utiliza antes de importar.');
  await appSettingsRepository.setSetting(key, text);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('wishlog-art-changed'));
}
export function findCustomArt(items: CustomArt[], characterId: string, context: ArtContext, variant: ArtVariant): CustomArt | undefined {
  return items.find(a => a.characterId === characterId && a.context === context && a.variant === variant)
    ?? items.find(a => a.characterId === characterId && a.context === 'character' && a.variant === variant);
}
export async function readArtFile(file: File): Promise<string> {
  if (file.size > 5_000_000) throw new Error('Use uma imagem de até 5 MB.');
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const jpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const webp = new TextDecoder().decode(bytes.slice(0,4)) === 'RIFF' && new TextDecoder().decode(bytes.slice(8,12)) === 'WEBP';
  if (!png && !jpeg && !webp) throw new Error('Formato não suportado. Use PNG, JPEG ou WebP.');
  const blob = new Blob([bytes], { type: png ? 'image/png' : jpeg ? 'image/jpeg' : 'image/webp' });
  const dataUri = await new Promise<string>((resolve,reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('Não foi possível ler a arte.')); reader.readAsDataURL(blob); });
  await new Promise<void>((resolve,reject) => { const img = new Image(); img.onload = () => img.naturalWidth && img.naturalHeight ? resolve() : reject(new Error('Imagem vazia.')); img.onerror = () => reject(new Error('Imagem corrompida.')); img.src = dataUri; });
  return dataUri;
}
