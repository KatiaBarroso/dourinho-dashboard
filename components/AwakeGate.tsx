"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CircleAlert, RefreshCw } from "lucide-react";

const STORAGE_KEY = "quiz-server-awake";
const MAX_WAIT_MS = 60_000;
const DELAYS_MS = [1_000, 2_000, 3_000, 5_000];

type Status = "checking" | "ready" | "error";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function readFlag() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeFlag() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // sessionStorage indisponível: apenas repete a checagem na próxima carga.
  }
}

/** Chama /api/awakeserver até o Supabase responder; só então libera a aplicação. */
async function waitForServer(): Promise<boolean> {
  const start = Date.now();
  for (let attempt = 0; Date.now() - start < MAX_WAIT_MS; attempt++) {
    try {
      const response = await fetch("/api/awakeserver", { cache: "no-store" });
      if (response.ok) return true;
    } catch {
      // Rede indisponível: tenta de novo.
    }
    await sleep(DELAYS_MS[Math.min(attempt, DELAYS_MS.length - 1)]);
  }
  return false;
}

export default function AwakeGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("checking");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    (readFlag() ? Promise.resolve(true) : waitForServer()).then((awake) => {
      if (!active) return;
      if (awake) writeFlag();
      setStatus(awake ? "ready" : "error");
    });
    return () => {
      active = false;
    };
  }, [attempt]);

  function retry() {
    setStatus("checking");
    setAttempt((n) => n + 1);
  }

  if (status === "ready") return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-6 bg-primary px-4 text-center text-white">
      {status === "checking" ? (
        <>
          <Image src="/Icon-512.png" alt="" width={176} height={176} priority className="size-44 animate-pulse" />
          <div className="space-y-2">
            <p className="text-2xl font-semibold" role="status">Acordando o servidor…</p>
            <p className="text-sm opacity-80">Isso pode levar alguns segundos.</p>
          </div>
          <span className="size-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
        </>
      ) : (
        <>
          <CircleAlert className="size-16" aria-hidden />
          <div className="space-y-2">
            <p className="text-2xl font-semibold">Não foi possível conectar ao servidor</p>
            <p className="text-sm opacity-80">Verifique sua conexão ou tente novamente em instantes.</p>
          </div>
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-lg bg-surface px-5 py-2.5 font-medium text-primary hover:bg-primary-soft"
          >
            <RefreshCw className="size-4" /> Tentar novamente
          </button>
        </>
      )}
    </div>
  );
}
