"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { api } from "@/lib/api";

const fieldClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/api/signe", { method: "POST", body: { email, password } });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
      setShake(true);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-1 flex-col items-center justify-center gap-12 bg-primary px-4 py-10">
      <Image src="/Icon-512.png" alt="Guardiões do Rio — Missão Sustentabilidade" width={220} height={220} priority className="size-44 sm:size-56" />

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 rounded-xl border border-black/70 bg-surface p-5 shadow-lg">
        <h1 className="text-lg text-foreground">Login</h1>

        <input
          type="email"
          aria-label="E-mail"
          placeholder="E-mail"
          className={fieldClass}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          required
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            aria-label="Senha"
            placeholder="Senha"
            className={`${fieldClass} pr-10`}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          onAnimationEnd={() => setShake(false)}
          className={`flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-lg text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-70 ${
            shake ? "animate-shake" : ""
          }`}
        >
          {loading && <LoaderCircle className="size-5 animate-spin" />}
          Entrar
        </button>
      </form>
    </main>
  );
}
