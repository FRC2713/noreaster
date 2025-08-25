import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import type { RobotImageTeam } from "@/types";

// Cache for signed URLs with expiration tracking
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

function deriveRobotsPath(publicUrl: string) {
  const marker = "/robots/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return publicUrl.slice(idx + marker.length);
}

async function getSignedUrl(robotImageUrl: string): Promise<string | null> {
  const path = deriveRobotsPath(robotImageUrl);
  if (!path) return robotImageUrl;

  // Check if we have a cached URL that's still valid
  const cached = signedUrlCache.get(robotImageUrl);
  const now = Date.now();
  
  if (cached && cached.expiresAt > now + 60000) { // 1 minute buffer
    return cached.url;
  }

  try {
    const { data } = await supabase.storage.from("robots").createSignedUrl(path, 60 * 60);
    if (data?.signedUrl) {
      // Cache the new signed URL with expiration time
      signedUrlCache.set(robotImageUrl, {
        url: data.signedUrl,
        expiresAt: now + (60 * 60 * 1000) // 1 hour from now
      });
      return data.signedUrl;
    }
  } catch (error) {
    console.warn('Failed to generate signed URL:', error);
  }
  
  return robotImageUrl;
}

export function RobotImage({
  team,
  className,
  ratio = 1,
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
      
      const signedUrl = await getSignedUrl(raw);
      if (!cancelled) {
        setSrc(signedUrl);
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