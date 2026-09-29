"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, KeyRound, ListChecks, LogOut, Menu, Users, X } from "lucide-react";
import { api } from "@/lib/api";

const NAV = [
  { href: "/dashboard/alunos", label: "Alunos", icon: GraduationCap },
  { href: "/dashboard/perguntas", label: "Perguntas", icon: ListChecks },
  { href: "/dashboard/colaboradores", label: "Colaboradores", icon: Users },
];

const itemClass = "flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left transition-colors";

export default function DashboardShell({
  user,
  children,
}: {
  user: { name: string; position: string };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);

  async function signOut() {
    setLeaving(true);
    try {
      await api("/api/unsigned", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      {/* Barra superior só no celular */}
      <div className="flex h-14 items-center justify-between bg-sidebar px-4 text-white md:hidden">
        <span className="truncate font-medium">{user.name}</span>
        <button onClick={() => setMenuOpen((v) => !v)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} className="rounded-md p-1.5 hover:bg-sidebar-item">
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Sidebar: usuário no topo, navegação e Sair no rodapé */}
      <aside
        className={`${menuOpen ? "flex" : "hidden"} fixed inset-x-0 bottom-0 top-14 z-30 flex-col bg-sidebar px-2 pb-3 text-sidebar-foreground md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0`}
      >
        <div className="hidden px-4 pb-14 pt-7 md:block">
          <p className="truncate text-lg text-white" title={user.name}>{user.name}</p>
          <p className="truncate text-[11px]" title={user.position}>{user.position}</p>
        </div>

        <nav className="mt-4 flex flex-col gap-1.5 md:mt-0">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`${itemClass} ${active ? "bg-sidebar-active text-white" : "bg-sidebar-item hover:bg-sidebar-item-hover"}`}
              >
                <Icon className="size-5 shrink-0" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-1.5">
          <Link
            href="/dashboard/senha"
            onClick={() => setMenuOpen(false)}
            className={`${itemClass} text-sm ${pathname.startsWith("/dashboard/senha") ? "bg-sidebar-active text-white" : "hover:bg-sidebar-item"}`}
          >
            <KeyRound className="size-4 shrink-0" /> Alterar senha
          </Link>
          <button onClick={signOut} disabled={leaving} className={`${itemClass} bg-sidebar-item hover:bg-sidebar-item-hover disabled:opacity-60`}>
            <LogOut className="size-5 shrink-0" /> Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
