
/**passUsername
 * Middleware to extract and store the username from request parameters.
 *
 * This middleware extracts the `username` parameter from the request and
 * stores it as `req.username` for further processing by subsequent
 * route handlers.
 * 
 * This middleware is meant to be used after another middleware
 * which has verified a username exists
 * 
 */
const passUsername = (req, res, next) => {
  const username = req.params.username;
  req.username = username;
  next();
};

module.exports = { passUsername };
