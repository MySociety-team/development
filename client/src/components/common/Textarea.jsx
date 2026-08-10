function Textarea({
  label,
  name,
  id,
  value = "",
  onChange,
  error,
  required = false,
  placeholder,
  maxLength,
  rows = 4
}) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="mb-1 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        rows={rows}
        className={`w-full resize-y rounded-md border px-3 py-2 outline-none transition
            ${
              error
                ? "border-red-500 focus:ring-2 focus:ring-red-200"
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            }
            `}
      />
      <div className="mt-1 flex justify-between">
        {error ? <p className="text-sm text-red-500">{error}</p> : <span />}

        {maxLength && (
          <p className="text-sm text-gray-500">
            {value.length} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

export default Textarea;
