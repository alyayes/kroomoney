import TransactionModel from '../../../models/transactionModel.js';
import { onTransactionVerified, onTransactionCancelled } from '../../../services/callbackService.js';

class PaymentApiController {
  static async verifyPayment(req, res) {
    const { external_transaction_id } = req.body;
    const clientId = req.apiClient.id;

    if (!external_transaction_id) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'external_transaction_id diperlukan.'
      });
    }

    try {
      const trx = await TransactionModel.findByExternalId(external_transaction_id, clientId);
      if (!trx) {
        return res.status(404).json({
          status: 'error',
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaksi eksternal tidak ditemukan.'
        });
      }

      if (trx.status_konfirmasi === 'lunas') {
        return res.status(400).json({
          status: 'error',
          code: 'ALREADY_PAID',
          message: 'Transaksi ini sudah lunas.'
        });
      }

      // Approve transaction
      // req.user.id is available from JWT verify (for internal users/admin)
      // or we can use a system placeholder if authenticated via API key
      const confirmedBy = req.user?.id || null;
      await TransactionModel.approve(trx.id, confirmedBy);

      const verifiedBy = req.user?.nama_lengkap || req.apiClient.client_name || 'API Client';
      await onTransactionVerified(trx.id, verifiedBy);

      return res.status(200).json({
        status: 'success',
        message: 'Pembayaran berhasil disetujui (verified).',
        data: {
          external_transaction_id,
          internal_transaction_id: trx.id,
          status: 'verified'
        }
      });
    } catch (err) {
      console.error('Error in verifyPayment:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan saat verifikasi pembayaran.'
      });
    }
  }

  static async rejectPayment(req, res) {
    const { external_transaction_id, reason } = req.body;
    const clientId = req.apiClient.id;

    if (!external_transaction_id) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'external_transaction_id diperlukan.'
      });
    }

    try {
      const trx = await TransactionModel.findByExternalId(external_transaction_id, clientId);
      if (!trx) {
        return res.status(404).json({
          status: 'error',
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaksi eksternal tidak ditemukan.'
        });
      }

      // Set status in transactions
      await TransactionModel.update(trx.id, {
        pelanggan_id: trx.pelanggan_id,
        nama_manual: trx.nama_manual,
        no_whatsapp_manual: trx.no_whatsapp_manual,
        nominal_transfer: trx.nominal_transfer,
        kuantitas: trx.kuantitas,
        tanggal_bayar: trx.tanggal_bayar,
        status_konfirmasi: 'belum_lunas',
        status_dokumen: 'draft',
        sertakan_tanda_tangan: trx.sertakan_tanda_tangan,
        tipe_transaksi: trx.tipe_transaksi,
        notes: `Ditolak via API: ${reason || 'Tidak ada alasan.'}`,
        dikonfirmasi_oleh: null,
        source_type: trx.source_type,
        ext_transaction_id: trx.external_transaction_id,
        api_client_id: trx.api_client_id,
        service_name: trx.service_name
      });

      await onTransactionCancelled(trx.id, reason || 'Ditolak via API');

      return res.status(200).json({
        status: 'success',
        message: 'Transaksi berhasil ditolak (rejected).',
        data: {
          external_transaction_id,
          internal_transaction_id: trx.id,
          status: 'cancelled'
        }
      });
    } catch (err) {
      console.error('Error in rejectPayment:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan saat menolak pembayaran.'
      });
    }
  }
}

export default PaymentApiController;

