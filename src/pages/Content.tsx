import { useMemo, useState } from "react";
import { getAllContent, getContentByType } from "../data/db";
import { ContentCard } from "../components/ContentCard";
import { Link } from "react-router-dom";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SITE_URL, useSeo } from "@/lib/seo";

type FilterType = "all" | "hack" | "tool" | "project";

const filters: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Games", value: "hack" },
  { label: "Tools", value: "tool" },
  { label: "Other", value: "project" },
];

function Content() {
  const content = getAllContent();
  const allHacks = getContentByType("hack");
  const randomHack = allHacks[Math.floor(Math.random() * allHacks.length)];
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredContent = useMemo(
    () =>
      filter === "all" ? content : content.filter((item) => item.type === filter),
    [content, filter],
  );

  // The filter lives in component state rather than the URL, so there is a
  // single canonical /projects listing an ItemList of every project.
  useSeo({
    title: "Projects",
    description:
      `All ${content.length} projects — Metroid ROM hacks, the tools built ` +
      "to make them, and assorted experiments.",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Projects",
      numberOfItems: content.length,
      itemListElement: content.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `${SITE_URL}/projects/${item.id}`,
        name: item.name,
      })),
    },
  });

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex flex-row items-center justify-between gap-2">
        <Button asChild>
          <Link to={`/projects/${randomHack.id}`}>
            <Dices /> Random Hack
          </Link>
        </Button>
        <div className="flex flex-row gap-2">
          {filters.map(({ label, value }) => (
            <Button
              key={value}
              variant={filter === value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredContent.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            href={`/projects/${item.id}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Content;
