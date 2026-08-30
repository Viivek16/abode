import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="ambient w-full max-w-sm rounded-card bg-surface p-7 ring-1 ring-edge">
        <div className="relative z-10">
          <p className="eyebrow">Abode</p>
          <h1 className="font-display mt-1 text-3xl font-bold text-ink">
            Your money, at a glance
          </h1>
          <p className="mt-2 mb-6 text-sm text-muted">
            Private dashboard. Sign in with a magic link.
          </p>
          <LoginForm notice={error} />
        </div>
      </div>
    </main>
  );
}
