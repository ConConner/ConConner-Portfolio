import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { ContentItem } from "@/data/types";

interface ImageMarqueeProps {
  items: ContentItem[];
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
  onImageClick?: (itemId: string) => void;
}

interface ImageWithItem {
  src: string;
  itemId: string;
  itemName: string;
}

const TRACK_REPEATS = 4;

export function ImageMarquee({
  items,
  speed = 30,
  pauseOnHover = true,
  className,
  onImageClick,
}: ImageMarqueeProps) {
  const images = useMemo<ImageWithItem[]>(() => {
    const all = items.flatMap((item) =>
      item.images.filter(Boolean).map((src) => ({
        src,
        itemId: item.id,
        itemName: item.name,
      }))
    );
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
  }, [items]);

  const track = useMemo(
    () => Array.from({ length: TRACK_REPEATS }).flatMap(() => images),
    [images],
  );

  if (images.length === 0) return null;

  const isInteractive = Boolean(onImageClick);

  return (
    <div
      className={cn(
        "overflow-hidden",
        "[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]",
        className,
      )}
    >
      <div
        className={cn(
          "marquee-animation flex w-max gap-4 motion-reduce:[animation:none]",
          pauseOnHover && "marquee-pauseable",
        )}
        style={{ "--duration": `${speed}s` } as React.CSSProperties}
      >
        {track.map(({ src, itemId, itemName }, idx) => {
          const content = (
            <>
              <img
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0",
                  "bg-gradient-to-t from-black/80 to-transparent",
                  "px-3 pb-2 pt-6 opacity-0 transition-opacity duration-200",
                  "group-hover:opacity-100 group-focus-visible:opacity-100",
                  "motion-reduce:transition-none",
                )}
              >
                <p className="truncate text-xs font-medium text-white">
                  {itemName}
                </p>
              </div>
            </>
          );

          const baseClasses = cn(
            "group relative aspect-video w-64 shrink-0 overflow-hidden",
            "bg-muted",
          );

          if (isInteractive) {
            return (
              <button
                key={`${src}-${idx}`}
                type="button"
                aria-label={itemName}
                onClick={() => onImageClick?.(itemId)}
                className={cn(
                  baseClasses,
                  "cursor-pointer focus-visible:outline-none",
                  "focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                {content}
              </button>
            );
          }

          return (
            <div key={`${src}-${idx}`} className={baseClasses}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
