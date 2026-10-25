"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Painel" },
  { href: "/admin/photos", label: "Fotos" },
  { href: "/admin/collections", label: "Coleções" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/security", label: "Segurança" },
];

export function AdminNav({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface">
      <Container className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-baseline gap-4">
          <Link href="/admin" className="font-display text-xl tracking-tight">Galeria</Link>
          <span className="hidden text-[11px] uppercase tracking-[0.16em] text-muted sm:inline">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden text-xs text-muted md:inline">{email}</span>
          <Link href="/" className="text-xs text-muted underline underline-offset-4 hover:text-fg" target="_blank">Ver site</Link>
          <button
            type="button"
            onClick={logout}
            disabled={pending}
            className="text-xs text-muted underline underline-offset-4 hover:text-fg disabled:opacity-50"
          >
            {pending ? "Saindo..." : "Sair"}
          </button>
        </div>
      </Container>
      <Container className="flex gap-6 overflow-x-auto border-t border-line py-3 text-sm">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 text-muted transition-colors duration-150 hover:text-fg",
                active && "text-fg underline underline-offset-4",
              )}
              aria-current={active ? "page" : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </Container>
    </header>
  );
}
