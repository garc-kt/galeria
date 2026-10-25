import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";
import { formatBRL } from "@/lib/money";
import { getDashboardStats } from "@/features/admin/server/queries";
import { listOrders } from "@/features/orders/server/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function statusLabel(status: string): string {
  if (status === "paid") return "Pago";
  if (status === "refunded") return "Reembolsado";
  if (status === "failed") return "Falhou";
  return "Pendente";
}

export default async function AdminDashboardPage() {
  const [stats, recent] = await Promise.all([getDashboardStats(), listOrders(6)]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
        <div>
          <p className="eyebrow">Painel</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">Arquivo</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/photos/new" className={buttonClasses("primary", "sm")}>Nova foto</Link>
          <Link href="/admin/collections" className={buttonClasses("secondary", "sm")}>Coleções</Link>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-5">
        {[
          ["Fotos", String(stats.photos)],
          ["Publicadas", String(stats.published)],
          ["Pedidos pagos", String(stats.orders)],
          ["Receita", formatBRL(stats.revenue)],
          ["Entregas falhas", String(stats.failedDeliveries)],
        ].map(([label, value]) => (
          <div key={label} className="bg-surface p-5">
            <dt className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</dt>
            <dd className={label === "Entregas falhas" && stats.failedDeliveries > 0 ? "mt-2 font-display text-3xl tracking-tight text-red-700" : "mt-2 font-display text-3xl tracking-tight"}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 flex items-end justify-between border-b border-line pb-4">
        <h2 className="font-display text-2xl tracking-tight">Pedidos recentes</h2>
        <Link href="/admin/orders" className="text-xs text-muted underline underline-offset-4 hover:text-fg">Ver todos</Link>
      </div>

      {recent.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nenhum pedido ainda.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="py-3 pr-4 font-normal">Data</th>
                <th className="py-3 pr-4 font-normal">Foto</th>
                <th className="py-3 pr-4 font-normal">Comprador</th>
                <th className="py-3 pr-4 font-normal">Valor</th>
                <th className="py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(({ order, photoTitle }) => (
                <tr key={order.id} className="border-b border-line">
                  <td className="py-3 pr-4 text-muted">{formatDate(order.createdAt, true)}</td>
                  <td className="py-3 pr-4">{photoTitle}</td>
                  <td className="py-3 pr-4 text-muted">{order.buyerEmail}</td>
                  <td className="py-3 pr-4">{formatBRL(order.amountCents)}</td>
                  <td className="py-3">{statusLabel(order.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
