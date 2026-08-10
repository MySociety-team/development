function EmptyState({ title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 p-8 text-center">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-gray-500">{message}</p>

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
