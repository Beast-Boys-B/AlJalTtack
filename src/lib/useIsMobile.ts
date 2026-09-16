// Shared hook to pick mobile vs desktop page components in App.tsx.
// Uses matchMedia (viewport width), NOT user-agent sniffing and NOT
// getBoundingClientRect()-based measurement — the latter caused real layout
// bugs before in this codebase (see ComparePage.tsx's ARCADE HINT popup
// comment) because it depends on layout/font-loading timing. matchMedia is
// synchronous and timing-independent.

import { useEffect, useState } from "react"

const MOBILE_MEDIA_QUERY = "(max-width: 768px)"

function getIsMobile(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false
  }
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

export function useIsMobile(): boolean {
  // Lazy initializer runs synchronously on first render (before paint), so
  // there's no flash of the wrong layout on mount.
  const [isMobile, setIsMobile] = useState(getIsMobile)

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return
    }
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY)
    const handleChange = () => setIsMobile(mql.matches)

    // Safari < 14 only supports the legacy addListener/removeListener API.
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handleChange)
      return () => mql.removeEventListener("change", handleChange)
    }
    mql.addListener(handleChange)
    return () => mql.removeListener(handleChange)
  }, [])

  return isMobile
}
