import { Container } from "@/components/layout/container";

export default function SiteLoading() {
  return (
    <Container className="py-14 md:py-20">
      <div className="h-3 w-28 animate-pulse bg-line/70" />
      <div className="mt-6 h-12 w-3/4 animate-pulse bg-line/70 md:w-1/2" />
      <div className="mt-4 h-4 w-full max-w-md animate-pulse bg-line/50" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="aspect-[4/5] animate-pulse bg-line/50" />
        ))}
      </div>
    </Container>
  );
}
