import { useEffect, useState } from 'react';
import { useShell } from '../../../app/providers';
import type { ProfileResources } from '../../../domain/inventory';
import { calculateDashboardTotal, DEFAULT_TOTAL_SELECTION, type TotalWishSelection } from '../../../domain/wishes/dashboardSummary';
import { appSettingsRepository } from '../../../infrastructure/db';
import { Button } from '../../../components';
export function TotalWishesCard({ resources, characterPity, weaponPity }: { resources: ProfileResources | null; characterPity: number; weaponPity: number }) {
  const { activeProfile } = useShell();
  const [selection, setSelection] = useState(DEFAULT_TOTAL_SELECTION);
  const [message, setMessage] = useState('');
  const key = `dashboard_total:${activeProfile?.id}`;
  useEffect(() => { let alive = true; void appSettingsRepository.getSetting(key).then(value => { if (alive && value) setSelection({ ...DEFAULT_TOTAL_SELECTION, ...JSON.parse(value) }); }).catch(cause => { if (alive) setMessage(String(cause)); }); return () => { alive = false; }; }, [key]);
  const total = calculateDashboardTotal(resources, characterPity, weaponPity, selection);
  return <section className="ui-panel dashboard-total">
    <div>
      <h2>Total de Tiros</h2><strong>{total.total.toLocaleString('pt-BR')}</strong>
      <p>{selection.scenario === 'both' ? 'Ambos' : selection.scenario === 'weapon' ? 'Arma' : 'Personagem'} · {total.available} disponíveis + {total.progress} pity</p>
    </div>
    <details>
      <summary aria-label="Configurar composição de tiros"><span className="dashboard-total__closed">Configurar</span><span className="dashboard-total__open">Configurar composição</span><svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5"/></svg></summary>
      <p>Pity é progresso, não saldo para gastar. No cenário Ambos, os recursos são contados uma única vez.</p>
      <div className="ui-toolbar">
        <label>Banner<select value={selection.scenario} onChange={e => setSelection({ ...selection, scenario: e.target.value as TotalWishSelection['scenario'] })}><option value="character">Personagem</option><option value="weapon">Arma</option><option value="both">Ambos</option></select></label>
        {([['characterPity','Pity de personagem'],['weaponPity','Pity de arma'],['primogems','Primogemas'],['fates','Destinos Entrelaçados'],['glitter','Brilho Estelar'],['crystals','Cristais Gênesis']] as const).map(([field,label]) => <label key={field}><input type="checkbox" checked={selection[field]} onChange={e => setSelection({ ...selection, [field]: e.target.checked })}/>{label}</label>)}
      </div>
      <Button size="sm" onClick={() => {
        void appSettingsRepository.setSetting(key, JSON.stringify(selection)).then(() => setMessage('Composição salva.')).catch(cause => setMessage(String(cause)));
      }}>Salvar composição</Button>
      {message && <p role="status">{message}</p>}
    </details>
  </section>;
}
