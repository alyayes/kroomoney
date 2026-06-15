import TransactionModel from '../../../models/transactionModel.js';
import ExtTransactionModel from '../../../models/extTransactionModel.js';
import ExtCustomerModel from '../../../models/extCustomerModel.js';
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
      const existingTrx = await ExtTransactionModel.findByExternalId(external_transaction_id, clientId);
      if (existingTrx) {
        return res.status(200).json({
          status: 'success',
          message: 'Transaksi sudah ada.',
          data: {
            internal_transaction_id: existingTrx.internal_transaction_id,
            external_transaction_id: existingTrx.external_transaction_id,
            transaction: {
              status: existingTrx.status,
              sync_status: 'exists'
            }
          }
        });
      }

      // 2. Sync customer first
      let extCust = await ExtCustomerModel.findByExternalId(customer.external_customer_id, clientId);
      let internalCustomerId;
      let isNewCustomer = false;

      if (!extCust) {
        // Create new customer
        isNewCustomer = true;
        internalCustomerId = `EXT-${clientCode.toUpperCase()}-${customer.external_customer_id}`;

        await CustomerModel.create({
          id_pelanggan: internalCustomerId,
          nama_pelanggan: customer.name,
          no_whatsapp: customer.phone || '-',
          email: customer.email || null,
          paket_hosting: 'API External Customer',
          nominal_tagihan: 0,
          tanggal_jatuh_tempo: new Date().toISOString().split('T')[0]
        });

        const upsertRes = await ExtCustomerModel.upsert({
          external_customer_id: customer.external_customer_id,
          source_client_id: clientId,
          internal_customer_id: internalCustomerId,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          raw_data: customer
        });

        // Fetch back the newly created mapping to get its DB auto-increment ID
        extCust = await ExtCustomerModel.findByExternalId(customer.external_customer_id, clientId);
      } else {
        internalCustomerId = extCust.internal_customer_id;
        const internalCustomer = await CustomerModel.findById(internalCustomerId);

        // Check for updates
        let isChanged = false;
        if (internalCustomer) {
          if (internalCustomer.nama_pelanggan !== customer.name ||
              internalCustomer.no_whatsapp !== (customer.phone || null) ||
              internalCustomer.email !== (customer.email || null)) {
            isChanged = true;
          }
        }

        if (isChanged && internalCustomer) {
          await CustomerModel.update(internalCustomerId, {
            nama_pelanggan: customer.name,
            no_whatsapp: customer.phone || '-',
            email: customer.email || null,
            paket_hosting: internalCustomer.paket_hosting || 'API External Customer',
            nominal_tagihan: internalCustomer.nominal_tagihan || 0,
            tanggal_jatuh_tempo: internalCustomer.tanggal_jatuh_tempo ? new Date(internalCustomer.tanggal_jatuh_tempo).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
          });

          await ExtCustomerModel.upsert({
            external_customer_id: customer.external_customer_id,
            source_client_id: clientId,
            internal_customer_id: internalCustomerId,
            customer_name: customer.name,
            customer_email: customer.email,
            customer_phone: customer.phone,
            raw_data: customer
          });
        }
      }

      // 3. Create transaction record in internal 'transaksi' table
      const nominalTransfer = Number(transaction.amount) * (Number(transaction.quantity) || 1);

      const internalTxId = await TransactionModel.create({
        pelanggan_id: internalCustomerId,
        nama_manual: null,
        no_whatsapp_manual: null,
        nominal_transfer: nominalTransfer,
        kuantitas: Number(transaction.quantity) || 1,
        tanggal_bayar: new Date().toISOString().split('T')[0],
        status_konfirmasi: 'pending',
        status_dokumen: 'Draft',
        sertakan_tanda_tangan: 1,
        tipe_transaksi: 'Pemasukan',
        notes: `${transaction.service_name} - ${transaction.description || ''}`,
        dikonfirmasi_oleh: null,
        source_type: 'api',
        ext_transaction_id: null // Will update this after creating ext_transaction
      });

      // 4. Create mapping in ext_transactions
      const extTrxId = await ExtTransactionModel.create({
        external_transaction_id,
        source_client_id: clientId,
        source_application,
        internal_transaction_id: internalTxId,
        ext_customer_id: extCust.id,
        service_name: transaction.service_name,
        description: transaction.description || null,
        amount: Number(transaction.amount),
        quantity: Number(transaction.quantity) || 1,
        due_date: transaction.due_date,
        raw_payload: req.body
      });

      // 5. Update transaksi.ext_transaction_id to establish the bidirectional reference
      await pool.query('UPDATE transaksi SET ext_transaction_id = ? WHERE id = ?', [extTrxId, internalTxId]);

      return res.status(201).json({
        status: 'success',
        message: 'Transaksi berhasil disinkronkan.',
        data: {
          internal_transaction_id: internalTxId,
          external_transaction_id,
          customer: {
            internal_customer_id: internalCustomerId,
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
      const extTrx = await ExtTransactionModel.findByExternalId(external_transaction_id, clientId);
      if (!extTrx) {
        return res.status(404).json({
          status: 'error',
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaksi tidak ditemukan.'
        });
      }

      const internalTrx = await TransactionModel.findById(extTrx.internal_transaction_id);

      return res.status(200).json({
        status: 'success',
        data: {
          ...extTrx,
          internal_details: internalTrx
        }
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
      const result = await ExtTransactionModel.findAll({
        source_client_id: clientId,
        status,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50
      });

      return res.status(200).json({
        status: 'success',
        data: result
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
