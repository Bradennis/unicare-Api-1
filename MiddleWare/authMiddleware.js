const jwt = require("jsonwebtoken");

const middleware = async (req, res, next) => {
  try {
    const token = req.headers["authorization"].split(" ")[1];

    jwt.verify(token, process.env.KEY, (err, decoded) => {
      if (err) {
        return res.status(401).send({ message: "Auth failed", status: false });
      } else {
        req.body.userId = decoded.id;
        next();
      }
    });
  } catch (error) {
    return res.status(401).send({ message: "Auth failed", status: false });
  }
};

module.exports = middleware;
