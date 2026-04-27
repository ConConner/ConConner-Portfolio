import { getAllContent } from "../data/db";
import { ContentCard } from "../components/ContentCard";
import { useNavigate } from "react-router-dom";

function Content() {
  const content = getAllContent();
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {content.map((item) => (
        <ContentCard
          key={item.id}
          item={item}
          onClick={(item) => navigate(`/projects/${item.id}`)}
        />
      ))}
    </div>
  );
}

export default Content;
