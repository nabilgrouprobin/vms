export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Statement of Facts</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Sign in with a backend user that has VMS roles. Point this app at your API via{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm">NEXT_PUBLIC_API_URL</code>.
        </p>
      </div>
    </div>
  );
}
