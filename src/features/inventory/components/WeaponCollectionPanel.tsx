import { useEffect, useState } from 'react';
import { AssetImage, Button, Modal, ModalBody } from '../../../components';
import { defaultGameDataProvider } from '../../../infrastructure/providers';
import { weaponsRepository } from '../../../infrastructure/db/weaponsRepository';
import { weaponCollectionRepository } from '../../../infrastructure/db/weaponCollectionRepository';
import { COLLECTION_TYPES, regionalWeaponCollection, weaponCollectionSummary, type BilletStock } from '../../../domain/weapons/collection';
import type { WeaponData } from '../../../domain/catalog';
import type { AccountWeapon } from '../../../domain/weapons/types';

export function WeaponCollectionPanel({ profileId, onClose }: { profileId: string; onClose: () => void }) {
  const [catalog, setCatalog] = useState<WeaponData[]>([]);
  const [collection, setCollection] = useState<AccountWeapon[]>([]);
  const [stock, setStock] = useState<BilletStock>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<AccountWeapon | null>(null);
  useEffect(() => {
    let active = true;
    void Promise.all([defaultGameDataProvider.getAllWeapons(), weaponsRepository.getAccountWeapons(profileId), weaponCollectionRepository.getStock(profileId)]).then(([items, owned, saved]) => {
      if (active) { setCatalog(items); setCollection(owned); setStock(saved); }
    }).catch(cause => { if (active) setError(String(cause)); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [profileId]);
  async function change(action: () => Promise<unknown>, success: string) {
    setSaving(true); setError(''); setMessage('');
    try { await action(); setCollection(await weaponsRepository.getAccountWeapons(profileId)); setMessage(success); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }
  const summary = weaponCollectionSummary(catalog, collection, stock, profileId);
  return <Modal isOpen title="Coleção de Armas · Protótipos" maxWidth="1100px" onClose={onClose}><ModalBody>
    <p className="ui-muted">Objetivo: uma cópia R5 de cada arma do ferreiro. Tenho é seu estoque de protótipos por tipo; não inclui armas prontas. Havendo várias cópias, usamos o maior refinamento, sem consumir nem juntar as demais.</p>
    {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    {loading ? <p>Carregando coleção…</p> : <>
      <div className="weapon-collection-summary"><table><thead><tr><th>Protótipos</th>{summary.map(row => <th key={row.type}>{COLLECTION_TYPES[row.type]}</th>)}</tr></thead><tbody>
        <tr><th>Preciso</th>{summary.map(row => <td key={row.type}>{row.need}</td>)}</tr>
        <tr><th>Tenho</th>{summary.map(row => <td key={row.type}><input aria-label={`Tenho protótipos de ${COLLECTION_TYPES[row.type]}`} type="number" min="0" max="99999" step="1" value={stock[row.type] ?? ''} placeholder="0" onChange={event => setStock(old => ({ ...old, [row.type]: Number(event.target.value) }))}/></td>)}</tr>
        {(['missing', 'surplus'] as const).map((key, index) => <tr key={key}><th>{['Falta', 'Sobrou'][index]}</th>{summary.map(row => <td key={row.type} data-kind={key}>{row[key]}</td>)}</tr>)}
      </tbody></table></div><div><Button size="sm" variant="secondary" onClick={() => void change(() => weaponCollectionRepository.saveStock(profileId, stock), 'Estoque de protótipos salvo.')} disabled={saving}>Salvar estoque</Button></div>
      <h3>Armas regionais do ferreiro</h3><p className="ui-muted">Posse e refinamento são salvos diretamente na coleção deste perfil. Cada controle altera a cópia de maior refinamento; as outras permanecem intactas.</p>
      {regionalWeaponCollection(catalog, collection, profileId).map(group => <section key={group.region} className="weapon-region"><h4>{group.region}</h4><div className="weapon-region-grid">{summary.map(({ type }) => <div key={type}><h5>{COLLECTION_TYPES[type]}</h5>{group.weapons.filter(item => item.weaponType === type).map(item => <article key={item.id} data-owned={item.owned}>
        <AssetImage entityType="weapon" entityId={item.id} alt={item.namePtBr} size={44}/><strong>{item.namePtBr}</strong>
        <div className="forge-weapon-controls"><label><input type="checkbox" checked={item.owned} disabled={saving} onChange={event => {
          if (event.target.checked) void change(() => weaponsRepository.createAccountWeapon(profileId, { weaponId: item.id, refinement: 1 }), 'Arma registrada na coleção.');
          else setRemoving(item.copies[0]);
        }}/>Possuo?</label><select aria-label={`Refinamento de ${item.namePtBr}`} disabled={!item.owned || saving} value={item.refinement ?? 1} onChange={event => void change(() => weaponsRepository.updateAccountWeapon(item.copies[0].id, { refinement: Number(event.target.value) }), 'Refinamento atualizado na coleção.')}>{[1,2,3,4,5].map(r => <option key={r} value={r}>R{r}</option>)}</select></div>
        <small>{item.debt} protótipos até R5{item.copies.length > 1 ? ` · ${item.copies.length} cópias` : ''}</small>
      </article>)}</div>)}</div></section>)}
    </>}
    {removing && <Modal isOpen title="Remover cópia da coleção?" onClose={() => setRemoving(null)} maxWidth="480px"><ModalBody><p>A cópia #{removing.instanceNo}, R{removing.refinement}, será removida da coleção real. Vínculos de equipamento/build dessa cópia serão desfeitos. Outras cópias serão preservadas.</p><div className="page-actions"><Button variant="secondary" disabled={saving} onClick={() => setRemoving(null)}>Cancelar</Button><Button variant="danger" disabled={saving} onClick={() => void change(async () => { await weaponsRepository.deleteAccountWeapon(removing.id); setRemoving(null); }, 'Cópia removida da coleção. Outras cópias foram preservadas.')}>Remover cópia</Button></div></ModalBody></Modal>}
  </ModalBody></Modal>;
}
