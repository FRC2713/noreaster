import { useMemo } from 'react';
import { useAlliancesPolling } from './use-alliances-polling';

export function useAllianceData() {
  const { alliances } = useAlliancesPolling();

  // Create a memoized map for O(1) alliance lookups
  const allianceMap = useMemo(() => {
    const map = new Map();
    alliances.forEach(alliance => {
      map.set(alliance.id, {
        id: alliance.id,
        name: alliance.name,
        emblem_image_url: alliance.emblem_image_url,
      });
    });
    return map;
  }, [alliances]);

  const getAllianceById = useMemo(() => {
    return (allianceId: string | null) => {
      if (!allianceId) return null;
      return allianceMap.get(allianceId) || null;
    };
  }, [allianceMap]);

  return {
    getAllianceById,
    allianceMap,
  };
}
