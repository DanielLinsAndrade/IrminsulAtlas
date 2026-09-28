import { useState } from 'react';
import inventory from '../../generated/thirdPartyNotices.json';
import noticesFile from '../../../legal/THIRD_PARTY_NOTICES.md?url';

export default function LicensesView() {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(25);
  const filtered = inventory.entries.filter(entry => `${entry.name} ${entry.version} ${entry.license} ${entry.ecosystem}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <article className="ui-panel about-card about-licenses">
    <h2>Licenças de terceiros</h2>
    <p>Dependências instaladas e grafo nativo Windows, incluindo ferramentas de desenvolvimento. As licenças abaixo não se estendem automaticamente ao código próprio ou às imagens do jogo.</p>
    <p><a href={noticesFile} download="THIRD_PARTY_NOTICES.md">Baixar inventário e avisos completos</a></p>
    {inventory.entries.some(entry=>!entry.notices.length) && <p className="ui-muted">Ressalva de distribuição: {inventory.entries.filter(entry=>!entry.notices.length).map(entry=>`${entry.name} ${entry.version}`).join(', ')} declara licença, mas não fornece texto de aviso no pacote instalado. A lacuna está registrada, sem atribuição inventada.</p>}
    <label htmlFor="license-search">Buscar pacote ou licença</label>
    <input id="license-search" type="search" value={query} onChange={event => {setQuery(event.target.value);setLimit(25);}} placeholder="React, Tauri, MIT…" />
    <p role="status">{filtered.length} de {inventory.entries.length} dependências · Abra um item para ler seus avisos.</p>
    {filtered.slice(0,limit).map(entry => <details className="about-license" key={`${entry.ecosystem}/${entry.name}/${entry.version}`}>
      <summary>{entry.name} · {entry.version} · {entry.license}</summary>
      <p>{entry.ecosystem} · {entry.scope}</p>
      {entry.notices.length ? entry.notices.map(notice => <div key={notice.file}><h3>{notice.file}</h3><pre>{notice.text}</pre></div>) : <p>O pacote declara esta licença, mas não inclui arquivo de aviso nas pastas inspecionadas. Consulte o inventário para a ressalva de redistribuição.</p>}
    </details>)}
    {filtered.length>limit && <button type="button" className="about-action" onClick={()=>setLimit(limit+25)}>Mostrar mais 25</button>}
  </article>;
}
