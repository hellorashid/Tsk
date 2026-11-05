import { useState, useCallback } from 'react';
import { PrototypeId as BasePrototypeId } from '../components/prototypes/PrototypesLanding';

export type PrototypeId = BasePrototypeId | null;

export const usePrototypeView = () => {
  const [activePrototype, setActivePrototype] = useState<PrototypeId>(null);

  const openPrototype = useCallback((id: PrototypeId) => {
    setActivePrototype(id);
  }, []);

  const closePrototype = useCallback(() => {
    setActivePrototype(null);
  }, []);

  const isPrototypeActive = activePrototype !== null;

  return {
    activePrototype,
    isPrototypeActive,
    openPrototype,
    closePrototype,
  };
};
