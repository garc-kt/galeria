"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Dialog } from "radix-ui";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/utils";

const links = [
  { href: "/collections", label: "Coleções" },
  { href: "/store", label: "Loja" },
  { href: "/about", label: "Sobre" },
  { href: "/contact", label: "Contato" },
];

export function SiteHeader({ name }: { name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/95 backdrop-blur">
      <Container className="relative flex h-20 items-center justify-between gap-6">
        <Link
          href="/"
          className="font-serif text-sm uppercase leading-none tracking-[0.28em]"
          onClick={() => setOpen(false)}
        >
          {name}
        </Link>

        <nav
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex"
          aria-label="Principal"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname.startsWith(link.href) ? "page" : undefined}
              className={cn(
                "text-[10px] uppercase tracking-[0.2em] text-muted transition-colors duration-150 hover:text-fg",
                pathname.startsWith(link.href) && "text-fg",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center border border-line md:hidden"
          aria-label="Abrir menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-4 w-4" aria-hidden />
        </button>
      </Container>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-line bg-bg p-6">
            <div className="flex items-center justify-between">
              <Dialog.Title className="font-serif text-sm uppercase tracking-[0.28em]">{name}</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center border border-line"
                  aria-label="Fechar menu"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </Dialog.Close>
            </div>

            <nav className="mt-14 flex flex-col" aria-label="Menu">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-line py-4 font-serif text-3xl uppercase tracking-[0.04em] hover:italic"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <p className="mt-auto border-t border-line pt-6 text-xs text-muted">
              Fotografia autoral, Brasil
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </header>
  );
}
