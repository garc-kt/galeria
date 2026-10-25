import { AdminNav } from "@/features/admin/components/admin-nav";
import { Container } from "@/components/layout/container";
import { requireAdmin } from "@/features/auth/server/guard";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div>
      <AdminNav email={user.email} />
      <main className="pb-20">
        <Container className="py-8 md:py-10">{children}</Container>
      </main>
    </div>
  );
}
