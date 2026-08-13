export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12">
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-md bg-muted" />

        <div className="h-4 w-72 rounded-md bg-muted" />

        <div className="h-32 rounded-xl bg-muted" />

        <div className="h-10 rounded-md bg-muted" />

        <div className="grid grid-cols-3 gap-3">
          <div className="h-10 rounded-md bg-muted" />
          <div className="h-10 rounded-md bg-muted" />
          <div className="h-10 rounded-md bg-muted" />
        </div>
      </div>
    </main>
  );
}