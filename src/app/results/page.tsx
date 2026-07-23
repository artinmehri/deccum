import { ResultsClient } from "@/components/results/ResultsClient";
import { Suspense } from "react";

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-ink-soft">
          Building your withdrawal sequence…
        </div>
      }
    >
      <ResultsClient />
    </Suspense>
  );
}
