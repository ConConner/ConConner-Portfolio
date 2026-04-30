// app/routes/home.tsx
import { memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ImageMarquee } from "@/components/ImageMarquee";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Timeline } from "@/components/Timeline";
import { getAllContent, getUnifiedTimeline } from "@/data/db";
import { ContentMetrics } from "@/components/ContentMetrics";

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

  const timelineItems = getUnifiedTimeline();
  const handleViewAll = useCallback(() => navigate("/projects"), [navigate]);

  return (
    <div className="flex flex-col items-center text-center">
      {/* Hero */}
      <section className="relative flex min-h-[81vh] w-full flex-col items-center justify-center px-6 py-24 md:px-12">
        <HeroBlobs />
        <div className="relative">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            ConConner's Crazy Content
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
        <Button size="lg" onClick={handleViewAll} className="mt-8">
          View All Projects
        </Button>
      </section>

      <Separator className="max-w-3xl" />

      {/* Quote */}
      <section className="px-6 py-48 md:px-12">
        <blockquote className="mx-auto max-w-2xl border-l-2 pl-6 text-left text-2xl italic text-muted-foreground">
          &quot;The last Metroid is in captivity. The galaxy is at peace...
          until someone decides to mod it.&quot;
        </blockquote>
      </section>

      <Separator className="max-w-3xl" />

      {/* Timeline & Metrics*/}
      <section className="w-full px-6 py-16 md:px-12 flex flex-col gap-8">
        <h2 className="text-3xl font-semibold">
          What I made, when and what I learned
        </h2>
        <ContentMetrics content={content} />
        <Timeline items={timelineItems} />
      </section>
    </div>
  );
}
