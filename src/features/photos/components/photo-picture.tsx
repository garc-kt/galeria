import type { Photo } from "@/db/schema";
import { cn } from "@/lib/utils";

type Props = {
  photo: Photo;
  sizes?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  cropClassName?: string;
};

function srcSetFor(photo: Photo, extension: "avif" | "jpg"): string {
  const version = new Date(photo.updatedAt).getTime();
  const widths = photo.widths.length > 0 ? photo.widths : [1280];
  return widths
    .map((width) => "/media/" + photo.id + "/" + width + "." + extension + "?v=" + version + " " + width + "w")
    .join(", ");
}

export function PhotoPicture({ photo, sizes, priority = false, className, imgClassName, cropClassName }: Props) {
  const version = new Date(photo.updatedAt).getTime();
  const widths = photo.widths.length > 0 ? photo.widths : [1280];
  const fallback = widths.includes(1280) ? 1280 : widths[widths.length - 1];

  return (
    <div
      className={cn("relative overflow-hidden bg-line/40", cropClassName, className)}
      style={{
        aspectRatio: cropClassName ? undefined : photo.width + " / " + photo.height,
        backgroundImage: photo.blurDataUrl ? "url(" + photo.blurDataUrl + ")" : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <picture>
        <source type="image/avif" srcSet={srcSetFor(photo, "avif")} sizes={sizes} />
        <source type="image/jpeg" srcSet={srcSetFor(photo, "jpg")} sizes={sizes} />
        <img
          src={"/media/" + photo.id + "/" + fallback + ".jpg?v=" + version}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          className={cn("absolute inset-0 h-full w-full object-cover", imgClassName)}
        />
      </picture>
    </div>
  );
}
