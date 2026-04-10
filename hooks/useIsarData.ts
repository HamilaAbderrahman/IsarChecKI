"use client";

import useSWR from "swr";
import type { IsarData } from "@/lib/types";
import type { AIVerdict } from "@/lib/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useIsarData() {
  const { data, error, isLoading, mutate } = useSWR<IsarData>(
    "/api/isar-data",
    fetcher,
    {
      refreshInterval: 600_000, // 10 minutes
      revalidateOnFocus: true,
      dedupingInterval: 60_000,
    }
  );

  return {
    data,
    error,
    isLoading,
    refresh: mutate,
  };
}

export function useVerdict() {
  const { data, error, isLoading, mutate } = useSWR<{
    verdict: AIVerdict;
    data: IsarData;
  }>("/api/verdict", fetcher, {
    refreshInterval: 900_000, // 15 minutes
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  return {
    verdict: data?.verdict,
    isarData: data?.data,
    error,
    isLoading,
    refresh: mutate,
  };
}
