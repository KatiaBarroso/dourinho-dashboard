"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Alert, Button, Field, PageTitle, inputClass } from "@/components/ui";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "danger" | "success"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setMessage({ tone: "danger", text: "A confirmação não confere com a nova senha." });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await api("/api/updatepassword", { method: "PUT", body: { currentPassword, newPassword } });
      setMessage({ tone: "success", text: "Senha alterada com sucesso." });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (err) {
      setMessage({ tone: "danger", text: err instanceof Error ? err.message : "Erro ao alterar a senha." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageTitle title="Alterar senha" />
      <form onSubmit={handleSubmit} className="max-w-md space-y-4 rounded-xl border border-line bg-surface p-6">
        <Field label="Senha atual">
          {(id) => <input id={id} type="password" className={inputClass} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required />}
        </Field>
        <Field label="Nova senha" hint="Mínimo de 6 caracteres.">
          {(id) => <input id={id} type="password" className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" minLength={6} required />}
        </Field>
        <Field label="Confirmar nova senha">
          {(id) => <input id={id} type="password" className={inputClass} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />}
        </Field>
        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <Button type="submit" loading={loading}>Salvar nova senha</Button>
      </form>
    </>
  );
}
