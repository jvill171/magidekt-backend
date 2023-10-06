
const passUsername = (req, res, next) => {
  const username = req.params.username;
  req.username = username;
  next();
};

module.exports = { passUsername };
