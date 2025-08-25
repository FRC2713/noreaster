import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AllianceLite } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

export interface AllianceData extends AllianceLite {}

// Helper function to safely extract alliance name
export function getAllianceName(alliance: AllianceData | AllianceData[] | null, fallback: string): string {
  if (!alliance) return fallback;
  if (Array.isArray(alliance)) {
    return alliance[0]?.name ?? fallback;
  }
  return alliance.name ?? fallback;
}
