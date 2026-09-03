function Button({
  children,
  type = "button",
  disabled = false,
  loading = false,
  variant = "primary",
  onClick,
  className = "",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";

  const variants = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 focus:ring-slate-900 shadow-sm",
    secondary:
      "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 focus:ring-slate-300",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500 shadow-sm"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
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
          <span>Loading...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
