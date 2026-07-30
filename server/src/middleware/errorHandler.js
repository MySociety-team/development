export function errorHandler(error, request, response, next) {
  console.error(error);

  const statusCode = error.statusCode || 500;

  response.status(statusCode).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected server error occurred"
          : error.message
    }
  });
}
