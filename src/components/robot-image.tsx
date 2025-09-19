import { useEffect, useState, memo, useCallback } from 'react';
import { supabase } from '@/supabase/client';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import type { RobotImageTeam } from '@/types';

// Enhanced cache with better memory management
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const CACHE_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const CACHE_EXPIRY_BUFFER = 2 * 60 * 1000; // 2 minutes buffer

// Clean up expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of signedUrlCache.entries()) {
    if (value.expiresAt < now) {
      signedUrlCache.delete(key);
    }
  }
}, CACHE_CLEANUP_INTERVAL);

function deriveRobotsPath(publicUrl: string) {
  const marker = '/robots/';
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

  if (cached && cached.expiresAt > now + CACHE_EXPIRY_BUFFER) {
    return cached.url;
  }

  try {
    const { data } = await supabase.storage
      .from('robots')
      .createSignedUrl(path, 60 * 60);
    if (data?.signedUrl) {
      // Cache the new signed URL with expiration time
      signedUrlCache.set(robotImageUrl, {
        url: data.signedUrl,
        expiresAt: now + 60 * 60 * 1000, // 1 hour from now
      });
      return data.signedUrl;
    }
  } catch (error) {
    console.warn('Failed to generate signed URL:', error);
  }

  return robotImageUrl;
}

interface RobotImageProps {
  team: RobotImageTeam;
  className?: string;
  ratio?: number;
}

export const RobotImage = memo(function RobotImage({
  team,
  className,
  ratio = 1,
}: RobotImageProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadImage = useCallback(async (robotImageUrl: string) => {
    if (!robotImageUrl) {
      setSrc(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setHasError(false);

      const signedUrl = await getSignedUrl(robotImageUrl);
      if (signedUrl) {
        // Preload the image to check if it's valid
        const img = new Image();
        img.onload = () => {
          setSrc(signedUrl);
          setIsLoading(false);
        };
        img.onerror = () => {
          setHasError(true);
          setIsLoading(false);
        };
        img.src = signedUrl;
      } else {
        setHasError(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.warn('Failed to load robot image:', error);
      setHasError(true);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (team.robot_image_url) {
      loadImage(team.robot_image_url);
    } else {
      setSrc(null);
      setIsLoading(false);
      setHasError(false);
    }
  }, [team.robot_image_url, loadImage]);

  return (
    <AspectRatio ratio={ratio} className={className}>
      {isLoading ? (
        <div className="h-full w-full grid place-items-center bg-muted animate-pulse">
          <div className="text-2xl font-semibold text-muted-foreground">
            {team.number}
          </div>
        </div>
      ) : hasError || !src ? (
        <div className="h-full w-full grid place-items-center bg-muted">
          <div className="text-2xl font-semibold">{team.number}</div>
        </div>
      ) : (
        <img
          src={src}
          alt={`${team.number} ${team.name}`}
          className="h-full w-full object-cover transition-opacity duration-200"
          loading="lazy"
          decoding="async"
        />
      )}
    </AspectRatio>
  );
});
