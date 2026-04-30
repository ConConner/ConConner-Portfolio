// app/components/ContentMetrics.tsx
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Gamepad2, Users, Wrench } from "lucide-react";
import type { ContentItem } from "@/data/types";

interface MetricCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
}

function MetricCard({ icon, value, label }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 text-primary">{icon}</div>
        <div className="text-3xl font-bold tracking-tight">
          {value.toLocaleString()}
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}

interface ContentMetricsProps {
  content: ContentItem[];
}

export function ContentMetrics({ content }: ContentMetricsProps) {
  const hackCount = content.filter((item) => item.type === "hack").length;
  const toolCount = content.filter((item) => item.type === "tool").length;
  const uniqueGames = new Set(content.map((item) => item.game).filter(Boolean))
    .size;
  const uniqueAuthors = new Set(content.flatMap((item) => item.authors)).size;
  const yearsActive = (() => {
    const dates = content
      .flatMap((item) => [item.date, ...item.downloads.map((d) => d.date)])
      .filter(Boolean)
      .map((d) => new Date(d!).getFullYear());
    if (dates.length === 0) return 0;
    return Math.max(...dates) - Math.min(...dates) + 1;
  })();

  return (
    <div className="mx-auto grid max-w-4xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <MetricCard
        icon={<Gamepad2 className="h-8 w-8" />}
        value={hackCount}
        label="ROM Hacks"
      />
      <MetricCard
        icon={<Wrench className="h-8 w-8" />}
        value={toolCount}
        label="Tools"
      />
      <MetricCard
        icon={<Calendar className="h-8 w-8" />}
        value={yearsActive}
        label="Years Active"
      />
      <MetricCard
        icon={<Gamepad2 className="h-8 w-8" />}
        value={uniqueGames}
        label="Across Games"
      />
      <MetricCard
        icon={<Users className="h-8 w-8" />}
        value={uniqueAuthors}
        label="Contributors"
      />
    </div>
  );
}
