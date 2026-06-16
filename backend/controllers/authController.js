import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'kroombox_secret_key_2026';

// Register Treasurer
export const register = async (req, res) => {
  try {
    const { nama, email, password } = req.body;
    
    // Check if email already registered
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: 'Email sudah terdaftar dalam sistem!'
      });
    }

    // Hash password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const now = new Date();
    const role = email.toLowerCase() === 'admin@kroomoney.com' ? 'admin_sistem' : 'bendahara';
    // Admin is active by default, Treasurer needs approval
    const status = role === 'admin_sistem' ? 'aktif' : 'menunggu_persetujuan';

    const insertId = await UserModel.create({
      nama,
      email,
      passwordHash: hashedPassword,
      role,
      status,
      now
    });

    // Create token
    const token = jwt.sign(
      { id: insertId, email: email.toLowerCase() },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      status: 'success',
      message: role === 'admin_sistem' 
        ? 'Akun Super Admin berhasil didaftarkan!' 
        : 'Pendaftaran sukses! Akun Anda sedang menunggu persetujuan Admin Sistem.',
      data: {
        token,
        profile: {
          nama,
          email: email.toLowerCase(),
          tandaTangan: '',
          fotoProfil: '',
          role: role === 'admin_sistem' ? 'Admin' : 'Treasurer',
          statusAkun: status
        }
      }
    });

  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan sistem saat mendaftar.'
    });
  }
};

// Login User & Verify Approval Status
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Email atau password salah!'
      });
    }

    // Verify password match
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        message: 'Email atau password salah!'
      });
    }

    // Check account approval status
    if (user.status_akun === 'menunggu_persetujuan') {
      return res.status(403).json({
        status: 'error',
        message: 'Akun Anda masih menunggu persetujuan dari Admin Sistem.'
      });
    } else if (user.status_akun === 'nonaktif') {
      return res.status(403).json({
        status: 'error',
        message: 'Akun Anda telah dinonaktifkan. Silakan hubungi Admin.'
      });
    }

    // Create token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil login!',
      data: {
        token,
        profile: {
          nama: user.nama_lengkap,
          email: user.email,
          tandaTangan: user.tanda_tangan || '',
          fotoProfil: user.foto_profil || '',
          role: user.role === 'admin_sistem' ? 'Admin' : 'Treasurer',
          statusAkun: user.status_akun
        }
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan sistem saat masuk.'
    });
  }
};

// --- Forgot Password OTP Logic ---
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Email tidak ditemukan di sistem KroomBox.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set OTP expiry to 15 minutes from now
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15);

    // Save OTP to user record
    await UserModel.updateResetOtp(email, otp, expiry);

    // Send email via Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'kroomoney@gmail.com',
        pass: 'utvf iccf qkaf nhwr'
      }
    });

    const mailOptions = {
      from: '"Kroomoney Security" <kroomoney@gmail.com>',
      to: email,
      subject: 'Kode OTP Reset Password Kroomoney Anda',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <h2 style="color: #0f2d4a; margin-top: 0;">Reset Kata Sandi Kroomoney</h2>
          <p style="color: #475569; line-height: 1.6;">Halo,</p>
          <p style="color: #475569; line-height: 1.6;">Sistem kami menerima permintaan untuk mereset kata sandi akun Kroomoney Anda.</p>
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">KODE OTP ANDA</p>
            <h1 style="margin: 8px 0 0; color: #2563eb; font-size: 32px; letter-spacing: 4px;">${otp}</h1>
          </div>
          <p style="color: #475569; font-size: 13px; line-height: 1.5;">Kode OTP ini hanya berlaku selama <strong>15 menit</strong>. Jangan berikan kode ini kepada siapapun demi keamanan akun Anda.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">Jika Anda tidak pernah meminta reset kata sandi, abaikan email ini.</p>
          <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0;">© 2026 Kroomoney Security</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({
      status: 'success',
      message: 'Kode OTP telah dikirim ke email Anda!'
    });

  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengirim OTP. Pastikan email terhubung dan koneksi internet stabil.'
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Data pengguna tidak valid!'
      });
    }

    // Validate OTP
    if (!user.reset_otp || user.reset_otp !== otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Kode OTP salah atau tidak valid!'
      });
    }

    // Check expiry
    const now = new Date();
    const expiry = new Date(user.reset_otp_expiry);
    if (now > expiry) {
      return res.status(400).json({
        status: 'error',
        message: 'Kode OTP telah kedaluwarsa. Silakan minta kode baru.'
      });
    }

    // Hash new password securely
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password and clear OTP
    await UserModel.resetPassword(email, hashedPassword, now);

    return res.status(200).json({
      status: 'success',
      message: 'Kata sandi berhasil direset! Silakan masuk dengan sandi baru.'
    });

  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mereset kata sandi. Silakan coba lagi nanti.'
    });
  }
};

// --- ADMIN CONTROL FOR TREASURERS ---
export const getAllTreasurers = async (req, res) => {
  try {
    // Return all users from the system
    const rows = await UserModel.findAllTreasurers();
    
    const mapped = rows.map(u => ({
      id: `TR-${String(u.id).padStart(3, '0')}`,
      rawId: u.id,
      nama: u.nama_lengkap,
      email: u.email,
      role: u.role === 'admin_sistem' ? 'Admin' : 'Bendahara',
      status: u.status_akun === 'aktif' ? 'Active' : u.status_akun === 'menunggu_persetujuan' ? 'Pending' : 'Inactive',
      rawStatus: u.status_akun,
      startup: 'Kroombox Corp',
      lastActive: u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'
    }));

    return res.status(200).json({
      status: 'success',
      data: mapped
    });
  } catch (err) {
    console.error('Get treasurers error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal memuat daftar pengguna.' });
  }
};

export const updateTreasurerStatus = async (req, res) => {
  try {
    const { id } = req.params; // numeric ID
    
    const existing = await UserModel.findById(id);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Bendahara tidak ditemukan.' });
    }

    // Toggle status: 'aktif' -> 'nonaktif', 'menunggu_persetujuan'/'nonaktif' -> 'aktif'
    const currentStatus = existing.status_akun;
    const nextStatus = currentStatus === 'aktif' ? 'nonaktif' : 'aktif';

    await UserModel.updateStatus(id, nextStatus);
    
    return res.status(200).json({
      status: 'success',
      message: `Status akun staf ${existing.nama_lengkap} berhasil diubah menjadi ${nextStatus.toUpperCase()}`
    });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal memperbarui status bendahara.' });
  }
};

export const deleteTreasurer = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await UserModel.findById(id);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Bendahara tidak ditemukan.' });
    }

    await UserModel.delete(id);

    return res.status(200).json({
      status: 'success',
      message: `Akun staf ${existing.nama_lengkap} berhasil dihapus dari sistem.`
    });
  } catch (err) {
    console.error('Delete treasurer error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus akun bendahara.' });
  }
};

export const updateTreasurer = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, status } = req.body;

    const existing = await UserModel.findById(id);
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Staf bendahara tidak ditemukan.' });
    }

    const mappedStatus = status === 'Active' ? 'aktif' : status === 'Inactive' ? 'nonaktif' : 'menunggu_persetujuan';

    await UserModel.updateTreasurer(id, { nama, email, status: mappedStatus });

    return res.status(200).json({
      status: 'success',
      message: 'Biodata bendahara berhasil diperbarui.'
    });
  } catch (err) {
    console.error('Update treasurer error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal memperbarui biodata.' });
  }
};

export const createTreasurerByAdmin = async (req, res) => {
  try {
    const { nama, email, password, status } = req.body;

    const existing = await UserModel.findByEmail(email);
    if (existing) {
      return res.status(400).json({ status: 'error', message: 'Email sudah terdaftar!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password || 'bendahara123', salt);
    const mappedStatus = status === 'Active' ? 'aktif' : 'nonaktif';

    await UserModel.createByAdmin({
      nama,
      email,
      passwordHash: hashedPassword,
      status: mappedStatus
    });

    return res.status(201).json({
      status: 'success',
      message: 'Akun bendahara baru berhasil ditambahkan oleh Admin!'
    });
  } catch (err) {
    console.error('Create treasurer error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal menambahkan bendahara baru.' });
  }
};
