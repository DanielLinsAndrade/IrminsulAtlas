import type { Profile } from '../../../domain/profiles';
import { usePublicProfile } from '../../../hooks/usePublicProfile';
import { AssetImage, Badge } from '../../../components';
import './SyncedProfileIdentity.css';
import { resolveProfileAvatar } from '../../../infrastructure/providers/publicProfileProvider';
import { profilePictureAsset } from '../../../infrastructure/providers/profilePictureAsset';
export function SyncedProfileIdentity({ profile, compact = false, active = false }: { profile: Profile; compact?: boolean; active?: boolean }) {
  const synced = usePublicProfile(profile.uid);
  const name = synced?.nickname || profile.name;
  const avatar = resolveProfileAvatar(synced?.avatarId ?? null) || profile.avatarCharacterId || (profile.travelerGender ? `character_${profile.travelerGender}` : null);
  return <div className="synced-profile-identity">
    {avatar ? <AssetImage asset={profilePictureAsset(synced)} entityType="character" entityId={avatar} alt={name} size={compact ? 36 : 80} shape="circle" /> : <span>{name.charAt(0)}</span>}
    {!compact && <div className="synced-profile-content"><header><strong>{name}</strong>{active && <Badge variant="success">Perfil ativo</Badge>}</header><p>{synced?.signature || profile.notes || 'Sem biografia'}</p><dl>
      <div><dt>Servidor</dt><dd>{profile.server || '—'}</dd></div><div><dt>UID</dt><dd>{profile.uid || 'Não informado'}</dd></div><div><dt>Rank de Aventura</dt><dd>{synced?.adventureRank ?? profile.adventureRank ?? '—'}</dd></div><div><dt>Nível do Mundo</dt><dd>{synced?.worldLevel ?? profile.worldLevel ?? '—'}</dd></div><div><dt>Viajante</dt><dd>{profile.travelerGender === 'lumine' ? 'Lumine' : profile.travelerGender === 'aether' ? 'Aether' : 'Não definido'}</dd></div>
      <div><dt>Conquistas</dt><dd>{synced?.achievements ?? '—'}</dd></div><div><dt>Abismo</dt><dd>{synced?.abyssFloor ?? '—'}–{synced?.abyssChamber ?? '—'}</dd></div><div><dt>Teatro</dt><dd>{synced?.theaterAct ?? '—'}</dd></div><div><dt>Cartão</dt><dd>{synced?.namecardId ?? '—'}</dd></div><div><dt>Último acesso</dt><dd>{profile.lastOpenedAt ? new Date(profile.lastOpenedAt).toLocaleString('pt-BR') : 'Primeiro acesso'}</dd></div>
    </dl></div>}
  </div>;
}
