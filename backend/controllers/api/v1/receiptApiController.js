import ReceiptModel from '../../../models/receiptModel.js';
import InvoiceModel from '../../../models/invoiceModel.js';
import TransactionModel from '../../../models/transactionModel.js';
import { generateReceiptPdf } from '../../../services/pdfService.js';
import { onTransactionPaid } from '../../../services/callbackService.js';
import { pool } from '../../../config/db.js';

class ReceiptApiController {
  static async generateReceipt(req, res) {
    const { external_transaction_id, payment_method, received_by, notes } = req.body;
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

      const inv = await InvoiceModel.findByTransaksiId(trx.id);

      if (!inv) {
        return res.status(400).json({
          status: 'error',
          code: 'INVOICE_REQUIRED',
          message: 'Invoice harus diterbitkan sebelum kwitansi pembayaran dapat dibuat.'
        });
      }

      // 1. Mark invoice as paid if not already
      if (inv.status_invoice !== 'dibayar') {
        await InvoiceModel.update(inv.id, {
          status_invoice: 'dibayar',
          tanggal_bayar: new Date()
        });
      }

      // 2. Check if receipt already exists
      let receipt = await ReceiptModel.findByInvoiceId(inv.id);
      let nomorKwitansi = '';
      let receiptId;

      if (!receipt) {
        const today = new Date().toISOString().split('T')[0];
        const createdBy = req.user?.id || 1;

        const createRes = await ReceiptModel.create({
          invoice_id: inv.id,
          pelanggan_id: inv.pelanggan_id,
          nama_manual: inv.nama_manual,
          tanggal_terbit: today,
          nominal_diterima: inv.total,
          metode_pembayaran: payment_method || 'Transfer Bank',
          diterima_oleh: received_by || 'Bendahara',
          keterangan: notes || 'Pembayaran via API',
          created_by: createdBy
        });

        receiptId = createRes.insertId;
        nomorKwitansi = createRes.nomor_kwitansi;

        // Generate receipt PDF
        let pdfRelPath = null;
        try {
          receipt = await ReceiptModel.findById(receiptId);
          pdfRelPath = await generateReceiptPdf(receipt, inv, null);
          await ReceiptModel.updatePdfPath(receiptId, pdfRelPath);
        } catch (pdfErr) {
          console.error('Kwitansi PDF generation warning:', pdfErr.message);
        }
      } else {
        receiptId = receipt.id;
        nomorKwitansi = receipt.nomor_kwitansi;
      }

      // 3. Mark transaction as paid (lunas)
      if (trx.status_konfirmasi !== 'lunas') {
        await TransactionModel.approve(trx.id, req.user?.id || null);
        await onTransactionPaid(trx.id, nomorKwitansi);
      }

      return res.status(201).json({
        status: 'success',
        message: 'Kwitansi pembayaran berhasil diterbitkan.',
        data: {
          receipt_id: receiptId,
          nomor_kwitansi: nomorKwitansi,
          amount: inv.total,
          payment_method: payment_method || 'Transfer Bank',
          pdf_url: `/api/receipts/${receiptId}/pdf` // Using existing download route format
        }
      });
    } catch (err) {
      console.error('Error in generateReceipt:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan saat membuat kwitansi.'
      });
    }
  }

  static async getReceipt(req, res) {
    const { external_transaction_id } = req.params;
    const clientId = req.apiClient.id;

    try {
      const trx = await TransactionModel.findByExternalId(external_transaction_id, clientId);
      if (!trx) {
        return res.status(404).json({
          status: 'error',
          code: 'TRANSACTION_NOT_FOUND',
          message: 'Transaksi eksternal tidak ditemukan.'
        });
      }

      const inv = await InvoiceModel.findByTransaksiId(trx.id);
      if (!inv) {
        return res.status(404).json({
          status: 'error',
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice tidak ditemukan.'
        });
      }

      const receipt = await ReceiptModel.findByInvoiceId(inv.id);
      if (!receipt) {
        return res.status(404).json({
          status: 'error',
          code: 'RECEIPT_NOT_FOUND',
          message: 'Kwitansi pembayaran belum diterbitkan.'
        });
      }

      const fullDetails = await ReceiptModel.findById(receipt.id);

      return res.status(200).json({
        status: 'success',
        data: fullDetails
      });
    } catch (err) {
      console.error('Error in getReceipt:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan pada server.'
      });
    }
  }
}

export default ReceiptApiController;
