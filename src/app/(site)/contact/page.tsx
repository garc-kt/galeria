import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { ContactForm } from "@/features/contact/components/contact-form";
import { PageHeader } from "@/components/shared/page-header";
import { contactEmail, instagramUrl } from "@/server/env";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com o estúdio sobre fotos, licenças e projetos.",
};

export default function ContactPage() {
  const instagram = instagramUrl();

  return (
    <>
      <PageHeader
        title="Escreva."
        description="Licenças comerciais, arquivos específicos, exposições ou uma conversa. Respondo em alguns dias."
      />

      <Container className="grid gap-12 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-7">
          <ContactForm />
        </div>

        <aside className="md:col-span-4 md:col-start-9">
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a className="underline underline-offset-4" href={"mailto:" + contactEmail()}>
                {contactEmail()}
              </a>
            </li>
            {instagram ? (
              <li>
                <a className="underline underline-offset-4" href={instagram} target="_blank" rel="noreferrer">
                  Instagram
                </a>
              </li>
            ) : null}
          </ul>

          <div className="mt-10 border-t border-line pt-4 text-xs leading-relaxed text-muted">
            <p>Atendimento em português.</p>
            <p className="mt-2">Brasil / America/Sao_Paulo</p>
          </div>
        </aside>
      </Container>
    </>
  );
}
