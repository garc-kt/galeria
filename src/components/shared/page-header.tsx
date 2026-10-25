import { Container } from "@/components/layout/container";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <section className="border-b border-line">
      <Container className="py-16 md:py-24">
        <h1 className="max-w-4xl text-balance font-display text-5xl uppercase leading-[1.0] tracking-[-0.02em] md:text-6xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-lg text-sm leading-7 text-muted">{description}</p>
        ) : null}
      </Container>
    </section>
  );
}
