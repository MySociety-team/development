function Button({
  children,
  type = "Button",
  disabled = false,
  loading = false,
  variant = "primary"
}) {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  return (
    <button type={type} className={variants[variant]} disabled={disabled || loading}>
      {loading ? "Loading..." : children}
    </button>
  );
}

export default Button;
