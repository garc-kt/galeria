"use client";

import Link from "next/link";
import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import type { Photo } from "@/db/schema";
import { PhotoPicture } from "@/features/photos/components/photo-picture";
import { formatBRL } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Gallery({
  photos,
  columns = 3,
  sizes,
  mode = "lightbox",
}: {
  photos: Photo[];
  columns?: 2 | 3;
  sizes?: string;
  mode?: "lightbox" | "link";
}) {
  const [index, setIndex] = useState(-1);

  const slides = photos.map((photo) => {
    const width = photo.widths.length > 0 ? photo.widths[photo.widths.length - 1] : 1280;
    const version = new Date(photo.updatedAt).getTime();
    return {
      src: "/media/" + photo.id + "/" + width + ".jpg?v=" + version,
      width: photo.width,
      height: photo.height,
      alt: photo.alt,
      title: photo.title,
      description: photo.description ?? undefined,
    };
  });

  return (
    <>
      <div className={cn("columns-1 gap-6 sm:columns-2", columns === 3 && "lg:columns-3")}>
        {photos.map((photo, photoIndex) => (
          <figure key={photo.id} className="mb-8 break-inside-avoid">
            {mode === "link" ? (
              <Link
                href={"/photos/" + photo.slug}
                className="group block w-full"
                aria-label={"Comprar " + photo.title}
              >
                <PhotoPicture
                  photo={photo}
                  sizes={sizes ?? (columns === 3 ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 50vw, 100vw")}
                  className="transition-opacity duration-200 group-hover:opacity-90"
                />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setIndex(photoIndex)}
                className="group block w-full text-left"
                aria-label={"Ampliar " + photo.title}
              >
                <PhotoPicture
                  photo={photo}
                  sizes={sizes ?? (columns === 3 ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 640px) 50vw, 100vw")}
                  className="transition-opacity duration-200 group-hover:opacity-90"
                />
              </button>
            )}
            <figcaption className="mt-2 flex items-baseline justify-between gap-4 border-t border-line pt-2">
              <Link
                href={"/photos/" + photo.slug}
                className="text-[10px] uppercase tracking-[0.12em] underline-offset-4 hover:underline"
              >
                {photo.title}
              </Link>
              {photo.priceCents > 0 ? (
                <Link
                  href={"/photos/" + photo.slug}
                  className="shrink-0 text-xs tabular text-muted transition-colors hover:text-accent"
                >
                  {formatBRL(photo.priceCents)}{" "}
                  <span className="ml-1.5 text-accent">Comprar</span>
                </Link>
              ) : (
                <span className="shrink-0 text-[10px] tabular text-muted">
                  {new Date(photo.createdAt).getFullYear()}
                </span>
              )}
            </figcaption>
          </figure>
        ))}
      </div>

      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={Math.max(0, index)}
        slides={slides}
        plugins={[Captions, Counter, Thumbnails, Zoom]}
        on={{ view: ({ index: current }) => setIndex(current) }}
        carousel={{ finite: true }}
        animation={{ fade: 150, swipe: 200 }}
        zoom={{ maxZoomPixelRatio: 2 }}
        thumbnails={{ position: "bottom", width: 72, height: 54, border: 0, gap: 6 }}
        captions={{ descriptionTextAlign: "center" }}
        counter={{ container: { style: { top: "unset", bottom: 0 } } }}
      />
    </>
  );
}
