import InvoiceModel from '../../../models/invoiceModel.js';
import TransactionModel from '../../../models/transactionModel.js';
import { generateInvoicePdf } from '../../../services/pdfService.js';
import { sendEmail } from '../../../services/emailService.js';
import { onInvoiceGenerated } from '../../../services/callbackService.js';
import { pool } from '../../../config/db.js';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

class InvoiceApiController {
  static async generateInvoice(req, res) {
    const { external_transaction_id, due_date, discount = 0, catatan, catatan_internal } = req.body;
    const clientId = req.apiClient.id;

    if (!external_transaction_id || !due_date) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'external_transaction_id dan due_date diperlukan.'
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

      const existing = await InvoiceModel.findByTransaksiId(trx.id);
      if (existing) {
        return res.status(409).json({
          status: 'error',
          code: 'INVOICE_ALREADY_EXISTS',
          message: `Invoice sudah diterbitkan untuk transaksi ini: ${existing.nomor_invoice}`,
          data: {
            nomor_invoice: existing.nomor_invoice,
            invoice_id: existing.id
          }
        });
      }

      const subtotal = Math.ceil(trx.nominal_transfer * trx.kuantitas);
      const total = Math.max(0, subtotal - Number(discount));
      const today = new Date().toISOString().split('T')[0];

      // Create invoice in database
      const createdBy = req.user?.id || 1; // Default to admin ID 1 if system/api key trigger
      const { insertId, nomor_invoice } = await InvoiceModel.create({
        transaksi_id: trx.id,
        pelanggan_id: trx.pelanggan_id,
        nama_manual: trx.nama_manual,
        no_wa_manual: trx.no_whatsapp_manual,
        subtotal,
        diskon: Number(discount),
        total,
        tanggal_terbit: today,
        tanggal_jatuh_tempo: due_date,
        catatan: catatan || null,
        catatan_internal: catatan_internal || null,
        created_by: createdBy
      });

      // Insert default item
      await InvoiceModel.createItems(insertId, [{
        deskripsi: trx.service_name,
        sub_deskripsi: trx.notes || null,
        kuantitas: trx.kuantitas,
        harga_satuan: trx.nominal_transfer,
        diskon_persen: 0,
        subtotal
      }]);

      // Generate PDF in background/safely
      let pdfRelPath = null;
      try {
        const inv = await InvoiceModel.findById(insertId);
        const pdfItems = await InvoiceModel.findItemsByInvoiceId(insertId);
        pdfRelPath = await generateInvoicePdf(inv, pdfItems, null);
        await InvoiceModel.updatePdfPath(insertId, pdfRelPath);
      } catch (pdfErr) {
        console.error('PDF Generation warning (non-fatal):', pdfErr.message);
      }

      // Trigger callback
      await onInvoiceGenerated(trx.id, nomor_invoice, total, due_date);

      return res.status(201).json({
        status: 'success',
        message: 'Invoice berhasil diterbitkan.',
        data: {
          invoice_id: insertId,
          nomor_invoice,
          total,
          due_date,
          pdf_url: pdfRelPath ? `/api/invoices/${insertId}/pdf` : null
        }
      });
    } catch (err) {
      console.error('Error in generateInvoice:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan saat menerbitkan invoice.'
      });
    }
  }

  static async getInvoice(req, res) {
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
          message: 'Invoice belum diterbitkan untuk transaksi ini.'
        });
      }

      const items = await InvoiceModel.findItemsByInvoiceId(inv.id);

      return res.status(200).json({
        status: 'success',
        data: {
          invoice: inv,
          items
        }
      });
    } catch (err) {
      console.error('Error in getInvoice:', err);
      return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Terjadi kesalahan pada server.'
      });
    }
  }

  static async sendInvoiceEmail(req, res) {
    const { external_transaction_id, email } = req.body;
    const clientId = req.apiClient.id;

    if (!external_transaction_id || !email) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_ERROR',
        message: 'external_transaction_id dan email diperlukan.'
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
        return res.status(404).json({
          status: 'error',
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice belum diterbitkan.'
        });
      }

      // Generate PDF if not existing
      let pdfRelPath = inv.pdf_path;
      if (!pdfRelPath || !existsSync(join(__dirname, '..', '..', pdfRelPath))) {
        const items = await InvoiceModel.findItemsByInvoiceId(inv.id);
        pdfRelPath = await generateInvoicePdf(inv, items, null);
        await InvoiceModel.updatePdfPath(inv.id, pdfRelPath);
      }

      const totalFormatted = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(inv.total);
      const customerName = inv.nama_pelanggan || inv.nama_manual || 'Customer';
      const dueFormatted = inv.tanggal_jatuh_tempo ? new Date(inv.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

      await sendEmail({
        to: email,
        subject: `Invoice ${inv.nomor_invoice} — Kroomoney`,
        html: `<p>Halo <strong>${customerName}</strong>,</p>
               <p>Terlampir adalah invoice <strong>${inv.nomor_invoice}</strong> dengan total tagihan <strong>${totalFormatted}</strong>.</p>
               <p>Harap melakukan pembayaran sebelum <strong>${dueFormatted}</strong>.</p>
               <p>Terima kasih,<br><strong>Tim Kroombox</strong></p>`,
        attachments: [{ filename: `${inv.nomor_invoice}.pdf`, path: join(__dirname, '..', '..', pdfRelPath) }],
      });

      await InvoiceModel.update(inv.id, { tanggal_kirim_email: new Date() });

      return res.status(200).json({
        status: 'success',
        message: `Invoice berhasil dikirim ke ${email}.`
      });
    } catch (err) {
      console.error('Error in sendInvoiceEmail:', err);
      return res.status(500).json({
        status: 'error',
        code: 'EMAIL_SEND_FAILED',
        message: `Gagal mengirim email: ${err.message}`
      });
    }
  }
}

export default InvoiceApiController;
