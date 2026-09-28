import { usePublicProfile } from '../../../hooks/usePublicProfile';
export function PublicProfileSummary({ uid }: { uid: string | null }) {
  const data = usePublicProfile(uid);
  return data && data.uid === uid ? <div className="public-profile-summary"><small>Enka · sincronizado em {new Date(data.syncedAt).toLocaleString('pt-BR')}</small><p>{data.nickname} · {data.signature || 'Sem assinatura'}</p>{data.achievements !== null && <small>{data.achievements} conquistas públicas · não altera suas marcações locais</small>}</div> : null;
}
