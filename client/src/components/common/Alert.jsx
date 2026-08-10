const variants = {
  success: "bg-green-100 text-green-800 border-green-300",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  error: "bg-red-100 text-red-800 border-red-300"
};

function Alert({ variant = "success", children }) {
  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${variants[variant]}`} role="alert">
      {children}
    </div>
  );
}

export default Alert;
