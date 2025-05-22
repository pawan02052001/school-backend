import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('AuthenticateToken - Authorization Header:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('AuthenticateToken - Error: Token required');
    return res.status(401).json({ error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('AuthenticateToken - Decoded Token:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('AuthenticateToken - Error:', err.message, err.stack);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const adminOnly = (req, res, next) => {
  console.log('AdminOnly - User Role:', req.user.role);
  if (req.user.role !== 'admin') {
    console.log('AdminOnly - Error: Admin access required for:', req.user.userId);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const studentOnly = (req, res, next) => {
  console.log('StudentOnly - User Role:', req.user.role);
  if (req.user.role !== 'student') {
    console.log('StudentOnly - Error: Student access required for:', req.user.userId);
    return res.status(403).json({ error: 'Student access required' });
  }
  next();
};