const jwtDecode = require('jwt-decode');

function jwtMiddleware(req, res, next){
  const accessToken = req.headers['authorization']?.split(' ')[1];
  const idToken = req.headers['x-id-token'];

  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  try {
    const decoded = jwtDecode(accessToken);
    const currentTime = Math.floor(Date.now() / 1000);

    if (decoded.exp < currentTime) {
      return res.status(401).json({ error: 'Token expired' });
    }

    if (!decoded.user || !decoded.email || !decoded.aud) {
      return res.status(401).json({ error: 'Invalid token: missing required claims' });
    }

    req.user = {
      userId: decoded.user,
      email: decoded.email,
      roles: Array.isArray(decoded.role) ? decoded.role : [decoded.role],
      clientApplicationId: decoded.aud
    };
    if (idToken) req.idToken = idToken;

    next();
  } catch (error) {
    console.error('Invalid token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (requiredRole) => (req, res, next) => {
  if (!req.user || !req.user.roles.includes(requiredRole)) {
    return res.status(403).json({ error: `Forbidden: ${requiredRole} role required` });
  }
  next();
};

module.exports = jwtMiddleware ;