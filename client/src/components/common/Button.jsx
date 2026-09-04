function Button({
  children,
  type = "button",
  disabled = false,
  loading = false,
  variant = "primary",
  className = "",
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variants = {
    primary:
      "bg-slate-950 border-slate-950 text-white hover:bg-slate-900 hover:border-slate-900 focus:ring-slate-950",
    secondary:
      "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-200",
    danger:
      "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 hover:border-rose-300 focus:ring-rose-300"
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-1.5">
          <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
