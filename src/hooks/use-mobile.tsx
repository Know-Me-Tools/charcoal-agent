import { useMediaQuery } from "@/hooks/use-media-query"

const MOBILE_BREAKPOINT = 768

/** Phone layout (bottom nav, drawer) below 768px. */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
}
