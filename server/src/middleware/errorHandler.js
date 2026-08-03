const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;

  const response = {
    success: false,
    code: err.code || "INTERNAL_SERVER_ERROR",
    message: err.message || "Internal server error"
  };

  if (err.details) {
    response.details = err.details;
  }

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default errorHandler;
