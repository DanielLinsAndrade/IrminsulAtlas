import { useEffect, useState } from 'react';
import { getCachedPublicProfile, type PublicProfile } from '../infrastructure/providers/publicProfileProvider';
export function usePublicProfile(uid: string | null | undefined) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => { if (!uid) { setProfile(null); return; } void getCachedPublicProfile(uid).then(value => { if (alive) setProfile(value); }).catch(cause => console.warn('Cache Enka indisponível', cause)); };
    load(); window.addEventListener('wishlog-public-profile-changed', load);
    return () => { alive = false; window.removeEventListener('wishlog-public-profile-changed', load); };
  }, [uid]);
  return profile?.uid === uid ? profile : null;
}
