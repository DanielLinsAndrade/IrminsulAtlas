import type { Element, MaterialCategory, Rarity, WeaponType } from '../../domain/catalog';

const ELEMENT_COLORS: Record<Element, { bg: string; border: string; glow: string; label: string }> = {
  electro: { bg: '#2e1065', border: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)', label: 'Electro' },
  pyro: { bg: '#450a0a', border: '#ef4444', glow: 'rgba(239, 68, 68, 0.5)', label: 'Pyro' },
  hydro: { bg: '#082f49', border: '#0ea5e9', glow: 'rgba(14, 165, 233, 0.5)', label: 'Hydro' },
  anemo: { bg: '#042f2e', border: '#14b8a6', glow: 'rgba(20, 184, 166, 0.5)', label: 'Anemo' },
  geo: { bg: '#422006', border: '#eab308', glow: 'rgba(234, 179, 8, 0.5)', label: 'Geo' },
  dendro: { bg: '#052e16', border: '#22c55e', glow: 'rgba(34, 197, 94, 0.5)', label: 'Dendro' },
  cryo: { bg: '#083344', border: '#38bdf8', glow: 'rgba(56, 189, 248, 0.5)', label: 'Cryo' },
};

const RARITY_GRADIENTS: Record<Rarity, { bg: string; border: string }> = {
  5: { bg: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #d97706 100%)', border: '#f59e0b' },
  4: { bg: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 50%, #9333ea 100%)', border: '#c084fc' },
  3: { bg: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0284c7 100%)', border: '#38bdf8' },
  2: { bg: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)', border: '#34d399' },
  1: { bg: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #4b5563 100%)', border: '#9ca3af' },
};

function getElementSvgPath(element: Element): string {
  switch (element) {
    case 'pyro':
      return '<path d="M12 4c-1 2-3 4-3 7a3 3 0 0 0 6 0c0-2-1-4-3-7z" fill="currentColor"/>';
    case 'hydro':
      return '<path d="M12 3l4 6a5 5 0 1 1-8 0l4-6z" fill="currentColor"/>';
    case 'anemo':
      return '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v4m0 12v4m-10-10h4m12 0h4" stroke="currentColor" stroke-width="1.5"/>';
    case 'electro':
      return '<polygon points="13 2 4 13 11 13 10 22 19 11 12 11 13 2" fill="currentColor"/>';
    case 'dendro':
      return '<path d="M11 20A7 7 0 0 1 10 6C15 5 17 4 19 2c1 2 2 4 2 8 0 5.5-5 10-10 10Z" fill="currentColor"/>';
    case 'cryo':
      return '<line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>';
    case 'geo':
      return '<polygon points="12 2 22 12 12 22 2 12" fill="currentColor"/>';
  }
}

function getWeaponSvgPath(type: WeaponType): string {
  switch (type) {
    case 'sword':
      return '<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" stroke="currentColor" stroke-width="2"/><line x1="13" y1="19" x2="19" y2="13" stroke="currentColor" stroke-width="2"/>';
    case 'claymore':
      return '<path d="M14 4l6 6-12 12-4-2 2-4L14 4z" stroke="currentColor" stroke-width="2"/><line x1="4" y1="20" x2="2" y2="22" stroke="currentColor" stroke-width="2.5"/>';
    case 'polearm':
      return '<path d="M21 3l-6 2-3 5 2 2 5-3 2-6z" fill="currentColor"/><line x1="12" y1="12" x2="3" y2="21" stroke="currentColor" stroke-width="2"/>';
    case 'bow':
      return '<path d="M6 3c5.5 0 10 4.5 10 10s-4.5 10-10 10" stroke="currentColor" stroke-width="2" fill="none"/><line x1="6" y1="3" x2="6" y2="23" stroke="currentColor" stroke-width="1.5"/>';
    case 'catalyst':
      return '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" stroke="currentColor" stroke-width="2" fill="none"/>';
  }
}

export function createCharacterFallbackSvg(
  name: string,
  element: Element = 'electro',
  rarity: Rarity = 5
): string {
  const el = ELEMENT_COLORS[element] || ELEMENT_COLORS.electro;
  const rar = RARITY_GRADIENTS[rarity] || RARITY_GRADIENTS[5];
  const initial = (name.trim().charAt(0) || '✦').toUpperCase();
  const stars = '★'.repeat(rarity);
  const elementSvg = getElementSvgPath(element);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="charGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${el.border}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="${el.bg}" stop-opacity="0.95"/>
      </radialGradient>
      <linearGradient id="charBorder" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${rar.border}"/>
        <stop offset="100%" stop-color="${el.border}"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="16" fill="url(#charGlow)" stroke="url(#charBorder)" stroke-width="3"/>
    <circle cx="60" cy="55" r="32" fill="${el.bg}" stroke="${el.border}" stroke-width="1.5" stroke-dasharray="2,2"/>
    <text x="60" y="65" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    <g transform="translate(10, 10) scale(0.9)" color="${el.border}">
      <rect width="24" height="24" rx="6" fill="${el.bg}" stroke="${el.border}" stroke-width="1"/>
      <g transform="translate(2, 2) scale(0.8)">${elementSvg}</g>
    </g>
    <rect x="20" y="94" width="80" height="18" rx="9" fill="rgba(15, 23, 42, 0.75)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <text x="60" y="104" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#fbbf24" text-anchor="middle" dominant-baseline="middle">${stars}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createWeaponFallbackSvg(
  name: string,
  weaponType: WeaponType = 'sword',
  rarity: Rarity = 4
): string {
  const rar = RARITY_GRADIENTS[rarity] || RARITY_GRADIENTS[4];
  const initial = (name.trim().charAt(0) || '⚔').toUpperCase();
  const stars = '★'.repeat(rarity);
  const weaponPath = getWeaponSvgPath(weaponType);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="wpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e1b4b"/>
        <stop offset="100%" stop-color="#0f172a"/>
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="16" fill="url(#wpGrad)" stroke="${rar.border}" stroke-width="2.5"/>
    <circle cx="60" cy="52" r="30" fill="rgba(255,255,255,0.05)" stroke="${rar.border}" stroke-width="1"/>
    <g transform="translate(46, 38) scale(1.15)" color="${rar.border}">
      ${weaponPath}
    </g>
    <rect x="88" y="10" width="22" height="22" rx="6" fill="rgba(15, 23, 42, 0.8)" stroke="${rar.border}" stroke-width="1"/>
    <text x="99" y="21" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
    <rect x="20" y="94" width="80" height="18" rx="9" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <text x="60" y="104" font-family="system-ui, sans-serif" font-size="11" font-weight="bold" fill="#fbbf24" text-anchor="middle" dominant-baseline="middle">${stars}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createMaterialFallbackSvg(
  name: string,
  category: MaterialCategory = 'currency',
  rarity: Rarity = 5
): string {
  const rar = RARITY_GRADIENTS[rarity] || RARITY_GRADIENTS[5];
  const initial = (name.trim().charAt(0) || '✦').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <radialGradient id="matGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${rar.border}" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.95"/>
      </radialGradient>
    </defs>
    <rect width="120" height="120" rx="16" fill="url(#matGlow)" stroke="${rar.border}" stroke-width="2"/>
    <circle cx="60" cy="54" r="28" fill="rgba(15, 23, 42, 0.7)" stroke="${rar.border}" stroke-width="1.5"/>
    <polygon points="60 38 72 54 60 70 48 54" fill="${rar.border}" fill-opacity="0.3" stroke="${rar.border}" stroke-width="1.5"/>
    <text x="60" y="55" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${category.substring(0, 3).toUpperCase()}</text>
    <rect x="25" y="94" width="70" height="16" rx="8" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.1)"/>
    <text x="60" y="103" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#e2e8f0" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createGenericFallbackSvg(title = 'Irminsul Atlas'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <rect width="120" height="120" rx="16" fill="#1e1b4b" stroke="#7c3aed" stroke-width="2"/>
    <polygon points="60 38 74 60 60 82 46 60" fill="#fbbf24" fill-opacity="0.25" stroke="#fbbf24" stroke-width="2"/>
    <text x="60" y="98" font-family="system-ui, sans-serif" font-size="10" font-weight="bold" fill="#c4b5fd" text-anchor="middle">${title.substring(0, 10)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
