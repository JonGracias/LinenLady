"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type DraftJobStatus = "running" | "success" | "error";

export type DraftJob = {
  jobId: string;
  label: string;
  status: DraftJobStatus;
  createdAt: number;
  inventoryId?: number;
  error?: string;
};

type DraftJobsContextValue = {
  jobs: DraftJob[];
  pendingCount: number;
  allDone: boolean;
  startJob: (label: string, run: () => Promise<{ inventoryId: number }>) => void;
};

const DraftJobsContext = createContext<DraftJobsContextValue | null>(null);

export function useDraftJobs() {
  const ctx = useContext(DraftJobsContext);
  if (!ctx) throw new Error("DraftJobsContext not found");
  return ctx;
}

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function DraftJobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<DraftJob[]>([]);

  const startJob = useCallback((label: string, run: () => Promise<{ inventoryId: number }>) => {
    const jobId = uid();

    setJobs((prev) => [
      { jobId, label, status: "running", createdAt: Date.now() },
      ...prev,
    ]);

    (async () => {
      try {
        const result = await run();
        setJobs((prev) =>
          prev.map((j) =>
            j.jobId === jobId ? { ...j, status: "success", inventoryId: result.inventoryId } : j
          )
        );
      } catch (e: any) {
        setJobs((prev) =>
          prev.map((j) =>
            j.jobId === jobId
              ? { ...j, status: "error", error: e?.message ?? "Unknown error" }
              : j
          )
        );
      }
    })();
  }, []);

  const pendingCount = useMemo(() => jobs.filter((j) => j.status === "running").length, [jobs]);
  const allDone = pendingCount === 0;

  const value: DraftJobsContextValue = { jobs, pendingCount, allDone, startJob };

  return <DraftJobsContext.Provider value={value}>{children}</DraftJobsContext.Provider>;
}
