import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'kroombox_secret_key_2026';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      status: 'error',
      message: 'Akses ditolak! Token autentikasi tidak tersedia.'
    });
  }

  const token = authHeader.split(' ')[1]; // Expecting "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Akses ditolak! Format token tidak valid.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({
      status: 'error',
      message: 'Sesi kedaluwarsa atau token tidak valid. Silakan login kembali.'
    });
  }
};
