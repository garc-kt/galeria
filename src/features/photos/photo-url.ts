import type { Photo } from "@/db/schema";
import { absoluteUrl } from "@/lib/utils";

export function largestWidth(photo: Photo): number {
  return photo.widths.length > 0 ? photo.widths[photo.widths.length - 1] : 1280;
}

export function photoUrl(photo: Photo, width: number, extension: "avif" | "jpg" = "jpg"): string {
  const version = new Date(photo.updatedAt).getTime();
  return "/media/" + photo.id + "/" + width + "." + extension + "?v=" + version;
}

export function photoOgUrl(photo: Photo): string {
  const width = photo.widths.includes(1280) ? 1280 : largestWidth(photo);
  return absoluteUrl(photoUrl(photo, width, "jpg"));
}
