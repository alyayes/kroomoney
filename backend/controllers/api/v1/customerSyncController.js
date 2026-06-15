import CustomerModel from '../../../models/customerModel.js';
import ExtCustomerModel from '../../../models/extCustomerModel.js';

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
      // Find if external mapping already exists
      const existingMap = await ExtCustomerModel.findByExternalId(external_customer_id, clientId);

      if (!existingMap) {
        // Create new customer
        const internalCustomerId = `EXT-${clientCode.toUpperCase()}-${external_customer_id}`;

        // Insert into master_customers
        await CustomerModel.create({
          id_pelanggan: internalCustomerId,
          nama_pelanggan: name,
          no_whatsapp: phone || '-',
          email: email || null,
          paket_hosting: 'API External Customer',
          nominal_tagihan: 0,
          tanggal_jatuh_tempo: new Date().toISOString().split('T')[0]
        });

        // Insert mapping into ext_customers
        await ExtCustomerModel.upsert({
          external_customer_id,
          source_client_id: clientId,
          internal_customer_id: internalCustomerId,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          raw_data
        });

        return res.status(201).json({
          status: 'success',
          message: 'Customer berhasil disinkronkan (dibuat).',
          data: {
            internal_customer_id: internalCustomerId,
            sync_status: 'created'
          }
        });
      }

      // Customer already exists, check if updates are needed
      const internalId = existingMap.internal_customer_id;
      const internalCustomer = await CustomerModel.findById(internalId);

      let isChanged = false;
      if (internalCustomer) {
        if (internalCustomer.nama_pelanggan !== name ||
            internalCustomer.no_whatsapp !== (phone || null) ||
            internalCustomer.email !== (email || null)) {
          isChanged = true;
        }
      }

      if (isChanged && internalCustomer) {
        // Update master_customers
        await CustomerModel.update(internalId, {
          nama_pelanggan: name,
          no_whatsapp: phone || '-',
          email: email || null,
          paket_hosting: internalCustomer.paket_hosting || 'API External Customer',
          nominal_tagihan: internalCustomer.nominal_tagihan || 0,
          tanggal_jatuh_tempo: internalCustomer.tanggal_jatuh_tempo ? new Date(internalCustomer.tanggal_jatuh_tempo).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        });

        // Update ext_customers mapping
        await ExtCustomerModel.upsert({
          external_customer_id,
          source_client_id: clientId,
          internal_customer_id: internalId,
          customer_name: name,
          customer_email: email,
          customer_phone: phone,
          raw_data
        });

        return res.status(200).json({
          status: 'success',
          message: 'Customer berhasil disinkronkan (diupdate).',
          data: {
            internal_customer_id: internalId,
            sync_status: 'updated'
          }
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Customer sudah sinkron (tidak ada perubahan).',
        data: {
          internal_customer_id: internalId,
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
      const customerMap = await ExtCustomerModel.findByExternalId(external_customer_id, clientId);
      if (!customerMap) {
        return res.status(404).json({
          status: 'error',
          code: 'CUSTOMER_NOT_FOUND',
          message: 'Customer tidak ditemukan.'
        });
      }

      const internalCustomer = await CustomerModel.findById(customerMap.internal_customer_id);

      return res.status(200).json({
        status: 'success',
        data: {
          external_customer_id: customerMap.external_customer_id,
          internal_customer_id: customerMap.internal_customer_id,
          name: customerMap.customer_name,
          email: customerMap.customer_email,
          phone: customerMap.customer_phone,
          raw_data: customerMap.raw_data,
          internal_details: internalCustomer,
          created_at: customerMap.created_at
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
