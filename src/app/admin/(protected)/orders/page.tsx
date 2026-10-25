import { RefundButton } from "@/features/admin/components/refund-button";
import { ResendButton } from "@/features/admin/components/resend-button";
import { formatBRL } from "@/lib/money";
import { listOrders } from "@/features/orders/server/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function statusLabel(status: string): string {
  if (status === "paid") return "Pago";
  if (status === "refunded") return "Reembolsado";
  if (status === "failed") return "Falhou";
  return "Pendente";
}

export default async function AdminOrdersPage() {
  const rows = await listOrders(100);

  return (
    <div>
      <div className="border-b border-line pb-5">
        <p className="eyebrow">Loja</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight">Pedidos</h1>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Pagamentos processados pelo Mercado Pago. Reembolso devolve o valor e encerra o acesso.
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 text-sm text-muted">Nenhum pedido ainda.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-line text-[11px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="py-3 pr-4 font-normal">Data</th>
                <th className="py-3 pr-4 font-normal">Foto</th>
                <th className="py-3 pr-4 font-normal">Comprador</th>
                <th className="py-3 pr-4 font-normal">Licença</th>
                <th className="py-3 pr-4 font-normal">Valor</th>
                <th className="py-3 pr-4 font-normal">Status</th>
                <th className="py-3 font-normal">Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ order, photoTitle, photoSlug }) => (
                <tr key={order.id} className="border-b border-line align-top">
                  <td className="py-3 pr-4 text-muted">{formatDate(order.createdAt, true)}</td>
                  <td className="py-3 pr-4">
                    <p>{photoTitle}</p>
                    <p className="font-mono text-[11px] text-muted">/{photoSlug}</p>
                  </td>
                  <td className="py-3 pr-4">
                    <p>{order.buyerName ?? "—"}</p>
                    <p className="text-[11px] text-muted">{order.buyerEmail}</p>
                  </td>
                  <td className="py-3 pr-4 text-muted">{order.license === "commercial" ? "Comercial" : "Pessoal"}</td>
                  <td className="py-3 pr-4">{formatBRL(order.amountCents)}</td>
                  <td className="py-3 pr-4">
                    <span className="border border-line px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-muted">
                      {statusLabel(order.status)}
                    </span>
                    {order.providerPaymentId ? (
                      <p className="mt-1 font-mono text-[10px] text-muted">MP {order.providerPaymentId}</p>
                    ) : null}
                  </td>
                  <td className="py-3">
                    {order.status === "paid" ? (
                      <div className="flex flex-col gap-2">
                        <ResendButton id={order.id} />
                        <RefundButton id={order.id} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
