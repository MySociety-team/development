function LoadingSpinner({ fullScreen = false }) {
  const Spinner = (
    <div
      className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600"
      aria-label="Loading"
    ></div>
  );

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center">{Spinner}</div>;
  }
  return Spinner;
}

export default LoadingSpinner;
