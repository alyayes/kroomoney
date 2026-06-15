import ApiClientModel from '../models/apiClientModel.js';

class ApiClientController {
  // Get all API clients
  static async getAllClients(req, res) {
    try {
      const clients = await ApiClientModel.findAll();
      return res.status(200).json({
        status: 'success',
        data: clients
      });
    } catch (err) {
      console.error('Error in getAllClients:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal mengambil daftar API clients.'
      });
    }
  }

  // Create new API client
  static async createClient(req, res) {
    const { client_name, client_code, callback_url, description } = req.body;

    if (!client_name || !client_code) {
      return res.status(400).json({
        status: 'error',
        message: 'client_name dan client_code wajib diisi.'
      });
    }

    try {
      const existing = await ApiClientModel.findByCode(client_code);
      if (existing) {
        return res.status(400).json({
          status: 'error',
          message: `Client dengan kode "${client_code}" sudah terdaftar.`
        });
      }

      const createdBy = req.user?.id || null;
      const result = await ApiClientModel.create({
        client_name,
        client_code,
        callback_url,
        description,
        created_by: createdBy
      });

      return res.status(201).json({
        status: 'success',
        message: 'API client berhasil didaftarkan.',
        data: {
          id: result.insertId,
          client_name,
          client_code,
          api_key: result.api_key,
          api_secret: result.api_secret,
          callback_secret: result.callback_secret
        }
      });
    } catch (err) {
      console.error('Error in createClient:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal mendaftarkan API client.'
      });
    }
  }

  // Update API client details
  static async updateClient(req, res) {
    const { id } = req.params;
    const { client_name, callback_url, description, is_active, rate_limit_per_minute, allowed_ips } = req.body;

    try {
      const client = await ApiClientModel.findById(id);
      if (!client) {
        return res.status(404).json({
          status: 'error',
          message: 'API client tidak ditemukan.'
        });
      }

      await ApiClientModel.update(id, {
        client_name,
        callback_url,
        description,
        is_active,
        rate_limit_per_minute,
        allowed_ips
      });

      return res.status(200).json({
        status: 'success',
        message: 'API client berhasil diperbarui.'
      });
    } catch (err) {
      console.error('Error in updateClient:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal memperbarui API client.'
      });
    }
  }

  // Soft delete / deactivate client
  static async deactivateClient(req, res) {
    const { id } = req.params;

    try {
      const client = await ApiClientModel.findById(id);
      if (!client) {
        return res.status(404).json({
          status: 'error',
          message: 'API client tidak ditemukan.'
        });
      }

      await ApiClientModel.deactivate(id);

      return res.status(200).json({
        status: 'success',
        message: 'API client berhasil dinonaktifkan.'
      });
    } catch (err) {
      console.error('Error in deactivateClient:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal menonaktifkan API client.'
      });
    }
  }

  // Rotate API credentials
  static async rotateKeys(req, res) {
    const { id } = req.params;

    try {
      const client = await ApiClientModel.findById(id);
      if (!client) {
        return res.status(404).json({
          status: 'error',
          message: 'API client tidak ditemukan.'
        });
      }

      const result = await ApiClientModel.rotateKeys(id);

      return res.status(200).json({
        status: 'success',
        message: 'API key & secret berhasil diperbarui.',
        data: {
          api_key: result.api_key,
          api_secret: result.api_secret
        }
      });
    } catch (err) {
      console.error('Error in rotateKeys:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Gagal melakukan rotasi key.'
      });
    }
  }
}

export default ApiClientController;
