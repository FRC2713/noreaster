import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export type RobotImageTeam = {
  id: string;
  number: number;
  name: string;
  robot_image_url: string | null;
};

function deriveRobotsPath(publicUrl: string) {
  const marker = "/robots/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

export function RobotImage({
  team,
  className,
  ratio = 16/9,
}: {
  team: RobotImageTeam;
  className?: string;
  ratio?: number;
}) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const raw = team.robot_image_url;
      if (!raw) {
        setSrc(null);
        return;
      }
      const path = deriveRobotsPath(raw);
      if (path) {
        const { data } = await supabase.storage.from("robots").createSignedUrl(path, 60 * 60);
        if (!cancelled) setSrc(data?.signedUrl ?? raw);
      } else {
        setSrc(raw);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [team.robot_image_url]);

  return (
    <AspectRatio ratio={ratio} className={className}>
      {src ? (
        <img src={src} alt={`${team.number} ${team.name}`} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full grid place-items-center bg-muted">
          <div className="text-2xl font-semibold">{team.number}</div>
        </div>
      )}
    </AspectRatio>
  );
}