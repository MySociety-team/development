import { Link, useNavigate } from "react-router";

import { useAuth } from "../../modules/auth/hooks/useAuth.js";

function AppShell({ title, description, backTo, children }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", {
      replace: true
    });
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/societies" className="text-xl font-bold tracking-tight text-slate-900">
              MySociety
            </Link>

            {backTo && (
              <Link
                to={backTo}
                className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
              >
                Back
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-900">{user?.name ?? "Account"}</p>
              <p className="text-xs text-slate-500">{user?.email}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {(title || description) && (
          <div className="mb-8">
            {title && <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>}
            {description && (
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
            )}
          </div>
        )}

        {children}
      </div>
    </main>
  );
}

export default AppShell;
