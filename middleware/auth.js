import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>
  console.log('Token received:', token); // Debug log
  if (!token) {
    console.log('No token provided'); // Debug log
    return res.status(401).json({ error: 'Token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification error:', err.message); // Debug log
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ error: 'Token expired, please login again' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.log('Token verified, user:', user); // Debug log
    req.user = user;
    next();
  });
};

export const adminOnly = (req, res, next) => {
  console.log('Checking admin role for user:', req.user); // Debug log
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can access this route' });
  }
  next();
};

export const studentOnly = (req, res, next) => {
  if (req.user.role !== 'Student') {
    return res.status(403).json({ error: 'Only students can access this route' });
  }
  next();
};