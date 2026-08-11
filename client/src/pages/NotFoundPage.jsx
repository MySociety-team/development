import { Link, useNavigate } from "react-router";

function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Error 404</p>

        <h1 className="mt-4 text-7xl font-bold tracking-tight text-slate-900 sm:text-8xl">404</h1>

        <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Page not found
        </h2>

        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
          The page you are looking for does not exist, may have been moved, or the address may be
          incorrect.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Go back
          </button>

          <Link
            to="/societies"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Go to societies
          </Link>
        </div>

        <p className="mt-10 text-sm text-slate-400">MySociety</p>
      </div>
    </main>
  );
}

export default NotFoundPage;
