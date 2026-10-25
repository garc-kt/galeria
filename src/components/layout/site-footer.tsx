import Link from "next/link";
import { Container } from "@/components/layout/container";
import { contactEmail, instagramUrl, siteName } from "@/server/env";

export function SiteFooter() {
  const instagram = instagramUrl();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line">
      <Container className="grid gap-10 py-14 md:grid-cols-12 md:py-16">
        <div className="md:col-span-6">
          <p className="font-serif text-sm uppercase leading-none tracking-[0.28em]">{siteName()}</p>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            Fotografia autoral, arquivo e edições digitais. Brasil.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block border-b border-line pb-1 text-[10px] uppercase tracking-[0.2em] transition-colors hover:border-fg"
          >
            Vamos conversar
          </Link>
        </div>

        <div className="md:col-span-3">
          <p className="text-[9px] uppercase tracking-[0.24em] text-muted">Navegar</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="text-muted transition-colors hover:text-fg" href="/collections">Coleções</Link></li>
            <li><Link className="text-muted transition-colors hover:text-fg" href="/store">Loja</Link></li>
            <li><Link className="text-muted transition-colors hover:text-fg" href="/about">Sobre</Link></li>
            <li><Link className="text-muted transition-colors hover:text-fg" href="/contact">Contato</Link></li>
          </ul>
        </div>

        <div className="md:col-span-3">
          <p className="text-[9px] uppercase tracking-[0.24em] text-muted">Contato</p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><a className="text-muted transition-colors hover:text-fg" href={"mailto:" + contactEmail()}>{contactEmail()}</a></li>
            {instagram ? (
              <li><a className="text-muted transition-colors hover:text-fg" href={instagram} rel="noreferrer" target="_blank">Instagram</a></li>
            ) : null}
            <li><Link className="text-muted transition-colors hover:text-fg" href="/privacy">Privacidade</Link></li>
            <li><Link className="text-muted transition-colors hover:text-fg" href="/terms">Termos e licenças</Link></li>
          </ul>
        </div>
      </Container>

      <Container className="flex flex-col gap-3 border-t border-line py-5 text-[9px] uppercase tracking-[0.2em] text-muted md:flex-row md:items-center md:justify-between">
        <span>© {year} {siteName()}. Todos os direitos reservados.</span>
        <div className="flex items-center gap-5">
          <span>Brasil</span>
          <span>BRL</span>
          <Link href="/admin" className="transition-colors hover:text-fg">Admin</Link>
        </div>
      </Container>
    </footer>
  );
}
