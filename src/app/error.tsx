"use client";

import ErrorOverlay from "@/components/ui/ErrorOverlay";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorOverlay error={error} reset={reset} />;
}
