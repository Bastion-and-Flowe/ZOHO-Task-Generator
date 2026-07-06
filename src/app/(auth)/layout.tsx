export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-secondary/40 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Zoho Task Generator</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn meeting action items into a Zoho Projects import in seconds.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
