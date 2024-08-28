class CustomApiError extends Error {
  constructor(msg) {
    super(msg);
  }
}

module.exports = CustomApiError;
