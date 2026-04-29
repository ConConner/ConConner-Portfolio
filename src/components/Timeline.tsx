// app/components/Timeline.tsx
import { memo, type MouseEvent, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Item,
  ItemContent,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UnifiedTimelineItem } from "@/data/types";

interface TimelineProps {
  items: UnifiedTimelineItem[];
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

interface TimelineItemProps {
  item: UnifiedTimelineItem;
  side: "left" | "right";
  onClick?: (item: UnifiedTimelineItem) => void;
}

const TimelineEntry = memo(function TimelineEntry({
  item,
  side,
  onClick,
}: TimelineItemProps) {
  const clickable = item.source === "content";

  const handleClick = useCallback(() => {
    if (clickable) onClick?.(item);
  }, [clickable, onClick, item]);

  const card = (
    <TimelineCard
      item={item}
      align={side === "left" ? "right" : "left"}
      clickable={clickable}
      onClick={handleClick}
    />
  );

  return (
    <li className="relative grid grid-cols-[auto_1fr] items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
      <div
        className={cn(
          "hidden md:block md:pr-8",
          side === "left" ? "md:visible" : "md:invisible",
        )}
      >
        {side === "left" && card}
      </div>

      <div className="relative flex h-full w-4 items-center justify-center md:w-auto">
        <span aria-hidden className="absolute top-0 h-full w-px bg-border" />
        <span
          aria-hidden
          className="relative z-10 block h-3 w-3 rounded-full bg-primary ring-4 ring-background"
        />
      </div>

      <div
        className={cn("min-w-0", side === "right" ? "md:pl-8" : "md:hidden")}
      >
        {side === "right" ? card : <div className="md:hidden">{card}</div>}
      </div>
    </li>
  );
});

interface TimelineCardProps {
  item: UnifiedTimelineItem;
  align: "left" | "right";
  clickable: boolean;
  onClick: () => void;
}

function TimelineCardInner({
  item,
  align,
  clickable,
  onClick,
}: TimelineCardProps) {
  return (
    <Item
      variant="outline"
      onClick={clickable ? onClick : undefined}
      className={cn(
        "overflow-hidden p-0 transition-colors",
        clickable && "cursor-pointer hover:border-primary",
      )}
    >
      {item.image && (
        <ItemMedia className="m-0 aspect-video w-32 shrink-0 overflow-hidden bg-muted sm:w-40">
          <img
            src={item.image}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </ItemMedia>
      )}
      <ItemContent
        className={cn("gap-1 px-3 py-2", align === "right" && "md:text-right")}
      >
        <ItemHeader
          className={cn(
            "flex items-center gap-2",
            align === "right" && "md:justify-end",
          )}
        >
          <Badge variant="secondary">{formatDate(item.date)}</Badge>
          {item.source === "content" && (
            <Badge variant="outline">
              Project
            </Badge>
          )}
        </ItemHeader>
        <ItemTitle className="text-base leading-tight">{item.name}</ItemTitle>
      </ItemContent>
    </Item>
  );
}

const TimelineCardMemo = memo(TimelineCardInner);

function TimelineCard(props: TimelineCardProps) {
  const { item, align } = props;
  const hasDetails = Boolean(item.description || item.image);
  const [expanded, setExpanded] = useState(false);

  const handleToggle = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

  if (!hasDetails) return <TimelineCardMemo {...props} />;

  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div>
          <TimelineCardMemo {...props} />
        </div>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align={align === "right" ? "end" : "start"}
        className="w-80 p-0"
      >
        {item.image && (
          <div className="aspect-video w-full overflow-hidden rounded-t-md bg-muted">
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <div className="space-y-2 p-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{formatDate(item.date)}</Badge>
            {item.source === "content" && (
              <Badge variant="outline">Project</Badge>
            )}
          </div>
          <p className="text-sm font-medium leading-tight">{item.name}</p>
          {item.description && (
            <p
              className={cn(
                "text-xs text-muted-foreground",
                !expanded && "line-clamp-4",
              )}
            >
              {item.description}
            </p>
          )}
          {item.description && (
            <div className="flex justify-end pt-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleToggle}
                className="h-7 px-2 text-xs cursor-pointer"
              >
                {expanded ? "Show less" : "Read more"}
              </Button>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export const Timeline = memo(function Timeline({ items }: TimelineProps) {
  const navigate = useNavigate();

  const handleClick = useCallback(
    (item: UnifiedTimelineItem) => {
      if (item.source === "content" && item.contentId) {
        navigate(`/projects/${item.contentId}`);
      }
    },
    [navigate],
  );

  if (items.length === 0) {
    return (
      <p className="text-center text-muted-foreground">
        Nothing on the timeline yet.
      </p>
    );
  }

  return (
    <ol className="mx-auto flex max-w-4xl flex-col gap-6">
      {items.map((item, i) => (
        <TimelineEntry
          key={item.id}
          item={item}
          side={i % 2 === 0 ? "left" : "right"}
          onClick={handleClick}
        />
      ))}
    </ol>
  );
});
