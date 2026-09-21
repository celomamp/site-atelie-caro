// components/StorySection.tsx
import Link from "next/link";

export default function StorySection({ images }: { images: string[] }) {
  const shots = images.slice(0, 2);

  return (
    <section className="bg-blush">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
        <div>
          <p className="font-cursive text-lg text-magenta">Feito devagar, à mão</p>
          <h2 className="mt-1 font-display text-3xl text-ink md:text-4xl">
            Cada peça tem a sua história
          </h2>
          <p className="mt-4 leading-relaxed text-ink/80">
            Modelamos, esmaltamos e queimamos cada peça em alta temperatura, uma a
            uma. Por isso elas são irmãs, não gêmeas: pequenas variações de tom,
            textura e forma fazem parte do que torna cada criação única.
          </p>
          <p className="mt-3 leading-relaxed text-ink/80">
            Do barro ao acabamento, tudo passa pelas nossas mãos no ateliê, em Campinas.
          </p>
          <Link
            href="/sobre"
            className="mt-6 inline-block rounded border border-cobalt px-6 py-3 font-semibold text-cobalt hover:bg-white"
          >
            Conheça o ateliê
          </Link>
        </div>

        {shots.length > 0 && (
          <div className="grid grid-cols-2 items-start gap-4">
            {shots.map((src, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={src + i}
                src={src}
                alt="Peça do Ateliê Carô"
                className={`aspect-[3/4] w-full rounded-lg object-cover ${i === 1 ? "mt-8" : ""}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
