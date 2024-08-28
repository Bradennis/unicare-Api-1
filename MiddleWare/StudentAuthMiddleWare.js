const { Unauthenticated } = require("../CustomErrors");
const jwt = require("jsonwebtoken");

const authenticationMiddleWare = (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      throw new Unauthenticated("authentication failed");
    }

    const { userId, username, id } = jwt.verify(token, process.env.JWT_SECRET);

    req.user = { id, username, userId };
    next();
  } catch (error) {
    throw new Unauthenticated("authentication error");
  }
};

module.exports = authenticationMiddleWare;
