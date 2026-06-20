import InvoiceModel from '../models/invoiceModel.js';
import TransactionModel from '../models/transactionModel.js';
import ReceiptModel from '../models/receiptModel.js';
import AuditLogModel from '../models/auditLogModel.js';
import CashBookModel from '../models/cashBookModel.js';
import { pool } from '../config/db.js';
import { generateInvoicePdf, getInvoicePreviewHtml } from '../services/pdfService.js';
import { sendEmail } from '../services/emailService.js';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { onInvoiceGenerated, onTransactionPaid, onTransactionCancelled } from '../services/callbackService.js';


const __dirname = dirname(fileURLToPath(import.meta.url));
const STORAGE_ROOT = join(__dirname, '..', 'storage');

// Helper: map invoice row to API response
function mapInvoice(i) {
  return {
    id: i.id,
    nomorInvoice: i.nomor_invoice,
    transaksiId: i.transaksi_id,
    pelangganId: i.pelanggan_id,
    namaPelanggan: i.nama_pelanggan || i.nama_manual || 'Manual',
    noWhatsapp: i.no_whatsapp || i.no_wa_manual || '-',
    paketHosting: i.paket_hosting || '-',
    subtotal: i.subtotal,
    diskon: i.diskon,
    total: i.total,
    pdfPath: i.pdf_path || null,
    statusInvoice: i.status_invoice,
    tanggalTerbit: i.tanggal_terbit,
    tanggalJatuhTempo: i.tanggal_jatuh_tempo,
    tanggalKirimWa: i.tanggal_kirim_wa,
    tanggalKirimEmail: i.tanggal_kirim_email,
    tanggalBayar: i.tanggal_bayar,
    catatan: i.catatan,
    catatanInternal: i.catatan_internal,
    dibuatOleh: i.dibuat_oleh_nama || null,
    createdAt: i.created_at,
    updatedAt: i.updated_at,
  };
}

// GET /api/invoices
export const getAllInvoices = async (req, res) => {
  try {
    const rows = await InvoiceModel.findAll();
    return res.status(200).json({
      status: 'success',
      data: rows.map(mapInvoice),
      total: rows.length
    });
  } catch (err) {
    console.error('getAllInvoices error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data invoice.' });
  }
};

// GET /api/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    const inv = await InvoiceModel.findById(req.params.id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });
    return res.status(200).json({ status: 'success', data: mapInvoice(inv) });
  } catch (err) {
    console.error('getInvoiceById error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil invoice.' });
  }
};

// POST /api/invoices/generate/:transaksiId
export const generateInvoice = async (req, res) => {
  try {
    const { transaksiId } = req.params;

    const trx = await TransactionModel.findById(transaksiId);
    if (!trx) return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan.' });

    const existing = await InvoiceModel.findByTransaksiId(transaksiId);
    if (existing) {
      return res.status(409).json({
        status: 'error',
        message: `Invoice sudah ada: ${existing.nomor_invoice}`
      });
    }

    const { tanggalJatuhTempo, diskon = 0, catatan, catatanInternal, items } = req.body;

    if (!tanggalJatuhTempo) {
      return res.status(400).json({ status: 'error', message: 'Tanggal jatuh tempo wajib diisi.' });
    }

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
    const total = Math.max(0, subtotal - (diskon || 0));
    const today = new Date().toISOString().split('T')[0];

    const { insertId, nomor_invoice } = await InvoiceModel.create({
      transaksi_id: transaksiId,
      pelanggan_id: trx.pelanggan_id || null,
      nama_manual: trx.nama_manual || null,
      no_wa_manual: trx.no_whatsapp_manual || null,
      subtotal,
      diskon: diskon || 0,
      total,
      tanggal_terbit: today,
      tanggal_jatuh_tempo: tanggalJatuhTempo,
      catatan: catatan || null,
      catatan_internal: catatanInternal || null,
      created_by: req.user.id,
    });

    // Save invoice items
    let invoiceItems = (items && items.length > 0) ? items : [];

    if (invoiceItems.length === 0 && trx.items) {
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
      } catch (err) {
        console.error("Error parsing trx.items:", err);
      }
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

    await InvoiceModel.createItems(insertId, invoiceItems);

    // Generate PDF
    try {
      const inv = await InvoiceModel.findById(insertId);
      const pdfItems = await InvoiceModel.findItemsByInvoiceId(insertId);
      // Get TTD from user record
      const [userRow] = await pool.query('SELECT tanda_tangan FROM users WHERE id = ?', [req.user.id]);
      const ttd = userRow[0]?.tanda_tangan || null;
      const pdfPath = await generateInvoicePdf(inv, pdfItems, ttd);
      await InvoiceModel.updatePdfPath(insertId, pdfPath);
    } catch (pdfErr) {
      console.error('PDF generation warning (non-fatal):', pdfErr.message);
    }

    await logAudit(req, `Menerbitkan Invoice ${nomor_invoice} dari Transaksi #${transaksiId}`);

    // Check if API transaction and trigger callback
    if (trx.source_type === 'api' && trx.external_transaction_id) {
      try {
        await onInvoiceGenerated(trx.id, nomor_invoice, total, tanggalJatuhTempo);
      } catch (cbErr) {
        console.error('Callback trigger error on generate invoice:', cbErr.message);
      }
    }

    return res.status(201).json({
      status: 'success',
      message: `Invoice ${nomor_invoice} berhasil diterbitkan!`,
      data: { id: insertId, nomorInvoice: nomor_invoice, total, tanggalJatuhTempo }
    });
  } catch (err) {
    console.error('generateInvoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal menerbitkan invoice.' });
  }
};

// GET /api/invoices/:id/preview — returns HTML for browser preview
export const previewInvoice = async (req, res) => {
  try {
    const inv = await InvoiceModel.findById(req.params.id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });
    const items = await InvoiceModel.findItemsByInvoiceId(inv.id);
    const [userRow] = await pool.query('SELECT tanda_tangan FROM users WHERE id = ?', [inv.created_by || req.user.id]);
    const ttd = userRow[0]?.tanda_tangan || null;
    const html = await getInvoicePreviewHtml(inv, items, ttd);
    return res.setHeader('Content-Type', 'text/html').send(html);
  } catch (err) {
    console.error('previewInvoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal memuat preview.' });
  }
};

// GET /api/invoices/:id/pdf — download PDF
export const downloadInvoicePdf = async (req, res) => {
  try {
    const inv = await InvoiceModel.findById(req.params.id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });

    // Regenerate if pdf_path not set or file missing
    let pdfRelPath = inv.pdf_path;
    if (!pdfRelPath || !existsSync(join(join(__dirname, '..'), pdfRelPath))) {
      const items = await InvoiceModel.findItemsByInvoiceId(inv.id);
      const [userRow] = await pool.query('SELECT tanda_tangan FROM users WHERE id = ?', [inv.created_by || req.user.id]);
      const ttd = userRow[0]?.tanda_tangan || null;
      pdfRelPath = await generateInvoicePdf(inv, items, ttd);
      await InvoiceModel.updatePdfPath(inv.id, pdfRelPath);
    }

    const absPath = join(join(__dirname, '..'), pdfRelPath);
    res.setHeader('Content-Type', 'application/pdf');
    const sanitizedFilename = inv.nomor_invoice.replace(/\//g, '-');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.pdf"`);
    return res.sendFile(absPath);
  } catch (err) {
    console.error('downloadInvoicePdf error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengunduh PDF.' });
  }
};

// POST /api/invoices/:id/send-email
export const sendInvoiceEmail = async (req, res) => {
  try {
    const inv = await InvoiceModel.findById(req.params.id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });

    const { emailTujuan } = req.body;
    const to = emailTujuan || req.body.email;
    if (!to) return res.status(400).json({ status: 'error', message: 'Email tujuan wajib diisi.' });

    // Ensure PDF exists
    let pdfRelPath = inv.pdf_path;
    if (!pdfRelPath || !existsSync(join(join(__dirname, '..'), pdfRelPath))) {
      const items = await InvoiceModel.findItemsByInvoiceId(inv.id);
      const [userRow] = await pool.query('SELECT tanda_tangan FROM users WHERE id = ?', [inv.created_by || req.user.id]);
      const ttd = userRow[0]?.tanda_tangan || null;
      pdfRelPath = await generateInvoicePdf(inv, items, ttd);
      await InvoiceModel.updatePdfPath(inv.id, pdfRelPath);
    }

    const total = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(inv.total);
    const customerName = inv.nama_pelanggan || inv.nama_manual || 'Pelanggan';
    const tanggalJT = inv.tanggal_jatuh_tempo ? new Date(inv.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';

    await sendEmail({
      to,
      subject: `Invoice ${inv.nomor_invoice} — Kroombox`,
      html: `<p>Halo <strong>${customerName}</strong>,</p>
             <p>Terlampir adalah invoice <strong>${inv.nomor_invoice}</strong> dengan total tagihan <strong>${total}</strong>.</p>
             <p>Harap melakukan pembayaran sebelum <strong>${tanggalJT}</strong>.</p>
             <p>Terima kasih,<br><strong>Tim Kroombox</strong></p>`,
      attachments: [{ filename: `${inv.nomor_invoice}.pdf`, path: join(join(__dirname, '..'), pdfRelPath) }],
    });

    await InvoiceModel.update(inv.id, { tanggal_kirim_email: new Date() });
    await logAudit(req, `Kirim Invoice ${inv.nomor_invoice} via Email ke ${to}`);

    return res.status(200).json({ status: 'success', message: `Invoice berhasil dikirim ke ${to}.` });
  } catch (err) {
    console.error('sendInvoiceEmail error:', err);
    return res.status(500).json({ status: 'error', message: `Gagal kirim email: ${err.message}` });
  }
};

// POST /api/invoices/:id/send-wa — returns WA link (frontend opens wa.me)
export const sendInvoiceWa = async (req, res) => {
  try {
    const inv = await InvoiceModel.findById(req.params.id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });

    const noWa = req.body.noWhatsapp || inv.no_whatsapp || inv.no_wa_manual;
    if (!noWa) return res.status(400).json({ status: 'error', message: 'Nomor WhatsApp tidak ditemukan.' });

    const total = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(inv.total);
    const customerName = inv.nama_pelanggan || inv.nama_manual || 'Pelanggan';
    const tanggalJT = inv.tanggal_jatuh_tempo ? new Date(inv.tanggal_jatuh_tempo).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    const waNumber = noWa.replace(/\D/g, '').replace(/^0/, '62');
    const message = encodeURIComponent(`Halo ${customerName},\n\nBerikut invoice dari Kroombox:\n*${inv.nomor_invoice}*\nTotal: *${total}*\nJatuh Tempo: *${tanggalJT}*\n\nMohon segera melakukan pembayaran. Terima kasih!`);
    const waLink = `https://wa.me/${waNumber}?text=${message}`;

    await InvoiceModel.markSentWa(inv.id);
    await logAudit(req, `Kirim Invoice ${inv.nomor_invoice} via WhatsApp ke ${noWa}`);

    return res.status(200).json({ status: 'success', waLink, message: 'Link WhatsApp berhasil dibuat.' });
  } catch (err) {
    console.error('sendInvoiceWa error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal membuat link WhatsApp.' });
  }
};

// PATCH /api/invoices/:id/status
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const valid = ['draft', 'terkirim', 'dibayar', 'overdue', 'dibatalkan'];
    if (!valid.includes(status)) {
      return res.status(400).json({ status: 'error', message: `Status tidak valid. Pilih: ${valid.join(', ')}` });
    }

    const inv = await InvoiceModel.findById(id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });

    await InvoiceModel.update(id, {
      status_invoice: status,
      ...(status === 'dibayar' ? { tanggal_bayar: new Date() } : {}),
    });

    // Auto-generate kwitansi bila dibayar
    let receiptId = null;
    if (status === 'dibayar') {
      const existingReceipt = await ReceiptModel.findByInvoiceId(id);
      if (!existingReceipt) {
        const [userRow] = await pool.query('SELECT nama_lengkap, tanda_tangan FROM users WHERE id = ?', [req.user.id]);
        const { nomor_kwitansi, insertId } = await ReceiptModel.create({
          invoice_id: parseInt(id),
          pelanggan_id: inv.pelanggan_id || null,
          nama_manual: inv.nama_manual || null,
          tanggal_terbit: new Date().toISOString().split('T')[0],
          nominal_diterima: inv.total,
          metode_pembayaran: 'Transfer Bank',
          diterima_oleh: userRow[0]?.nama_lengkap || 'Bendahara',
          created_by: req.user.id,
        });
        receiptId = insertId;
        // Generate kwitansi PDF
        try {
          const receipt = await ReceiptModel.findById(receiptId);
          const ttd = userRow[0]?.tanda_tangan || null;
          const pdfPath = await generateReceiptPdf(receipt, inv, ttd);
          await ReceiptModel.updatePdfPath(receiptId, pdfPath);
        } catch (pdfErr) {
          console.error('Kwitansi PDF warning:', pdfErr.message);
        }
        await logAudit(req, `Auto-generate Kwitansi ${nomor_kwitansi} dari Invoice ${inv.nomor_invoice}`);
        
        // Auto-create Cash Book entry for income
        await CashBookModel.create({
          type: 'income',
          transaction_id: inv.transaksi_id,
          invoice_id: parseInt(id),
          receipt_id: receiptId,
          amount: inv.total,
          category: 'hosting',
          description: `Income from Invoice ${inv.nomor_invoice}`,
          entry_date: new Date().toISOString().split('T')[0],
          created_by: req.user.id
        });
      }
    }

    // Trigger callbacks for API transactions if paid or cancelled
    try {
      const trx = await TransactionModel.findById(inv.transaksi_id);
      if (trx && trx.source_type === 'api' && trx.external_transaction_id) {
        if (status === 'dibayar') {
          const receipt = await ReceiptModel.findByInvoiceId(id);
          if (receipt) {
            await onTransactionPaid(trx.id, receipt.nomor_kwitansi);
          }
        } else if (status === 'dibatalkan') {
          await onTransactionCancelled(trx.id, 'Invoice cancelled by administrator');
        }
      }
    } catch (cbErr) {
      console.error('Callback trigger error on invoice status update:', cbErr.message);
    }

    await logAudit(req, `Update status Invoice ${inv.nomor_invoice} → ${status}`);
    return res.status(200).json({ status: 'success', message: `Status berhasil diubah ke "${status}".` });
  } catch (err) {
    console.error('updateInvoiceStatus error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal update status.' });
  }
};

// PUT /api/invoices/:id
export const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await InvoiceModel.findById(id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });
    if (inv.status_invoice === 'dibayar') {
      return res.status(400).json({ status: 'error', message: 'Invoice yang sudah dibayar tidak dapat diedit.' });
    }
    const { diskon, catatan, catatanInternal, tanggalJatuhTempo } = req.body;
    await InvoiceModel.update(id, {
      ...(diskon !== undefined ? { diskon, total: Math.max(0, inv.subtotal - diskon) } : {}),
      ...(catatan !== undefined ? { catatan } : {}),
      ...(catatanInternal !== undefined ? { catatan_internal: catatanInternal } : {}),
      ...(tanggalJatuhTempo ? { tanggal_jatuh_tempo: tanggalJatuhTempo } : {}),
    });
    await logAudit(req, `Edit Invoice ${inv.nomor_invoice}`);
    return res.status(200).json({ status: 'success', message: 'Invoice berhasil diperbarui.' });
  } catch (err) {
    console.error('updateInvoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal memperbarui invoice.' });
  }
};

// DELETE /api/invoices/:id
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await InvoiceModel.findById(id);
    if (!inv) return res.status(404).json({ status: 'error', message: 'Invoice tidak ditemukan.' });
    if (inv.status_invoice !== 'draft') {
      return res.status(400).json({ status: 'error', message: 'Hanya invoice Draft yang dapat dihapus.' });
    }
    await InvoiceModel.delete(id);
    await logAudit(req, `Hapus Invoice ${inv.nomor_invoice}`);
    return res.status(200).json({ status: 'success', message: 'Invoice berhasil dihapus.' });
  } catch (err) {
    console.error('deleteInvoice error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus invoice.' });
  }
};

// Import needed for receipt PDF generation inside updateInvoiceStatus
import { generateReceiptPdf } from '../services/pdfService.js';

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

export const downloadInvoicePdfByTransactionId = async (req, res) => {
  try {
    const { transaksiId } = req.params;

    // Find invoice by transaction ID
    let inv = await InvoiceModel.findByTransaksiId(transaksiId);
    
    // Fetch transaction
    const trx = await TransactionModel.findById(transaksiId);
    if (!trx) {
      return res.status(404).json({ status: 'error', message: 'Transaksi tidak ditemukan.' });
    }

    // Determine if we need to auto-generate or heal the invoice
    if (!inv) {
      // Auto-generate invoice record
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

      const result = await InvoiceModel.create({
        transaksi_id: transaksiId,
        pelanggan_id: trx.pelanggan_id || null,
        nama_manual: trx.nama_manual || null,
        no_wa_manual: trx.no_whatsapp_manual || null,
        subtotal,
        diskon: 0,
        total,
        tanggal_terbit: today,
        tanggal_jatuh_tempo: today, // default to today
        catatan: 'Auto-generated for download',
        catatan_internal: 'Auto-generated via direct download',
        created_by: req.user.id,
      });

      inv = await InvoiceModel.findById(result.insertId);
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

    // Update our memory copy of invoice for PDF generation
    inv.subtotal = subtotal;
    inv.total = total;

    // Generate PDF and update pdf_path (we ALWAYS force regenerate on download to guarantee accuracy!)
    const [userRow] = await pool.query('SELECT tanda_tangan FROM users WHERE id = ?', [inv.created_by || req.user.id]);
    const ttd = userRow[0]?.tanda_tangan || null;
    
    // Generate fresh PDF
    const pdfRelPath = await generateInvoicePdf(inv, invoiceItems, ttd);
    await InvoiceModel.updatePdfPath(inv.id, pdfRelPath);

    const absPath = join(join(__dirname, '..'), pdfRelPath);
    res.setHeader('Content-Type', 'application/pdf');
    const sanitizedFilename = inv.nomor_invoice.replace(/\//g, '-');
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedFilename}.pdf"`);
    return res.sendFile(absPath);
  } catch (err) {
    console.error('downloadInvoicePdfByTransactionId error:', err);
    return res.status(500).json({ status: 'error', message: 'Gagal mengunduh PDF.' });
  }
};
