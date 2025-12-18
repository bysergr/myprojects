import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Firebase Storage URL to a proxy URL to avoid CORS issues
 * Only proxies URLs from Firebase Storage, returns others as-is
 */
export function getProxiedImageUrl(url: string | null | undefined): string {
  if (!url) return "";
  
  // If it's already a local/proxy URL, return as-is
  if (url.startsWith("/") || url.startsWith("http://localhost") || url.startsWith("data:")) {
    return url;
  }
  
  // If it's a Firebase Storage URL, proxy it through our API
  if (url.includes("storage.googleapis.com") || url.includes("firebasestorage")) {
    return `/api/image?url=${encodeURIComponent(url)}`;
  }
  
  // For other URLs, return as-is
  return url;
}
