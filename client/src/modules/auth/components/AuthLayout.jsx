import { Link } from "react-router";

function AuthLayout({ title, description, children, footerText, footerLinkText, footerLinkTo }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block text-2xl font-bold tracking-tight text-slate-900">
            MySociety
          </Link>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>

          {description && <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-slate-600">
          {footerText}{" "}
          <Link
            to={footerLinkTo}
            className="font-semibold text-slate-900 underline-offset-4 hover:underline"
          >
            {footerLinkText}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default AuthLayout;
