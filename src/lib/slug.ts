export function slugify(input: string): string {
  const slug = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "foto";
}

export function slugWithSuffix(title: string, suffix: string): string {
  return slugify(title) + "-" + suffix.slice(0, 6).toLowerCase();
}
