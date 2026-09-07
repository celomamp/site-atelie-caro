// components/CardGallery.tsx
"use client";
import { useState } from "react";
import { nextIndex, prevIndex } from "@/lib/images";

type Props = {
  images: string[];
  alt: string;
};

export default function CardGallery({ images, alt }: Props) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) {
    return <div className="aspect-square bg-cream" />;
  }

  const many = images.length > 1;
  const current = images[Math.min(index, images.length - 1)];

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  return (
    <div className="relative aspect-square overflow-hidden bg-cream">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current} alt={alt} className="h-full w-full object-cover" />
      {many && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={(e) => {
              stop(e);
              setIndex((i) => prevIndex(i, images.length));
            }}
            className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-sm leading-none shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            onClick={(e) => {
              stop(e);
              setIndex((i) => nextIndex(i, images.length));
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-sm leading-none shadow hover:bg-white"
          >
            ›
          </button>
          <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
            {images.map((img, i) => (
              <button
                key={img + i}
                type="button"
                aria-label={`Ir para foto ${i + 1}`}
                onClick={(e) => {
                  stop(e);
                  setIndex(i);
                }}
                className={`h-1.5 w-1.5 rounded-full transition ${i === index ? "bg-cobalt" : "bg-white/80 hover:bg-white"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
