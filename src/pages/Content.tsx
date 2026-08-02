import { useMemo, useState } from "react";
import { getAllContent, getContentByType } from "../data/db";
import { ContentCard } from "../components/ContentCard";
import { Link, useNavigate } from "react-router-dom";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";

type FilterType = "all" | "hack" | "tool";

const filters: { label: string; value: FilterType }[] = [
  { label: "All", value: "all" },
  { label: "Games", value: "hack" },
  { label: "Tools", value: "tool" },
];

function Content() {
  const content = getAllContent();
  const allHacks = getContentByType("hack");
  const randomHack = allHacks[Math.floor(Math.random() * allHacks.length)];
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredContent = useMemo(
    () =>
      filter === "all" ? content : content.filter((item) => item.type === filter),
    [content, filter],
  );

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
            onClick={(item) => navigate(`/projects/${item.id}`)}
          />
        ))}
      </div>
    </div>
  );
}

export default Content;
