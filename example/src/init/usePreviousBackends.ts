import { useAsyncStorage } from '@react-native-community/async-storage';
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

export function usePreviousBackends(): [
  Backend[] | Error,
  (backend: Backend) => Promise<void>
] {
  const { getItem, setItem } = useAsyncStorage('PREVIOUS_BACKENDS');
  const [previousBackends, setPreviousBackends] = useState<Backend[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(
    function loadPreviousBackends() {
      getItem()
        .then(res => setPreviousBackends(res ? JSON.parse(res) : []))
        .catch(setError);
    },
    [getItem]
  );

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
      await setItem(JSON.stringify(backends));
    },
    [previousBackends, setItem]
  );

  return useMemo(() => [error ?? previousBackends, addBackend], [
    error,
    previousBackends,
    addBackend,
  ]);
}
