import { memo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContentItem } from "@/data/types";

interface ContentCardProps {
  item: ContentItem;
  /** Route to open. Rendered as a real anchor rather than a click handler so
   *  crawlers can follow it and the usual middle-click/open-in-new-tab works. */
  href?: string;
}

export const ContentCard = memo(function ContentCard({
  item,
  href,
}: ContentCardProps) {
  const previewImage = item.images[0];

  const card = (
    <Card
      className={[
        "group flex h-full flex-col overflow-hidden border-border/60",
        "transition-all duration-200",
        href &&
        "cursor-pointer hover:border-border hover:shadow-md hover:-translate-y-0.5",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-muted to-muted/60">
        {previewImage
          ? (
            <img
              src={previewImage}
              alt={item.name}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )
          : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No preview
            </div>
          )}
      </div>

      <CardHeader className="p-4 pb-0">
        <div className="flex h-10 items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 flex-1 text-left text-base leading-tight">
            {item.name}
          </CardTitle>
          <Badge variant="secondary" className="mt-0.5 shrink-0">
            {item.type}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2 text-left">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {item.description}
        </p>
      </CardContent>

      <CardFooter className="mt-auto p-4 pt-0 text-left">
        {item.authors.length > 0 && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            by{" "}
            <span className="text-foreground/80">
              {item.authors.join(", ")}
            </span>
          </p>
        )}
      </CardFooter>
    </Card>
  );

  if (!href) return card;

  return (
    <Link
      to={href}
      aria-label={item.name}
      className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {card}
    </Link>
  );
});
