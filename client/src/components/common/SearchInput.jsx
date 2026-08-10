function SearchInput({ value = "", onChange, placeholder = "Search...", name, id }) {
  return (
    <div className="relative w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        🔍
      </span>

      <input
        id={id}
        name={name}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
      />
    </div>
  );
}

export default SearchInput;
