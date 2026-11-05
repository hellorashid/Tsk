import { useState, useCallback } from 'react';
import { PrototypeId as BasePrototypeId } from '../components/prototypes/PrototypesLanding';

export type PrototypeId = BasePrototypeId | null | undefined;

export const usePrototypeView = () => {
  const [activePrototype, setActivePrototype] = useState<PrototypeId>(undefined);

  const openPrototype = useCallback((id: BasePrototypeId | null) => {
    setActivePrototype(id);
  }, []);

  const closePrototype = useCallback(() => {
    setActivePrototype(undefined);
  }, []);

  const isPrototypeActive = activePrototype !== undefined;

  return {
    activePrototype,
    isPrototypeActive,
    openPrototype,
    closePrototype,
  };
};
