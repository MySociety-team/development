function Input({
  label,
  error,
  required = true,
  helperText,
  value,
  onChange,
  type = "text",
  placeholder,
  name,
  id
}) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full rounded-md border px-3 py-2 outline-none transition
          ${
            error
              ? "border-red-500 focus:ring-2 focus:ring-red-200"
              : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }`}
      />
      {error ? (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      ) : (
        helperText && <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
export default Input;
