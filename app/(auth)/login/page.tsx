import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="reveal ambient glass glass-2 w-full max-w-sm p-8">
        <div className="relative z-10">
          <p className="eyebrow">Abode</p>
          <h1 className="font-display mt-2 text-3xl font-semibold leading-tight tracking-tight text-ink">
            Your money, at a glance
          </h1>
          <p className="mt-2.5 mb-6 text-sm text-muted">
            A private dashboard. Owner access only.
          </p>
          <LoginForm notice={error} />
        </div>
      </div>
    </main>
  );
}
