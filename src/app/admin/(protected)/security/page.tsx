import { PasswordForm } from "@/features/auth/components/password-form";
import { SecuritySetup } from "@/features/auth/components/security-setup";
import { getSessionUser } from "@/features/auth/server/session";
import { getAdminById } from "@/features/auth/server/queries";

export const dynamic = "force-dynamic";

export default async function AdminSecurityPage() {
  const session = await getSessionUser();
  const admin = session ? await getAdminById(session.id) : null;

  return (
    <div className="max-w-2xl">
      <div className="border-b border-line pb-5">
        <p className="eyebrow">Acesso</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Segurança</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Verificação em duas etapas (TOTP) protege o painel mesmo se a senha vazar.
        </p>
      </div>

      <div className="mt-8">
        {admin?.totpEnabled ? (
          <div className="border border-line p-5">
            <p className="text-sm font-medium">Verificação em duas etapas ativa.</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              No próximo login, o painel pedirá o código de 6 dígitos do aplicativo autenticador.
              Guarde o segredo em local seguro.
            </p>
          </div>
        ) : (
          <SecuritySetup />
        )}
      </div>

      <div className="mt-10 border-t border-line pt-8">
        <h2 className="font-display text-2xl tracking-tight">Trocar senha</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Use uma senha longa e única. Sessões já abertas continuam válidas até expirarem.
        </p>
        <div className="mt-5">
          <PasswordForm />
        </div>
      </div>
    </div>
  );
}
