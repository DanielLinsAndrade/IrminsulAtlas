import { useState } from 'react';
import { useShell } from '../../../app/providers';
import type { CreateProfileInput, Profile, UpdateProfileInput } from '../../../domain/profiles';
import { Button, EmptyState, LoadingState } from '../../../components';
import { ProfileFormModal } from './ProfileFormModal';
import { DeleteProfileModal } from './DeleteProfileModal';
import { BackupModal } from '../../backup';
import { SyncedProfileIdentity } from './SyncedProfileIdentity';

export function SettingsProfilesView() {
  const { profiles, activeProfile, isLoadingProfiles, switchProfile, createProfile, updateProfile, deleteProfile, navigationTarget } = useShell();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState<Profile | null>(null);
  const [backupOpen, setBackupOpen] = useState(navigationTarget?.route === 'settings' && navigationTarget.id === 'backup');
  const [error, setError] = useState<string | null>(null);
  async function save(input: CreateProfileInput | UpdateProfileInput) {
    if (editing) { await updateProfile(editing.id, input); setEditing(null); }
    else { await createProfile(input as CreateProfileInput); setCreateOpen(false); }
  }
  if (isLoadingProfiles) return <LoadingState title="Carregando perfis locais…" />;
  return <section className="settings-profiles">
    <div className="ui-panel-heading"><div><h2>Seus Perfis de Conta</h2><p className="ui-muted">Contas locais com dados isolados por perfil.</p></div><div className="page-actions"><Button variant="outline" onClick={() => setBackupOpen(true)}>Backup & Restauração</Button><Button onClick={() => setCreateOpen(true)}>Adicionar Perfil</Button></div></div>
    {error && <p role="alert" className="ui-error">{error}</p>}
    {!profiles.length && <EmptyState title="Nenhum perfil cadastrado" description="Crie um perfil para começar com seus próprios dados." actionLabel="Criar Perfil" onAction={() => setCreateOpen(true)} />}
    <div className="settings-profile-list">{[...profiles].sort((a, b) => Number(b.id === activeProfile?.id) - Number(a.id === activeProfile?.id)).map(profile => <article key={profile.id} className={'settings-profile ui-panel ' + (profile.id === activeProfile?.id ? 'settings-profile--active' : '')}>
      <div className="settings-profile-identity" style={{ gridColumn: '1 / -2' }}><SyncedProfileIdentity profile={profile} active={profile.id === activeProfile?.id} /></div>
      <div className="settings-profile-actions">{profile.id !== activeProfile?.id && <Button variant="outline" onClick={() => { setError(null); void switchProfile(profile.id).catch(cause => setError(String(cause))); }}>Tornar Ativo</Button>}<Button variant="secondary" onClick={() => setEditing(profile)}>Editar</Button><Button variant="danger" onClick={() => setDeleting(profile)}>Excluir</Button></div>
    </article>)}</div>
    <ProfileFormModal key={editing?.id ?? String(createOpen)} isOpen={createOpen || Boolean(editing)} initialProfile={editing} onClose={() => { setCreateOpen(false); setEditing(null); }} onSave={save} />
    <DeleteProfileModal isOpen={Boolean(deleting)} profile={deleting} onClose={() => setDeleting(null)} onConfirmDelete={async id => { await deleteProfile(id); setDeleting(null); }} />
    <BackupModal isOpen={backupOpen} onClose={() => setBackupOpen(false)} />
  </section>;
}
