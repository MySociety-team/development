function FormError({ message }) {
  if (!message) {
    return null;
  }

  return (
    <p className="mt-2 text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

export default FormError;
