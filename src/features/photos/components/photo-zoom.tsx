"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import type { Photo } from "@/db/schema";
import { PhotoPicture } from "@/features/photos/components/photo-picture";

export function PhotoZoom({ photo, sizes }: { photo: Photo; sizes: string }) {
  const [open, setOpen] = useState(false);
  const width = photo.widths.length > 0 ? photo.widths[photo.widths.length - 1] : 1280;
  const version = new Date(photo.updatedAt).getTime();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group block w-full cursor-zoom-in text-left"
        aria-label={"Ampliar " + photo.title}
      >
        <PhotoPicture
          photo={photo}
          priority
          sizes={sizes}
          className="transition-opacity duration-200 group-hover:opacity-95"
        />
      </button>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        slides={[
          {
            src: "/media/" + photo.id + "/" + width + ".jpg?v=" + version,
            width: photo.width,
            height: photo.height,
            alt: photo.alt,
            title: photo.title,
            description: photo.description ?? undefined,
          },
        ]}
        plugins={[Captions, Zoom]}
        carousel={{ finite: true }}
        animation={{ fade: 150 }}
        zoom={{ maxZoomPixelRatio: 3 }}
        captions={{ descriptionTextAlign: "center" }}
      />
    </>
  );
}
