export const getApiErrorCode = (error) => {
  return error.response?.data?.code ?? error.response?.data?.error?.code ?? null;
};

export const getApiErrorMessage = (error, fallback = "Something went wrong.") => {
  return (
    error.response?.data?.message ??
    error.response?.data?.error?.message ??
    error.message ??
    fallback
  );
};
