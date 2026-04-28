// app/routes/home.tsx
import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ImageMarquee } from "@/components/ImageMarquee";
import { getAllContent } from "@/data/db";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const TIMELINE_YEARS = [2024, 2023, 2022] as const;

const HeroBlobs = memo(function HeroBlobs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-y-visible overflow-clip">
      <div className="absolute -left-1/4 -top-1/4 h-150 w-150 animate-pulse rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-1/4 bottom-0 h-100 w-125 animate-pulse rounded-full bg-accent/25 blur-3xl [animation-delay:1s]" />
    </div>
  );
});

export default function Home() {
  const navigate = useNavigate();
  const content = getAllContent();

  const handleImageClick = useCallback(
    (itemId: string) => navigate(`/projects/${itemId}`),
    [navigate],
  );

  const handleViewAll = useCallback(() => navigate("/projects"), [navigate]);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Hero */}
      <section className="relative flex min-h-[81vh] w-full flex-col items-center justify-center px-6 py-24 md:px-12">
        <HeroBlobs />
        <div className="relative">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            ConConners Crazy Content
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground md:text-xl">
            Metroid-inspired projects, experiments, and things built along the
            way.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="px-6 py-16 md:px-12">
        <p className="mx-auto max-w-2xl text-muted-foreground">
          A collection of work spanning hacks, tools, and random experiments.
          Mostly Metroid. Always curious.
        </p>
      </section>

      {/* Marquee */}
      <section className="w-full py-8">
        <ImageMarquee
          items={content}
          speed={1000}
          pauseOnHover
          onImageClick={handleImageClick}
        />
      </section>

      {/* Projects Button */}
      <section className="px-6 py-8 md:px-12">
        <Button size="lg" onClick={handleViewAll}>
          View All Projects
        </Button>
      </section>

      <Separator className="max-w-3xl" />

      {/* Quote */}
      <section className="px-6 py-24 md:px-12">
        <blockquote className="mx-auto max-w-2xl border-l-2 pl-6 text-left text-xl italic text-muted-foreground">
          &quot;The last Metroid is in captivity. The galaxy is at peace...
          until someone decides to mod it.&quot;
        </blockquote>
      </section>

      {/* Timeline */}
      <section className="px-6 py-16 md:px-12">
        <h2 className="mb-12 text-2xl font-semibold">Timeline</h2>
        <ol className="relative mx-auto max-w-2xl border-l pl-8 text-left">
          {TIMELINE_YEARS.map((year) => (
            <li key={year} className="relative mb-10 last:mb-0">
              <span
                aria-hidden
                className="absolute -left-[2.1rem] top-1.5 h-3 w-3 rounded-full bg-primary"
              />
              <span className="text-sm font-medium text-muted-foreground">
                {year}
              </span>
              <p className="mt-1">Project or milestone placeholder</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
