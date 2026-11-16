'use client';
import { useCallback, useEffect, useState } from 'react';
import { parseWorkspace, type Workspace } from '../modules/workspace/workspace';

const STORAGE_KEY = 'elan.espace-de-travail.v1';

/**
 * L'espace de travail vit dans le navigateur de la consultante (localStorage) :
 * il survit à une actualisation, ne quitte pas son poste et s'efface en un clic.
 */
export function useWorkspace() {
  const [ready, setReady] = useState(false);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [storageFailed, setStorageFailed] = useState(false);

  // Lecture après le premier rendu : le serveur ne connaît pas le contenu du navigateur.
  useEffect(() => {
    try { setWorkspace(parseWorkspace(window.localStorage.getItem(STORAGE_KEY))); }
    catch { setStorageFailed(true); }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      if (workspace) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
      else window.localStorage.removeItem(STORAGE_KEY);
      setStorageFailed(false);
    } catch { setStorageFailed(true); }
  }, [ready, workspace]);

  const update = useCallback((change: (current: Workspace) => Workspace) => {
    setWorkspace(current => (current ? change(current) : current));
  }, []);

  return { ready, workspace, storageFailed, open: setWorkspace, update, clear: useCallback(() => setWorkspace(null), []) };
}
