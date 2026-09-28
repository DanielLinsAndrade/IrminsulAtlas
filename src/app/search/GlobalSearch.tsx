import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, ModalBody } from '../../components';
import { useShell } from '../providers';
import { loadSearchIndex, searchEntries, type SearchEntry } from './searchIndex';

export function GlobalSearch() {
  const { activeProfile, navigateTo } = useShell();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const allResults = useMemo(() => searchEntries(entries, query), [entries, query]);
  const results = allResults.slice(0, 80);
  const close = useCallback(() => { setOpen(false); trigger.current?.focus(); }, []);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        trigger.current?.focus();
        setOpen(previous => !previous);
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    input.current?.focus();
    void Promise.resolve().then(() => {
      if (cancelled) return [];
      setLoading(true);
      setError('');
      setEntries([]);
      setSelected(0);
      return loadSearchIndex(activeProfile?.id);
    }).then(data => {
      if (!cancelled) { setEntries(data); setLoading(false); }
    }).catch(reason => {
      if (!cancelled) { setError(`Não foi possível carregar a busca: ${String(reason)}`); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [open, activeProfile?.id, activeProfile?.travelerGender]);

  const choose = (entry: SearchEntry) => {
    navigateTo(entry.route, entry.group === 'Páginas' ? undefined : { id: entry.id, query: entry.label });
    close();
  };

  return <>
    <button ref={trigger} type="button" className="header-search-bar" onClick={() => setOpen(true)} aria-label="Busca global" aria-keyshortcuts="Control+k">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="10" cy="10" r="7"/><path d="m15 15 6 6"/></svg>
      <span className="header-search-input">Pesquisar no Irminsul Atlas…</span><kbd className="header-search-shortcut">Ctrl K</kbd>
    </button>
    <Modal isOpen={open} onClose={close} title="Busca global" ariaLabelledBy="global-search-title" maxWidth="700px">
      <ModalBody>
        <input ref={input} className="global-search-field" placeholder="Personagens, armas, materiais, metas, conquistas…" role="combobox" aria-label="Pesquisar" aria-controls="global-search-results" aria-expanded="true" aria-autocomplete="list" aria-activedescendant={results[selected] ? `search-result-${selected}` : undefined} value={query}
          onChange={event => { setQuery(event.target.value); setSelected(0); }}
          onKeyDown={event => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              const next = Math.max(0, Math.min(results.length - 1, selected + (event.key === 'ArrowDown' ? 1 : -1)));
              setSelected(next);
              document.getElementById(`search-result-${next}`)?.scrollIntoView({ block: 'nearest' });
            } else if (event.key === 'Enter' && results[selected]) {
              event.preventDefault(); choose(results[selected]);
            }
          }}/>
        {loading && <p role="status">Carregando catálogo e metas do perfil…</p>}
        {error && <p role="alert">{error}</p>}
        {!loading && !error && !results.length && <p>Nenhum resultado para esta busca.</p>}
        <div id="global-search-results" role="listbox" aria-label="Resultados" className="global-search-results">
          {results.map((entry, index) => <div key={`${entry.group}:${entry.id}`}>
            {(index === 0 || results[index - 1].group !== entry.group) && <p className="search-group">{entry.group}</p>}
            <button type="button" role="option" aria-selected={selected === index} id={`search-result-${index}`} onClick={() => choose(entry)} onMouseMove={() => setSelected(index)} tabIndex={-1} className="search-result">
              <span>{entry.label}</span><small>{entry.description || entry.group}</small>
            </button>
          </div>)}
        </div>
        <p className="search-hint">↑ ↓ para navegar · Enter para abrir · Esc para fechar</p>
        {allResults.length > results.length && <p className="search-hint">Exibindo {results.length} de {allResults.length} resultados. Refine sua pesquisa.</p>}
      </ModalBody>
    </Modal>
  </>;
}
