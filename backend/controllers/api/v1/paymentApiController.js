import TransactionModel from '../../../models/transactionModel.js';
import ExtTransactionModel from '../../../models/extTransactionModel.js';
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
      const extTrx = await ExtTransactionModel.findByExternalId(external_transaction_id, clientId);
      if (!extTrx) {
        return res.status(404).json({
          status: 'error',
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaksi eksternal tidak ditemukan.'
        });
      }

      const internalId = extTrx.internal_transaction_id;
      const internalTrx = await TransactionModel.findById(internalId);

      if (!internalTrx) {
        return res.status(404).json({
          status: 'error',
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaksi internal tidak ditemukan.'
        });
      }

      if (internalTrx.status_konfirmasi === 'lunas') {
        return res.status(400).json({
          status: 'error',
          code: 'ALREADY_PAID',
          message: 'Transaksi ini sudah lunas.'
        });
      }

      // Approve transaction
      // req.user.id is available from JWT verify (for internal users/admin)
      // or we can use a system placeholder if authenticated via API key
      const confirmedBy = req.user?.id || req.apiClient.id;
      await TransactionModel.approve(internalId, confirmedBy);
      await ExtTransactionModel.updateStatus(extTrx.id, 'verified');

      const verifiedBy = req.user?.nama_lengkap || req.apiClient.client_name || 'API Client';
      await onTransactionVerified(extTrx.id, verifiedBy);

      return res.status(200).json({
        status: 'success',
        message: 'Pembayaran berhasil disetujui (verified).',
        data: {
          external_transaction_id,
          internal_transaction_id: internalId,
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
      const extTrx = await ExtTransactionModel.findByExternalId(external_transaction_id, clientId);
      if (!extTrx) {
        return res.status(404).json({
          status: 'error',
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaksi eksternal tidak ditemukan.'
        });
      }

      const internalId = extTrx.internal_transaction_id;

      // Set status in transaksi
      await TransactionModel.update(internalId, {
        status_konfirmasi: 'belum_lunas', // or create a rejected status, using existing enum values
        status_dokumen: 'Draft',
        notes: `Ditolak via API: ${reason || 'Tidak ada alasan.'}`
      });

      await ExtTransactionModel.updateStatus(extTrx.id, 'cancelled');
      await onTransactionCancelled(extTrx.id, reason || 'Ditolak via API');

      return res.status(200).json({
        status: 'success',
        message: 'Transaksi berhasil ditolak (rejected).',
        data: {
          external_transaction_id,
          internal_transaction_id: internalId,
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
