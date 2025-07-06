// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error("Server Error:", err.stack);

  // Default error response
  const errorResponse = {
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
    timestamp: new Date().toISOString(),
  };

  // Handle specific error types
  if (err.name === "ValidationError") {
    errorResponse.message = "Validation failed";
    errorResponse.error = err.message;
    return res.status(400).json(errorResponse);
  }

  if (err.name === "CastError") {
    errorResponse.message = "Invalid ID format";
    errorResponse.error = "The provided ID is not valid";
    return res.status(400).json(errorResponse);
  }

  if (err.code === 11000) {
    errorResponse.message = "Duplicate entry";
    errorResponse.error = "This record already exists";
    return res.status(409).json(errorResponse);
  }

  // Default 500 error
  res.status(500).json(errorResponse);
};

export default errorHandler;
