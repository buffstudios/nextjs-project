"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="mt-4 max-w-lg text-center text-sm text-muted-foreground">
        {error.message}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-white"
      >
        Try again
      </button>
    </div>
  );
}
