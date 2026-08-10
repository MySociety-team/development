function Select({
  options = [],
  placeholder = "Select an option",
  error,
  value,
  onChange,
  name,
  id,
  required = false
}) {
  return (
    <div className="w-full">
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full rounded-md border px-3 py-2 outline-none ${
          error
            ? "border-red-500 focus:ring-2 focus:ring-red-200"
            : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        }`}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export default Select;
