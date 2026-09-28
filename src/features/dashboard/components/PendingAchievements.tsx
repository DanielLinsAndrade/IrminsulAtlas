import { useEffect, useState } from 'react';
import { useShell } from '../../../app/providers';
import { achievementsRepository } from '../../../infrastructure/db';
import type { AchievementWithStatus } from '../../../domain/achievements';
import { AchievementCategoryIcon } from '../../../components/AchievementCategoryIcon';
import { resolveTravelerText } from '../../../domain/shared/travelerText';
export function PendingAchievements() {
  const { activeProfile, navigateTo } = useShell();
  const [items, setItems] = useState<AchievementWithStatus[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { let alive = true; if (activeProfile) void achievementsRepository.getAchievementsWithStatus(activeProfile.id).then(all => { if (alive) setItems(all.filter(a => !a.completed && a.id.startsWith('gi_')).slice(0,8)); }).catch(cause => { if (alive) setError(String(cause)); }); return () => { alive = false; }; }, [activeProfile]);
  return <div className="dashboard-farm-preview dashboard-pending-list">{error && <p role="alert">{error}</p>}{items.map(item => {
    const name = resolveTravelerText(item.namePtBr, activeProfile?.travelerGender);
    return <button type="button" key={item.id} onClick={() => navigateTo('achievements', { id: item.id, query: name })}><AchievementCategoryIcon category={item.category} size={32} />{name}<small>{item.rewardPrimogems} Primogemas · {item.category}</small></button>;
  })}</div>;
}
