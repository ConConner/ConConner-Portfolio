// pages/ContentDetailRoute.tsx
import { Navigate, useParams } from "react-router-dom";
import { ContentDetailPage } from "@/pages/ContentDetailPage";
import type { ContentItem, Game } from "@/data/types";

interface ContentDetailRouteProps {
  content: ContentItem[];
  games: Record<string, Game>;
}

export function ContentDetailRoute(
  { content, games }: ContentDetailRouteProps,
) {
  const { id } = useParams<{ id: string }>();

  const item = content.find((c) => c.id === id);
  const game = item?.game ? games[item.game] : undefined;

  if (!item) {
    return <Navigate to="/" replace />;
  }

  return (
    <ContentDetailPage
      item={item}
      game={game}
      onDownload={(path) => window.open(path, "_blank")}
    />
  );
}
