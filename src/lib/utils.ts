import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolve the runtime endpoint to display (About page "Runtime endpoint"
 * row). When no `VITE_UAR_BASE_URL` is baked into the build, requests go
 * through the same-origin proxy (the Vite dev proxy, or the production
 * nginx site proxy) rather than a hardcoded default — so the truthful label
 * is the actual same-origin `/api` target, derived from `origin`
 * (`window.location.origin` at the call site), not a guess like
 * "http://localhost:6565".
 */
export function resolveRuntimeEndpointDisplay(
  configuredBaseUrl: string | undefined,
  origin: string,
): string {
  const trimmed = configuredBaseUrl?.trim();
  if (trimmed) return trimmed;
  return `${origin.replace(/\/$/, "")}/api`;
}
