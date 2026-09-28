export function CharacterProgressLine({ constellation, maxConstellation = 6, talents }: { constellation: number; maxConstellation?: number; talents?: [number, number, number] }) {
  return <div className="character-progress-line">
    <div aria-label={`Constelação C${constellation}`}>{Array.from({length:maxConstellation}, (_, i) => <span key={i} data-unlocked={i < constellation} aria-label={`C${i+1}: ${i < constellation ? 'ativada' : 'não ativada'}`}>C{i+1}</span>)}</div>
    <small>{talents ? `ATQ ${talents[0]} · Hab. ${talents[1]} · Sup. ${talents[2]}` : 'Sem talentos registrados.'}</small>
  </div>;
}
