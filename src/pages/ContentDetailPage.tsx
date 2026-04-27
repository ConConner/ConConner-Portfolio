import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Calendar, Download, Gamepad2, Users, Wand2 } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import type { ContentItem, Download as DL, Game } from "@/data/types";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/plugins/thumbnails.css";

interface ContentDetailPageProps {
  item: ContentItem;
  game?: Game;
  onDownload?: (path: string) => void;
}

export function ContentDetailPage({
  item,
  game,
  onDownload,
}: ContentDetailPageProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  const slides = useMemo(
    () => item.images.map((src) => ({ src })),
    [item.images],
  );

  const latestDownload = useMemo<DL | undefined>(() => {
    if (item.downloads.length === 0) return undefined;
    return [...item.downloads].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )[0];
  }, [item.downloads]);

  const isHack = item.type.toLowerCase() === "hack";

  const handleDownload = useCallback(
    (path: string) => onDownload?.(path),
    [onDownload],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">{item.type}</Badge>
          <Badge variant="outline">{item.game}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {item.name}
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {item.authors.join(", ")}
          </span>
          {game && (
            <span className="flex items-center gap-1">
              <Gamepad2 className="h-4 w-4" />
              {game.name} ({game.console})
            </span>
          )}
        </div>
      </div>

      {/* Image Gallery */}
      {item.images.length > 0 && (
        <>
          <ScrollArea className="w-full whitespace-nowrap  border">
            <div className="flex w-max space-x-4 p-4">
              {item.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="shrink-0 overflow-hidden"
                >
                  <img
                    src={src}
                    alt={`${item.name} screenshot ${i + 1}`}
                    loading="lazy"
                    className="h-48 w-auto object-cover transition-transform hover:scale-105"
                  />
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
          <Lightbox
            open={lightboxIndex >= 0}
            index={lightboxIndex}
            close={() => setLightboxIndex(-1)}
            slides={slides}
            plugins={[Zoom, Thumbnails]}
            controller={{ closeOnBackdropClick: true }}
            zoom={{
              maxZoomPixelRatio: 3,
              zoomInMultiplier: 2,
              doubleTapDelay: 300,
              doubleClickDelay: 300,
              scrollToZoom: true,
            }}
            thumbnails={{
              position: "bottom",
              width: 120,
              height: 80,
              border: 1,
              borderRadius: 4,
              padding: 4,
              gap: 16,
              showToggle: true,
            }}
          />
        </>
      )}

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="leading-relaxed whitespace-pre-wrap">
            {item.description}
          </p>
        </CardContent>
      </Card>

      {/* Game Info */}
      {game && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Game Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <dt className="text-muted-foreground">Name</dt>
                <dd className="font-medium">{game.name}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">Console</dt>
                <dd className="font-medium">{game.console}</dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">SHA-1</dt>
                <dd className="font-mono text-xs break-all">
                  {game["SHA-1"]}
                </dd>
              </div>
              <div className="min-w-0">
                <dt className="text-muted-foreground">CRC32</dt>
                <dd className="font-mono text-xs break-all">
                  {game.CRC32}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      {/* Latest Release */}
      {latestDownload && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Download className="h-5 w-5" />
              Latest Release
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium">{latestDownload.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {latestDownload.date}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleDownload(latestDownload.path)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                {isHack && (
                  <Button variant="outline" asChild>
                    <Link
                      to={`/patch/${item.id}?path=${
                        encodeURIComponent(
                          latestDownload.path,
                        )
                      }`}
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      Patch online
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Downloads */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            All Downloads
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {item.downloads.map((dl) => (
            <DownloadRow
              key={dl.path}
              download={dl}
              itemId={item.id}
              showPatch={isHack}
              onDownload={handleDownload}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

interface DownloadRowProps {
  download: DL;
  itemId: string;
  showPatch: boolean;
  onDownload: (path: string) => void;
}

const DownloadRow = ({
  download,
  itemId,
  showPatch,
  onDownload,
}: DownloadRowProps) => {
  return (
    <div className="flex items-center justify-between gap-2  border p-3">
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium">{download.name}</p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {download.date}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button size="icon" onClick={() => onDownload(download.path)}>
          <Download className="h-4 w-4" />
        </Button>
        {showPatch && (
          <Button
            size="icon"
            variant="outline"
            aria-label="Patch online"
            asChild
          >
            <Link
              to={`/patch/${itemId}?path=${
                encodeURIComponent(
                  download.path,
                )
              }`}
            >
              <Wand2 className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};
