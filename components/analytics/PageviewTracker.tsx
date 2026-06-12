"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { isInternalPath, phCapture } from "@/lib/analytics/client";

/**
 * Pageviews manuels sur navigation App Router (le snippet est configuré en
 * capture_pageview:false). Les routes internes (/admin, /maison, /dev*) ne
 * polluent jamais les stats business.
 * À monter sous <Suspense> (useSearchParams).
 */
export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || isInternalPath(pathname)) return;
    const qs = searchParams?.toString();
    phCapture("$pageview", {
      $current_url: window.location.origin + pathname + (qs ? `?${qs}` : ""),
    });
  }, [pathname, searchParams]);

  return null;
}
