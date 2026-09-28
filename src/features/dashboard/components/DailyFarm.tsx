import { useEffect, useMemo, useState } from 'react';
import { useBuilds } from '../../builds/hooks/useBuilds';
import { useInventory } from '../../inventory/hooks/useInventory';
import { calculateCharacterEvolution, aggregateEvolutionPlans } from '../../../domain/progression/calculator';
import { farmDay } from '../../../domain/progression/dailyReset';
import { AssetImage } from '../../../components';
import { appSettingsRepository } from '../../../infrastructure/db';
import { useShell } from '../../../app/providers';
export function DailyFarm() {
  const { navigateTo } = useShell();
  const { builds, error } = useBuilds();
  const { inventory } = useInventory();
  const [offset, setOffset] = useState(-new Date().getTimezoneOffset()/60);
  const [now, setNow] = useState(new Date());
  const [settingError, setSettingError] = useState('');
  useEffect(() => { let alive = true; void appSettingsRepository.getSetting('farm.utc_offset').then(value => { if (alive && value !== null && Number.isFinite(Number(value))) setOffset(Number(value)); }).catch(cause => { if (alive) setSettingError(String(cause)); }); const timer = setInterval(() => setNow(new Date()), 60000); return () => { alive = false; clearInterval(timer); }; }, []);
  const day = farmDay(now, -3, 6); // America reset stays at 09:00 UTC; the selected zone changes its displayed hour.
  const materials = useMemo(() => {
    const stock = new Map(inventory.map(i => [i.materialId, i.quantity]));
    const calculations = builds.filter(b => b.farmEnabled && b.farmStatus === 'active').map(b => calculateCharacterEvolution({ characterId: b.characterId, characterName: b.characterName, element: b.characterElement, rarity: b.characterRarity === 5 ? 5 : 4, iconUrl: b.characterIconUrl, farmEnabled: true,
      levelGoal: { currentLevel: b.characterLevel, targetLevel: b.characterTargetLevel, currentAscension: b.characterAscension, targetAscension: b.characterTargetAscension },
      talentGoal: { currentNormalAttack: b.normalAttackLevel, targetNormalAttack: b.normalAttackTarget, currentElementalSkill: b.elementalSkillLevel, targetElementalSkill: b.elementalSkillTarget, currentElementalBurst: b.elementalBurstLevel, targetElementalBurst: b.elementalBurstTarget } }, stock));
    // The existing engine infers regional recipes by element. Only universal costs
    // are reliable here until character-specific domain mappings are supplied.
    return aggregateEvolutionPlans(calculations, stock).materials.filter(m => m.missing > 0 && (m.category === 'currency' || m.category === 'other'));
  }, [builds, inventory]);
  const resetMinutes = ((9 + offset + 24) % 24) * 60;
  const resetLabel = `${String(Math.floor(resetMinutes / 60)).padStart(2,'0')}:${String(resetMinutes % 60).padStart(2,'0')}`;
  return <section className="dashboard-daily-farm"><h2>Farm do dia</h2><small>{day.day} · {day.date} · reset {resetLabel}</small><label>Fuso UTC<select aria-label="Fuso UTC" value={offset} onChange={e => { const value = Number(e.target.value); setOffset(value); void appSettingsRepository.setSetting('farm.utc_offset', String(value)).catch(cause => setSettingError(String(cause))); }}>{Array.from({ length:105 },(_,i) => i/4-12).map(n => <option key={n} value={n}>{n >= 0 ? '+' : ''}{n}</option>)}</select></label>
    {(error || settingError) && <p role="alert">{error || settingError}</p>}
    <div className="dashboard-daily-list">{materials.map(m => <div key={m.materialId}><AssetImage entityType="material" entityId={m.materialId} alt="" size={26}/><span>{m.namePtBr}<small>Faltam {m.missing.toLocaleString('pt-BR')} · disponível diariamente</small></span></div>)}{!materials.length && <p>Sem custos gerais pendentes nos planos ativos.</p>}<small>Custos gerais dos planos. A agenda de domínios por personagem ainda não está mapeada; receitas estimadas não são exibidas aqui.</small></div><button type="button" onClick={() => navigateTo('farm')}>Ver todo o Farm</button>
  </section>;
}
