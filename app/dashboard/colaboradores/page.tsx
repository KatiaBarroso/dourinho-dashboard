"use client";

import { useCallback, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { fieldErrors } from "@/lib/formErrors";
import { useApiData } from "@/lib/useApiData";
import type { Colaborador } from "@/lib/types";
import { createColaboradorSchema, updateColaboradorSchema } from "@/lib/validators";
import { Alert, Button, ConfirmDialog, Field, IconButton, Modal, PageTitle, Spinner, inputClass } from "@/components/ui";

type FormState = { mode: "create" } | { mode: "edit"; colaborador: Colaborador } | null;

export default function ColaboradoresPage() {
  const { data, error, reload } = useApiData<{ collaborators: Colaborador[]; currentUserId: string }>("/api/collaborators");
  const colaboradores = data?.collaborators ?? [];
  const currentUserId = data?.currentUserId ?? null;

  const [form, setForm] = useState<FormState>(null);
  const [toDelete, setToDelete] = useState<Colaborador | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const closeForm = useCallback(() => setForm(null), []);
  const closeConfirm = useCallback(() => {
    setToDelete(null);
    setDeleteError(null);
  }, []);

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await api(`/api/deletecollaborator?id=${toDelete.id}`, { method: "DELETE" });
      setToDelete(null);
      reload();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erro ao excluir.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageTitle
        title="Colaboradores"
        description="Pessoas com acesso ao dashboard."
        action={
          <Button onClick={() => setForm({ mode: "create" })}>
            <Plus className="size-4" /> Novo colaborador
          </Button>
        }
      />

      {error && <Alert>{error}</Alert>}

      {!data ? (
        !error && <Spinner />
      ) : (
        <div className="overflow-x-auto rounded-xl bg-surface shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Cargo</th>
                <th className="px-4 py-3"><span className="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">
                    {c.name} {c.id === currentUserId && <span className="text-xs font-normal text-muted">(você)</span>}
                  </td>
                  <td className="px-4 py-3 text-muted">{c.email}</td>
                  <td className="px-4 py-3">{c.position}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <IconButton label="Editar" onClick={() => setForm({ mode: "edit", colaborador: c })}>
                        <Pencil className="size-4" />
                      </IconButton>
                      {c.id !== currentUserId && (
                        <IconButton label="Excluir" className="hover:text-danger!" onClick={() => setToDelete(c)}>
                          <Trash2 className="size-4" />
                        </IconButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal title={form?.mode === "edit" ? "Editar colaborador" : "Novo colaborador"} open={form !== null} onClose={closeForm}>
        {form && (
          <ColaboradorForm
            key={form.mode === "edit" ? form.colaborador.id : "new"}
            colaborador={form.mode === "edit" ? form.colaborador : undefined}
            onCancel={closeForm}
            onSaved={() => {
              closeForm();
              reload();
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Excluir colaborador"
        message={<>Tem certeza que deseja excluir <strong>{toDelete?.name}</strong>? Essa pessoa perderá o acesso ao dashboard.</>}
        confirmLabel="Excluir"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onClose={closeConfirm}
      />
    </>
  );
}

function ColaboradorForm({
  colaborador,
  onCancel,
  onSaved,
}: {
  colaborador?: Colaborador;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const editing = colaborador !== undefined;
  const [name, setName] = useState(colaborador?.name ?? "");
  const [email, setEmail] = useState(colaborador?.email ?? "");
  const [position, setPosition] = useState(colaborador?.position ?? "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);

    const body = editing
      ? { id: colaborador.id, name, email, position, ...(password ? { password } : {}) }
      : { name, email, position, password };
    const found = fieldErrors(editing ? updateColaboradorSchema.safeParse(body) : createColaboradorSchema.safeParse(body));
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setLoading(true);
    try {
      await api(editing ? "/api/updatecollaborator" : "/api/createcollaborator", { method: editing ? "PUT" : "POST", body });
      onSaved();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Erro ao salvar.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="Nome" error={errors.name} hint="Mínimo de 6 caracteres.">
        {(id) => <input id={id} className={inputClass} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} autoFocus />}
      </Field>
      <Field label="E-mail" error={errors.email}>
        {(id) => (
          <input id={id} type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} autoComplete="off" />
        )}
      </Field>
      <Field label="Cargo" error={errors.position} hint="Ex.: Professora, Coordenador. Mínimo de 6 caracteres.">
        {(id) => <input id={id} className={inputClass} value={position} onChange={(e) => setPosition(e.target.value)} aria-invalid={!!errors.position} />}
      </Field>
      <Field
        label={editing ? "Nova senha (opcional)" : "Senha"}
        error={errors.password}
        hint={editing ? "Deixe em branco para manter a senha atual." : "Mínimo de 6 caracteres."}
      >
        {(id) => (
          <input
            id={id}
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!errors.password}
            autoComplete="new-password"
          />
        )}
      </Field>

      {serverError && <Alert>{serverError}</Alert>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>Salvar</Button>
      </div>
    </form>
  );
}
