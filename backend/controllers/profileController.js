import UserModel from '../models/userModel.js';

export const getProfile = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Data staf tidak ditemukan!'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        id: user.id,
        nama: user.nama_lengkap,
        email: user.email,
        tandaTangan: user.tanda_tangan || '',
        fotoProfil: user.foto_profil || '',
        role: user.role === 'admin_sistem' ? 'Admin' : 'Treasurer',
        dibuatPada: user.created_at,
        diperbaruiPada: user.updated_at
      }
    });

  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data profil staf.'
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { nama, email, tandaTangan, fotoProfil } = req.body;
    
    // Check if user exists
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Data staf tidak ditemukan!'
      });
    }

    // Update details
    const now = new Date();
    await UserModel.updateProfile(req.user.id, {
      nama,
      email,
      tandaTangan,
      fotoProfil,
      now
    });
    
    // Fetch updated user to return
    const updatedUser = await UserModel.findById(req.user.id);

    return res.status(200).json({
      status: 'success',
      message: 'Profil staf berhasil diperbarui!',
      data: {
        nama: updatedUser.nama_lengkap,
        email: updatedUser.email,
        tandaTangan: updatedUser.tanda_tangan,
        fotoProfil: updatedUser.foto_profil,
        role: updatedUser.role === 'admin_sistem' ? 'Admin' : 'Treasurer'
      }
    });

  } catch (err) {
    console.error('Update profile error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui profil staf.'
    });
  }
};
