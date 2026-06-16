import CustomerModel from '../../../models/customerModel.js';

class CustomerSyncController {
  static async syncCustomer(req, res) {
    const { external_customer_id, name, email, phone, raw_data } = req.body;
    const clientId = req.apiClient.id;
    const clientCode = req.apiClient.client_code;

    if (!external_customer_id || !name) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'external_customer_id dan name diperlukan.'
      });
    }

    try {
      // Find if customer already exists for this API client
      const existingCustomer = await CustomerModel.findByExternalId(external_customer_id, clientId);

      if (!existingCustomer) {
        // Create new customer
        const internalCustomerCode = `EXT-${clientCode.toUpperCase()}-${external_customer_id}`;

        const insertId = await CustomerModel.create({
          id_pelanggan: internalCustomerCode,
          nama_pelanggan: name,
          no_whatsapp: phone || '-',
          email: email || null,
          paket_hosting: 'API External Customer',
          nominal_tagihan: 0,
          tanggal_jatuh_tempo: new Date().toISOString().split('T')[0],
          source_type: 'api',
          external_customer_id: external_customer_id,
          api_client_id: clientId,
          metadata: raw_data
        });

        return res.status(201).json({
          status: 'success',
          message: 'Customer berhasil disinkronkan (dibuat).',
          data: {
            internal_customer_id: insertId,
            customer_code: internalCustomerCode,
            sync_status: 'created'
          }
        });
      }

      // Customer already exists, check if updates are needed
      let isChanged = false;
      if (existingCustomer.nama_pelanggan !== name ||
          existingCustomer.no_whatsapp !== (phone || null) ||
          existingCustomer.email !== (email || null)) {
        isChanged = true;
      }

      if (isChanged) {
        // Update customers
        await CustomerModel.update(existingCustomer.id_pelanggan, {
          nama_pelanggan: name,
          no_whatsapp: phone || '-',
          email: email || null,
          paket_hosting: existingCustomer.paket_hosting || 'API External Customer',
          nominal_tagihan: existingCustomer.nominal_tagihan || 0,
          tanggal_jatuh_tempo: existingCustomer.tanggal_jatuh_tempo ? new Date(existingCustomer.tanggal_jatuh_tempo).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });
        
        // We might also want to update raw_data metadata, but CustomerModel.update doesn't update metadata currently.
        // It's acceptable for now or we could add another method if needed.

        return res.status(200).json({
          status: 'success',
          message: 'Customer berhasil disinkronkan (diupdate).',
          data: {
            internal_customer_id: existingCustomer.id,
            customer_code: existingCustomer.id_pelanggan,
            sync_status: 'updated'
          }
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Customer sudah sinkron (tidak ada perubahan).',
        data: {
          internal_customer_id: existingCustomer.id,
          customer_code: existingCustomer.id_pelanggan,
          sync_status: 'unchanged'
        }
      });
    } catch (err) {
      console.error('Error in syncCustomer:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan saat menyinkronkan customer.'
      });
    }
  }

  static async getCustomer(req, res) {
    const { external_customer_id } = req.params;
    const clientId = req.apiClient.id;

    try {
      const customer = await CustomerModel.findByExternalId(external_customer_id, clientId);
      if (!customer) {
        return res.status(404).json({
          status: 'error',
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer tidak ditemukan.'
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          external_customer_id: customer.external_customer_id,
          internal_customer_id: customer.id,
          customer_code: customer.id_pelanggan,
          name: customer.nama_pelanggan,
          email: customer.email,
          phone: customer.no_whatsapp,
          raw_data: customer.metadata,
          created_at: customer.created_at
        }
      });
    } catch (err) {
      console.error('Error in getCustomer:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan pada server.'
      });
    }
  }
}

export default CustomerSyncController;

