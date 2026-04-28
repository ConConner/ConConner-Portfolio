import { ImageMarquee } from "@/components/ImageMarquee";
import Patcher from "@/components/Patcher";
import { getContentByType } from "@/data/db";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useCallback } from "react";

export default function PatcherPage() {
  const [searchParams] = useSearchParams();
  const { hackId } = useParams<{ hackId: string }>();
  const patchPath = searchParams.get("path");
  const otherHacks = getContentByType("hack");
  const navigate = useNavigate();

  const handleImageClick = useCallback(
    (itemId: string) => navigate(`/projects/${itemId}`),
    [navigate],
  );

  return (
    <div className="flex flex-col gap-2">
      <Patcher hackId={hackId} patchPath={patchPath} />

      <span className="text-muted-foreground text-center">
        Also try these hacks...
      </span>
      <ImageMarquee
        items={otherHacks}
        speed={1000}
        pauseOnHover
        onImageClick={handleImageClick}
      />
    </div>
  );
}
