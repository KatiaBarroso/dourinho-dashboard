"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

/**
 * Carrega dados de uma rota GET. `loading` fica true enquanto a URL atual (ou um reload)
 * ainda não respondeu; os dados anteriores são mantidos até a nova resposta chegar.
 */
export function useApiData<T>(url: string) {
  const [version, setVersion] = useState(0);
  const requestKey = `${url}#${version}`;
  const [state, setState] = useState<{ data: T | null; error: string | null; key: string | null }>({
    data: null,
    error: null,
    key: null,
  });

  useEffect(() => {
    let active = true;
    api<T>(url)
      .then((data) => active && setState({ data, error: null, key: requestKey }))
      .catch((err) =>
        active &&
        setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Erro ao carregar os dados.", key: requestKey })),
      );
    return () => {
      active = false;
    };
  }, [url, requestKey]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data: state.data, error: state.error, loading: state.key !== requestKey, reload };
}
