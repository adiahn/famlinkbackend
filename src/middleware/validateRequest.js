const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details[0].message;
      const field = error.details[0].path[0];
      
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: {
            field,
            message: errorMessage
          }
        }
      });
    }
    
    next();
  };
};

module.exports = validateRequest; 