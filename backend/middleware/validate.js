// Validation middleware for staff credentials
export const validateRegister = (req, res, next) => {
  const { nama, email, password } = req.body;

  if (!nama || nama.trim() === '') {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Nama lengkap wajib diisi!' 
    });
  }

  if (!email || email.trim() === '') {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Email wajib diisi!' 
    });
  }

  // Basic email regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Format email tidak valid!' 
    });
  }

  if (!password || password.length < 8) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Password keamanan minimal harus terdiri dari 8 karakter!' 
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || email.trim() === '') {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Email wajib diisi!' 
    });
  }

  if (!password) {
    return res.status(400).json({ 
      status: 'error', 
      message: 'Password wajib diisi!' 
    });
  }

  next();
};
