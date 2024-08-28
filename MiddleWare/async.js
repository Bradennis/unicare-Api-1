const asyncWrapper = (fn) => {
  try {
    return async (req, res, next) => {
      await fn(req, res, next);
    };
  } catch (error) {
    next(error);
  }
};

module.exports = asyncWrapper;
