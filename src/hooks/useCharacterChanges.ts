import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export function useCharacterChanges(profileId: string | null, reload: Dispatch<SetStateAction<number>>) {
  useEffect(() => {
    const changed = (event: Event) => { if ((event as CustomEvent<string>).detail === profileId) reload(value => value + 1); };
    window.addEventListener('wishlog-characters-changed', changed);
    return () => window.removeEventListener('wishlog-characters-changed', changed);
  }, [profileId, reload]);
}
