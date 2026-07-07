"use client";
// src/hooks/useProgress.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchWithAuth } from "./useAuth";

export function useLectureProgress(lectureId: string | null) {
  return useQuery({
    queryKey: ["progress", lectureId],
    queryFn:  () => fetchWithAuth(`/api/progress?lectureId=${lectureId}`),
    enabled:  !!lectureId,
    select:   (res) => (res?.data ?? []) as { videoId: string | null; completed: boolean }[],
  });
}

export function useMarkVideoWatched() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      lectureId,
      videoId,
    }: {
      lectureId: string;
      videoId?: string;
    }) =>
      fetchWithAuth("/api/progress", {
        method: "POST",
        body: JSON.stringify({ lectureId, videoId, completed: true }),
      }),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["progress", vars.lectureId] });
    },
  });
}
