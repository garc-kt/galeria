"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body style={{ background: "#f7f7f5", color: "#0e0e0e", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <h1 style={{ fontSize: 32, margin: 0 }}>Algo saiu do lugar.</h1>
            <p style={{ color: "#5f5f5a", marginTop: 12 }}>Recarregue a página para tentar de novo.</p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 24, padding: "12px 20px", background: "#2f5d50", color: "#f7f7f5", border: 0 }}
            >
              Tentar de novo
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
