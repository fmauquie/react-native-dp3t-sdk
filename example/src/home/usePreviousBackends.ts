import AsyncStorage from '@react-native-community/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type Backend =
  | {
      type: 'manual';
      backendAppId: string;
      backendBaseUrl: string;
      bucketBaseUrl: string;
    }
  | {
      type: 'discover';
      backendAppId: string;
      dev: boolean;
    };

const PREVIOUS_BACKENDS_KEY = 'PREVIOUS_BACKENDS';

export function usePreviousBackends(): [
  Backend[] | Error,
  (backend: Backend) => Promise<void>
] {
  const [previousBackends, setPreviousBackends] = useState<Backend[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(function loadPreviousBackends() {
    AsyncStorage.getItem(PREVIOUS_BACKENDS_KEY)
      .then(res => setPreviousBackends(res ? JSON.parse(res) : []))
      .catch(setError);
  }, []);

  const addBackend = useCallback(
    async function addBackend(backend) {
      const backends = [
        backend,
        ...previousBackends.filter(
          prev =>
            prev.type !== backend.type &&
            prev.backendAppId !== backend.backendAppId
        ),
      ];
      setPreviousBackends(backends);
      await AsyncStorage.setItem(
        PREVIOUS_BACKENDS_KEY,
        JSON.stringify(backends)
      );
    },
    [previousBackends]
  );

  return useMemo(() => [error ?? previousBackends, addBackend], [
    error,
    previousBackends,
    addBackend,
  ]);
}
