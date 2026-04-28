import { getAllContent, getContentByType } from "../data/db";
import { ContentCard } from "../components/ContentCard";
import { Link, useNavigate } from "react-router-dom";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";

function Content() {
  const content = getAllContent();
  const allHacks = getContentByType("hack");
  const randomHack = allHacks[Math.floor(Math.random() * allHacks.length)];
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2 mt-2">
      <div className="flex flex-row">
        <Button asChild>
          <Link to={`/projects/${randomHack.id}`}>
            <Dices /> Random Hack
          </Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {content.map((item) => (
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
