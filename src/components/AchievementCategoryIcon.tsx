import { useState } from 'react';
import registry from '../infrastructure/providers/achievementIcons.json';
export function AchievementCategoryIcon({ category, size = 44 }: { category: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  const item = (registry.categories as Record<string, { uri: string }>)[category];
  return item && !failed ? <img src={item.uri} alt="" width={size} height={size} style={{ objectFit: 'contain', flexShrink: 0 }} onError={() => setFailed(true)} /> : <span title={category} aria-label={category} style={{ width: size, flexShrink: 0, color: 'var(--text-secondary)' }}>{category.slice(0,2)}</span>;
}
