function isAuthenticated(req, res, next) {
    if (req.originalUrl === '/api/login' || req.isAuthenticated()) {
      return next();
    }
    res.status(401).send('Un-authorized user.');
}

module.exports = isAuthenticated;