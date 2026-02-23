import { type ReactNode, Suspense } from "react"

import { LoadingFallback } from "@/components/common/LoadingFallback"

/**
 * Wraps a component with React Suspense and a loading fallback.
 * Used for lazy-loaded routes to avoid boilerplate.
 */
export function withSuspense(element: ReactNode): ReactNode {
  return <Suspense fallback={<LoadingFallback />}>{element}</Suspense>
}
