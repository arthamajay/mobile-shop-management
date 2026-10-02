const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  if (err.stack) console.error(err.stack);

  const statusCode = err.statusCode || err.status || 500;
  const response = {
    success: false,
    message: err.message || 'Internal Server Error',
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    response.message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json(response);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    response.message = `${field} already exists`;
    return res.status(400).json(response);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    response.message = 'Invalid token';
    return res.status(401).json(response);
  }

  if (err.name === 'TokenExpiredError') {
    response.message = 'Token expired';
    return res.status(401).json(response);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
