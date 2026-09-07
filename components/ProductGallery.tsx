// components/ProductGallery.tsx
"use client";
import { useState } from "react";
import { nextIndex, prevIndex } from "@/lib/images";

type Props = {
  images: string[];
  alt: string;
};

export default function ProductGallery({ images, alt }: Props) {
  const [index, setIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (images.length === 0) {
    return <div className="aspect-square overflow-hidden rounded-lg bg-cream" />;
  }

  const many = images.length > 1;
  const current = images[Math.min(index, images.length - 1)];

  function goPrev() {
    setIndex((i) => prevIndex(i, images.length));
  }

  function goNext() {
    setIndex((i) => nextIndex(i, images.length));
  }

  return (
    <div
      className="relative aspect-square overflow-hidden rounded-lg bg-cream focus:outline-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === "ArrowLeft") goPrev();
        if (e.key === "ArrowRight") goNext();
      }}
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX;
        if (many && Math.abs(delta) > 40) {
          if (delta < 0) goNext();
          else goPrev();
        }
        setTouchStartX(null);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current} alt={alt} className="h-full w-full object-cover" />
      {many && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-lg leading-none shadow hover:bg-white"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-2 text-lg leading-none shadow hover:bg-white"
          >
            ›
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((img, i) => (
              <button
                key={img + i}
                type="button"
                aria-label={`Ir para foto ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 w-2 rounded-full transition ${i === index ? "bg-cobalt" : "bg-white/80 hover:bg-white"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
