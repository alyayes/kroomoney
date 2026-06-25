import ReceiptModel from '../models/receiptModel.js';
import InvoiceModel from '../models/invoiceModel.js';
import TransactionModel from '../models/transactionModel.js';
import AuditLogModel from '../models/auditLogModel.js';
import { pool } from '../config/db.js';
import { generateReceiptPdf, getReceiptPreviewHtml } from '../services/pdfService.js';
import { sendEmail } from '../services/emailService.js';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function formatItemList(items) {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} dan ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, dan ${items[items.length - 1]}`;
}

function mapReceipt(r) {
  return {
    id: r.id,
    nomorKwitansi: r.nomor_kwitansi,
    invoiceId: r.invoice_id,
    nomorInvoice: r.nomor_invoice || null,
    pelangganId: r.pelanggan_id,
    namaPelanggan: r.nama_pelanggan || r.nama_manual || 'Manual',
    noWhatsapp: r.no_whatsapp || '-',
    tanggalTerbit: r.tanggal_terbit,
    nominalDiterima: r.nominal_diterima,
    metodePembayaran: r.metode_pembayaran,
    diterimaOleh: r.diterima_oleh,
    keterangan: r.keterangan,
    pdfPath: r.pdf_path || null,
    tanggalKirimWa: r.tanggal_kirim_wa,
    tanggalKirimEmail: r.tanggal_kirim_email,
    statusKirim: r.status_kirim,
    createdAt: r.created_at,
  };
}

// GET /api/receipts
export const getAllReceipts = async (req, res) => {
  try {
    const rows = await ReceiptModel.findAll();
    return res.status(200).json({ status: 'success', data: rows.map(mapReceipt), total: rows.length });
  } catch (err) {
    console.error('getAllReceipts error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data kwitansi.' });
  }
};

// GET /api/receipts/:id
export const getReceiptById = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });
    return res.status(200).json({ status: 'success', data: mapReceipt(r) });
  } catch (err) {
    console.error('getReceiptById error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil kwitansi.' });
  }
};

// POST /api/receipts/generate/:invoiceId
export const generateReceipt = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const inv = await InvoiceModel.findById(invoiceId);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });
    if (inv.status_invoice !== 'dibayar') {
      return res.status(400).json({ status: 'error', message: 'Kwitansi hanya bisa dibuat untuk invoice yang sudah dibayar.' });
    }
    const existing = await ReceiptModel.findByInvoiceId(invoiceId);
    if (existing) {
      return res.status(409).json({ status: 'error', message: `Kwitansi sudah ada: ${existing.nomor_kwitansi}` });
    }

    const { metodePembayaran, diterimaOleh, keterangan } = req.body;
    const [userRow] = await pool.query('SELECT nama_lengkap, tanda_tangan FROM users WHERE id = ?', [req.user.id]);

    const { insertId, nomor_kwitansi } = await ReceiptModel.create({
      invoice_id: parseInt(invoiceId),
      pelanggan_id: inv.pelanggan_id || null,
      nama_manual: inv.nama_manual || null,
      tanggal_terbit: new Date().toISOString().split('T')[0],
      nominal_diterima: inv.total,
      metode_pembayaran: metodePembayaran || 'Transfer Bank',
      diterima_oleh: diterimaOleh || userRow[0]?.nama_lengkap || 'Bendahara',
      keterangan: keterangan || null,
      created_by: req.user.id,
    });

    // Generate PDF
    try {
      const receipt = await ReceiptModel.findById(insertId);
      const ttd = userRow[0]?.tanda_tangan || null;
      const signerName = userRow[0]?.nama_lengkap || null;
      const pdfPath = await generateReceiptPdf(receipt, inv, ttd, signerName);
      await ReceiptModel.updatePdfPath(insertId, pdfPath);
    } catch (pdfErr) {
      console.error('Kwitansi PDF warning:', pdfErr.message);
    }

    await logAudit(req, `Generate Kwitansi ${nomor_kwitansi} dari Invoice ${inv.nomor_invoice}`);
    return res.status(201).json({ status: 'success', message: `Kwitansi ${nomor_kwitansi} berhasil dibuat!`, data: { id: insertId, nomorKwitansi: nomor_kwitansi } });
  } catch (err) {
    console.error('generateReceipt error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal membuat kwitansi.' });
  }
};

// GET /api/receipts/:id/preview — returns HTML
export const previewReceipt = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });
    const inv = r.invoice_id ? await InvoiceModel.findById(r.invoice_id) : null;
    const [userRow] = await pool.query('SELECT tanda_tangan FROM users WHERE id = ?', [r.created_by || req.user.id]);
    const ttd = userRow[0]?.tanda_tangan || null;
    const html = await getReceiptPreviewHtml(r, inv, ttd);
    return res.setHeader('Content-Type', 'text/html').send(html);
  } catch (err) {
    console.error('previewReceipt error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal memuat preview.' });
  }
};

// GET /api/receipts/:id/pdf
export const downloadReceiptPdf = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });

    // Always regenerate to ensure the correct signer and template are used
    const inv = r.invoice_id ? await InvoiceModel.findById(r.invoice_id) : null;
    const [userRow] = await pool.query('SELECT nama_lengkap, tanda_tangan FROM users WHERE id = ?', [req.user.id]);
    const ttd = userRow[0]?.tanda_tangan || null;
    const signerName = userRow[0]?.nama_lengkap || null;
    
    const pdfRelPath = await generateReceiptPdf(r, inv, ttd, signerName);
    await ReceiptModel.updatePdfPath(r.id, pdfRelPath);

    const absPath = join(join(__dirname, '..'), pdfRelPath);
    res.setHeader('Content-Type', 'application/pdf');
    
    const customerName = (r.nama_pelanggan || r.nama_manual || 'Pelanggan').replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
    const filename = `Kwitansi_${customerName}.pdf`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(absPath);
  } catch (err) {
    console.error('downloadReceiptPdf error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengunduh PDF.' });
  }
};

// POST /api/receipts/:id/send-email
export const sendReceiptEmail = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });

    const to = req.body.emailTujuan || req.body.email;
    if (!to) return res.status(400).json({ status: 'error', message: 'Email tujuan wajib diisi.' });

    const inv = r.invoice_id ? await InvoiceModel.findById(r.invoice_id) : null;
    const [userRow] = await pool.query('SELECT nama_lengkap, tanda_tangan FROM users WHERE id = ?', [r.created_by || req.user.id]);
    const ttd = userRow[0]?.tanda_tangan || null;
    const signerName = userRow[0]?.nama_lengkap || null;
    
    const pdfRelPath = await generateReceiptPdf(r, inv, ttd, signerName);
    await ReceiptModel.updatePdfPath(r.id, pdfRelPath);

    const nominal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(r.nominal_diterima);
    const customerName = r.nama_pelanggan || r.nama_manual || 'Pelanggan';

    await sendEmail({
      to,
      subject: `Kwitansi Pembayaran ${r.nomor_kwitansi} — Kroombox`,
      html: `<p>Halo <strong>${customerName}</strong>,</p>
             <p>Terlampir adalah kwitansi pembayaran Anda: <strong>${r.nomor_kwitansi}</strong></p>
             <p>Nominal diterima: <strong>${nominal}</strong></p>
             <p>Terima kasih atas pembayaran Anda.<br><strong>Tim Kroombox</strong></p>`,
      attachments: [{ filename: `${r.nomor_kwitansi}.pdf`, path: join(join(__dirname, '..'), pdfRelPath) }],
    });

    await ReceiptModel.markSentEmail(r.id);
    await logAudit(req, `Kirim Kwitansi ${r.nomor_kwitansi} via Email ke ${to}`);
    return res.status(200).json({ status: 'success', message: `Kwitansi berhasil dikirim ke ${to}.` });
  } catch (err) {
    console.error('sendReceiptEmail error:', err);
    return res.status(500).json({ status: 'error', message: `Gagal kirim email: ${err.message}` });
  }
};

// PATCH /api/receipts/:id/send-wa
export const markReceiptSentWa = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });

    const noWa = req.body.noWhatsapp || r.no_whatsapp;
    const nominal = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(r.nominal_diterima);
    const customerName = r.nama_pelanggan || r.nama_manual || 'Pelanggan';

    let waLink = null;
    if (noWa) {
      const waNumber = noWa.replace(/\D/g, '').replace(/^0/, '62');
      const msg = encodeURIComponent(`Halo ${customerName},\n\nKwitansi pembayaran Anda:\n*${r.nomor_kwitansi}*\nNominal: *${nominal}*\n\nTerima kasih! 🙏\n- Kroombox`);
      waLink = `https://wa.me/${waNumber}?text=${msg}`;
    }

    await ReceiptModel.markSentWa(r.id);
    await logAudit(req, `Kirim Kwitansi ${r.nomor_kwitansi} via WhatsApp`);
    return res.status(200).json({ status: 'success', waLink, message: 'Status kwitansi diperbarui.' });
  } catch (err) {
    console.error('markReceiptSentWa error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal update status.' });
  }
};

// PATCH /api/receipts/:id/send-email (legacy compatibility)
export const markReceiptSentEmail = async (req, res) => {
  return sendReceiptEmail(req, res);
};

// DELETE /api/receipts/:id
export const deleteReceipt = async (req, res) => {
  try {
    const r = await ReceiptModel.findById(req.params.id);
    if (!r) return res.status(404).json({ status: 'error', message: 'Kwitansi tidak ditemukan.' });
    await ReceiptModel.delete(req.params.id);
    await logAudit(req, `Hapus Kwitansi ${r.nomor_kwitansi}`);
    return res.status(200).json({ status: 'success', message: 'Kwitansi berhasil dihapus.' });
  } catch (err) {
    console.error('deleteReceipt error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus kwitansi.' });
  }
};

async function logAudit(req, aktivitas) {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    await AuditLogModel.create({
      user_id: req.user.id,
      action: aktivitas,
      ip_address: ip
    });
  } catch {}
}

export const downloadReceiptPdfByTransactionId = async (req, res) => {
  try {
    const { transaksiId } = req.params;

    const trx = await TransactionModel.findById(transaksiId);
    if (!trx) {
      return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan.' });
    }

    // Find invoice by transaction ID (receipt needs an invoice)
    let inv = await InvoiceModel.findByTransaksiId(transaksiId);

    if (!inv) {
      // Auto-generate invoice
      const today = new Date().toISOString().split('T')[0];
      
      let hasItems = false;
      if (trx.items) {
        try {
          const parsedItems = typeof trx.items === 'string' ? JSON.parse(trx.items) : trx.items;
          if (Array.isArray(parsedItems) && parsedItems.length > 0) {
            hasItems = true;
          }
        } catch (err) {}
      }

      const subtotal = hasItems ? trx.nominal_transfer : Math.ceil(trx.nominal_transfer * (trx.kuantitas || 1));
      const total = subtotal;

      const invResult = await InvoiceModel.create({
        transaksi_id: transaksiId,
        pelanggan_id: trx.pelanggan_id || null,
        nama_manual: trx.nama_manual || null,
        no_wa_manual: trx.no_whatsapp_manual || null,
        subtotal,
        diskon: 0,
        total,
        tanggal_terbit: today,
        tanggal_jatuh_tempo: today,
        catatan: 'Auto-generated for download',
        catatan_internal: 'Auto-generated via direct download',
        created_by: req.user.id,
      });

      inv = await InvoiceModel.findById(invResult.insertId);
    }

    // Now, synchronize/heal the invoice items and totals with the transaction items
    let invoiceItems = [];
    if (trx.items) {
      try {
        const parsedItems = typeof trx.items === 'string' ? JSON.parse(trx.items) : trx.items;
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          invoiceItems = parsedItems.map(item => {
            const hargaSatuan = Number(String(item.jumlah || item.harga || 0).replace(/\D/g, '')) || 0;
            const kuantitas = Number(item.kuantitas) || 1;
            const diskonNominal = Number(String(item.diskon || 0).replace(/\D/g, '')) || 0;
            const subtotal = Math.max(0, (hargaSatuan * kuantitas) - diskonNominal);
            return {
              deskripsi: item.namaPembeli || item.deskripsi || 'Detail Layanan',
              sub_deskripsi: item.notes || item.sub_deskripsi || null,
              kuantitas,
              harga_satuan: hargaSatuan,
              diskon_persen: item.diskon_persen ? Number(item.diskon_persen) : 0,
              subtotal
            };
          });
        }
      } catch (err) {}
    }

    if (invoiceItems.length === 0) {
      invoiceItems = [{
        deskripsi: trx.notes || 'Pembelian Layanan',
        sub_deskripsi: null,
        kuantitas: trx.kuantitas || 1,
        harga_satuan: trx.nominal_transfer / (trx.kuantitas || 1),
        diskon_persen: 0,
        subtotal: trx.nominal_transfer,
      }];
    }

    // Perform database sync: delete old items and insert fresh mapped items
    await pool.query('DELETE FROM invoice_items WHERE invoice_id = ?', [inv.id]);
    await InvoiceModel.createItems(inv.id, invoiceItems);

    // Update invoice subtotal, diskon, total in the database
    const subtotal = invoiceItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    const total = Math.max(0, subtotal - (inv.diskon || 0));
    await pool.query('UPDATE invoices SET subtotal = ?, total = ? WHERE id = ?', [subtotal, total, inv.id]);

    // Update our memory copy of invoice for receipt generation
    inv.subtotal = subtotal;
    inv.total = total;

    // Now find/create receipt
    let r = await ReceiptModel.findByInvoiceId(inv.id);

    if (!r) {
      // Auto-generate receipt
      const [userRow] = await pool.query('SELECT nama_lengkap, tanda_tangan FROM users WHERE id = ?', [req.user.id]);
      
      const autoKeterangan = invoiceItems && invoiceItems.length > 0
        ? formatItemList(invoiceItems.map(i => i.deskripsi).filter(Boolean))
        : null;

      const { insertId } = await ReceiptModel.create({
        invoice_id: parseInt(inv.id),
        pelanggan_id: inv.pelanggan_id || null,
        nama_manual: inv.nama_manual || null,
        tanggal_terbit: new Date().toISOString().split('T')[0],
        nominal_diterima: inv.total,
        metode_pembayaran: 'Transfer Bank',
        diterima_oleh: userRow[0]?.nama_lengkap || 'Bendahara',
        keterangan: autoKeterangan || null,
        created_by: req.user.id,
      });

      r = await ReceiptModel.findById(insertId);
    } else {
      // Update receipt's nominal_diterima to match the corrected invoice total
      await pool.query('UPDATE receipts SET nominal_diterima = ? WHERE id = ?', [inv.total, r.id]);
      r.nominal_diterima = inv.total;
    }

    // Generate fresh receipt PDF
    const [userRow] = await pool.query('SELECT nama_lengkap, tanda_tangan FROM users WHERE id = ?', [req.user.id]);
    const ttd = userRow[0]?.tanda_tangan || null;
    const signerName = userRow[0]?.nama_lengkap || null;
    const pdfRelPath = await generateReceiptPdf(r, inv, ttd, signerName);
    await ReceiptModel.updatePdfPath(r.id, pdfRelPath);

    const absPath = join(join(__dirname, '..'), pdfRelPath);
    res.setHeader('Content-Type', 'application/pdf');
    
    const customerName = (r.nama_pelanggan || r.nama_manual || 'Pelanggan').replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
    const filename = `Kwitansi_${customerName}.pdf`;
    
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.sendFile(absPath);
  } catch (err) {
    console.error('downloadReceiptPdfByTransactionId error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengunduh PDF.' });
  }
};
