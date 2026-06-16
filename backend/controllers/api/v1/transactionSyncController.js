import TransactionModel from '../../../models/transactionModel.js';
import CustomerModel from '../../../models/customerModel.js';
import { pool } from '../../../config/db.js';

class TransactionSyncController {
  static async syncTransaction(req, res) {
    const { external_transaction_id, source_application, customer, transaction } = req.body;
    const clientId = req.apiClient.id;
    const clientCode = req.apiClient.client_code;

    // Validate main payload
    if (!external_transaction_id || !source_application || !customer || !transaction) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'external_transaction_id, source_application, customer, dan transaction diperlukan.'
      });
    }

    // Validate customer payload
    if (!customer.external_customer_id || !customer.name) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'customer.external_customer_id dan customer.name diperlukan.'
      });
    }

    // Validate transaction payload
    if (!transaction.service_name || transaction.amount === undefined || !transaction.due_date) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'transaction.service_name, transaction.amount, dan transaction.due_date diperlukan.'
      });
    }

    try {
      // 1. Check if transaction already exists
      const existingTrx = await TransactionModel.findByExternalId(external_transaction_id, clientId);
      if (existingTrx) {
        return res.status(200).json({
          status: 'success',
          message: 'Transaksi sudah ada.',
          data: {
            internal_transaction_id: existingTrx.id,
            external_transaction_id: existingTrx.external_transaction_id,
            transaction: {
              status: existingTrx.status_konfirmasi,
              sync_status: 'exists'
            }
          }
        });
      }

      // 2. Sync customer first
      let cust = await CustomerModel.findByExternalId(customer.external_customer_id, clientId);
      let isNewCustomer = false;

      if (!cust) {
        // Create new customer
        isNewCustomer = true;
        const internalCustomerCode = `EXT-${clientCode.toUpperCase()}-${customer.external_customer_id}`;

        const insertId = await CustomerModel.create({
          id_pelanggan: internalCustomerCode,
          nama_pelanggan: customer.name,
          no_whatsapp: customer.phone || '-',
          email: customer.email || null,
          paket_hosting: 'API External Customer',
          nominal_tagihan: 0,
          tanggal_jatuh_tempo: new Date().toISOString().split('T')[0],
          source_type: 'api',
          external_customer_id: customer.external_customer_id,
          api_client_id: clientId,
          metadata: customer
        });

        cust = await CustomerModel.findById(insertId);
      } else {
        // Check for updates
        let isChanged = false;
        if (cust.nama_pelanggan !== customer.name ||
            cust.no_whatsapp !== (customer.phone || null) ||
            cust.email !== (customer.email || null)) {
          isChanged = true;
        }

        if (isChanged) {
          await CustomerModel.update(cust.id_pelanggan, {
            nama_pelanggan: customer.name,
            no_whatsapp: customer.phone || '-',
            email: customer.email || null,
            paket_hosting: cust.paket_hosting || 'API External Customer',
            nominal_tagihan: cust.nominal_tagihan || 0,
            tanggal_jatuh_tempo: cust.tanggal_jatuh_tempo ? new Date(cust.tanggal_jatuh_tempo).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          });
        }
      }

      // 3. Create transaction record in internal 'transactions' table
      const nominalTransfer = Number(transaction.amount) * (Number(transaction.quantity) || 1);

      const internalTxId = await TransactionModel.create({
        pelanggan_id: cust.id,
        nama_manual: null,
        no_whatsapp_manual: null,
        nominal_transfer: nominalTransfer,
        kuantitas: Number(transaction.quantity) || 1,
        tanggal_bayar: transaction.due_date || new Date().toISOString().split('T')[0],
        status_konfirmasi: 'pending',
        status_dokumen: 'draft',
        sertakan_tanda_tangan: 1,
        tipe_transaksi: 'pemasukan',
        notes: `${transaction.service_name} - ${transaction.description || ''}`,
        dikonfirmasi_oleh: null,
        source_type: 'api',
        ext_transaction_id: external_transaction_id,
        api_client_id: clientId,
        service_name: transaction.service_name
      });

      return res.status(201).json({
        status: 'success',
        message: 'Transaksi berhasil disinkronkan.',
        data: {
          internal_transaction_id: internalTxId,
          external_transaction_id,
          customer: {
            internal_customer_id: cust.id,
            sync_status: isNewCustomer ? 'created' : 'updated'
          },
          transaction: {
            status: 'pending',
            sync_status: 'created'
          }
        }
      });
    } catch (err) {
      console.error('Error in syncTransaction:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan saat menyinkronkan transaksi.'
      });
    }
  }

  static async getTransaction(req, res) {
    const { external_transaction_id } = req.params;
    const clientId = req.apiClient.id;

    try {
      const trx = await TransactionModel.findByExternalId(external_transaction_id, clientId);
      if (!trx) {
        return res.status(404).json({
          status: 'error',
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaksi tidak ditemukan.'
        });
      }

      return res.status(200).json({
        status: 'success',
        data: trx
      });
    } catch (err) {
      console.error('Error in getTransaction:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan pada server.'
      });
    }
  }

  static async getTransactions(req, res) {
    const clientId = req.apiClient.id;
    const { status, page, limit } = req.query;

    try {
      // Limit logic could be added to TransactionModel, but for now we get all and filter
      let all = await TransactionModel.findAll();
      let result = all.filter(t => t.api_client_id === clientId);
      
      if (status) {
        result = result.filter(t => t.status_konfirmasi === status);
      }

      // Basic pagination
      const p = parseInt(page) || 1;
      const l = parseInt(limit) || 50;
      const paginated = result.slice((p - 1) * l, p * l);

      return res.status(200).json({
        status: 'success',
        data: paginated,
        total: result.length,
        page: p,
        limit: l
      });
    } catch (err) {
      console.error('Error in getTransactions:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan pada server.'
      });
    }
  }
}

export default TransactionSyncController;

