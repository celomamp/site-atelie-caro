// components/CardGallery.tsx
"use client";
import { useEffect, useState } from "react";
import { nextIndex, prevIndex } from "@/lib/images";

type Props = {
  images: string[];
  alt: string;
};

export default function CardGallery({ images, alt }: Props) {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [autoplayEpoch, setAutoplayEpoch] = useState(0);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!hovering || reducedMotion || images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => nextIndex(i, images.length));
    }, 2000);
    return () => clearInterval(id);
  }, [hovering, reducedMotion, images.length, autoplayEpoch]);

  if (images.length === 0) {
    return <div className="aspect-square bg-cream" />;
  }

  const many = images.length > 1;
  const current = images[Math.min(index, images.length - 1)];

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function restartAutoplay() {
    setAutoplayEpoch((n) => n + 1);
  }

  function goPrev() {
    setIndex((i) => prevIndex(i, images.length));
    restartAutoplay();
  }

  function goNext() {
    setIndex((i) => nextIndex(i, images.length));
    restartAutoplay();
  }

  return (
    <div
      className="relative aspect-square overflow-hidden bg-cream"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={current} alt={alt} className="h-full w-full object-cover" />
      {many && (
        <>
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={(e) => {
              stop(e);
              goPrev();
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
              goNext();
            }}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-sm leading-none shadow hover:bg-white"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
