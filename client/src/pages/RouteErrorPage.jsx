import { isRouteErrorResponse, Link, useRouteError } from "react-router";

function RouteErrorPage() {
  const error = useRouteError();

  let status = 500;
  let title = "Something went wrong";
  let message = "An unexpected error occurred while loading this page.";

  if (isRouteErrorResponse(error)) {
    status = error.status;

    if (error.status === 404) {
      title = "Page not found";
      message = "The page you are looking for does not exist or may have been moved.";
    } else if (error.status === 403) {
      title = "Access denied";
      message = "You do not have permission to access this page.";
    } else if (error.status === 401) {
      title = "Authentication required";
      message = "You need to sign in before accessing this page.";
    } else {
      title = error.statusText || "Something went wrong";

      if (typeof error.data === "string" && error.data.trim()) {
        message = error.data;
      }
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Error {status}
        </p>

        <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          {title}
        </h1>

        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">{message}</p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Try again
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

export default RouteErrorPage;
