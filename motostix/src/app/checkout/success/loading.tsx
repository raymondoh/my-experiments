export default function CheckoutSuccessLoading() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-md flex-col gap-4">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" aria-hidden="true" />
        <div className="space-y-3 rounded-xl border border-border/60 p-6">
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" aria-hidden="true" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" aria-hidden="true" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}
