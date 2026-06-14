import CustomerModel from '../models/customerModel.js';

// Get all customers
export const getAllCustomers = async (req, res) => {
  try {
    const rows = await CustomerModel.findAll();
    return res.status(200).json({
      status: 'success',
      data: rows
    });
  } catch (err) {
    console.error('Get all customers error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memuat data pelanggan.'
    });
  }
};

// Create customer
export const createCustomer = async (req, res) => {
  try {
    const { id_pelanggan, nama_pelanggan, no_whatsapp, paket_hosting, nominal_tagihan, tanggal_jatuh_tempo } = req.body;

    if (!id_pelanggan || !nama_pelanggan || !no_whatsapp || !paket_hosting || !nominal_tagihan || !tanggal_jatuh_tempo) {
      return res.status(400).json({
        status: 'error',
        message: 'Mohon lengkapi semua kolom data pelanggan!'
      });
    }

    // Check duplicate ID
    const existing = await CustomerModel.findById(id_pelanggan);
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: `ID Pelanggan ${id_pelanggan} sudah terdaftar!`
      });
    }

    await CustomerModel.create({
      id_pelanggan,
      nama_pelanggan,
      no_whatsapp,
      paket_hosting,
      nominal_tagihan,
      tanggal_jatuh_tempo
    });

    return res.status(201).json({
      status: 'success',
      message: 'Data pelanggan baru berhasil ditambahkan!'
    });
  } catch (err) {
    console.error('Create customer error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menambahkan data pelanggan.'
    });
  }
};

// Update customer
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params; // id_pelanggan
    const { nama_pelanggan, no_whatsapp, paket_hosting, nominal_tagihan, tanggal_jatuh_tempo } = req.body;

    const existing = await CustomerModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Data pelanggan tidak ditemukan!'
      });
    }

    await CustomerModel.update(id, {
      nama_pelanggan,
      no_whatsapp,
      paket_hosting,
      nominal_tagihan,
      tanggal_jatuh_tempo
    });

    return res.status(200).json({
      status: 'success',
      message: 'Data pelanggan berhasil diperbarui.'
    });
  } catch (err) {
    console.error('Update customer error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui data pelanggan.'
    });
  }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await CustomerModel.findById(id);
    if (!existing) {
      return res.status(404).json({
        status: 'error',
        message: 'Data pelanggan tidak ditemukan!'
      });
    }

    await CustomerModel.delete(id);

    return res.status(200).json({
      status: 'success',
      message: 'Data pelanggan berhasil dihapus dari database.'
    });
  } catch (err) {
    console.error('Delete customer error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menghapus data pelanggan. Data ini kemungkinan terikat dengan data pembayaran.'
    });
  }
};
