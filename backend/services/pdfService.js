/**
 * pdfService.js
 * PDF generation using Puppeteer.
 * Produces HTML ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ PDF that is pixel-perfect with user's template.
 */

import puppeteer from 'puppeteer';
import { pool } from '../config/db.js';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { renderReportHtml } from './_reportTemplate.js';


const __dirname = dirname(fileURLToPath(import.meta.url));
const STORAGE_DIR = join(__dirname, '..', 'storage');

// Load logo kb.jpeg as base64 for PDF rendering
const logoPath = join(__dirname, '..', '..', 'src', 'assets', 'logo kb.jpeg');
let logoBase64 = '';
try {
  const exists = fs.existsSync(logoPath);
  console.log('[PDFService] Logo path:', logoPath, 'Exists:', exists);
  if (exists) {
    const logoData = fs.readFileSync(logoPath);
    logoBase64 = `data:image/jpeg;base64,${logoData.toString('base64')}`;
    console.log('[PDFService] Logo successfully loaded, base64 length:', logoBase64.length);
  } else {
    console.warn('[PDFService] Logo file NOT found at:', logoPath);
  }
} catch (err) {
  console.error('Error loading logo kb.jpeg in pdfService:', err);
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Helpers ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
export function formatRp(n) {
  if (!n && n !== 0) return 'Rp0';
  return 'Rp' + Number(n).toLocaleString('id-ID');
}

export function terbilang(n) {
  n = Math.floor(Math.abs(Number(n)));
  if (n === 0) return 'Nol';
  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan',
    'Sepuluh', 'Sebelas', 'Dua Belas', 'Tiga Belas', 'Empat Belas', 'Lima Belas',
    'Enam Belas', 'Tujuh Belas', 'Delapan Belas', 'Sembilan Belas'];
  if (n < 20) return satuan[n];
  if (n < 100) return satuan[Math.floor(n / 10)] + ' Puluh' + (n % 10 !== 0 ? ' ' + satuan[n % 10] : '');
  if (n < 200) return 'Seratus' + (n % 100 !== 0 ? ' ' + terbilang(n % 100) : '');
  if (n < 1000) return satuan[Math.floor(n / 100)] + ' Ratus' + (n % 100 !== 0 ? ' ' + terbilang(n % 100) : '');
  if (n < 2000) return 'Seribu' + (n % 1000 !== 0 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu' + (n % 1000 !== 0 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta' + (n % 1000000 !== 0 ? ' ' + terbilang(n % 1000000) : '');
  return terbilang(Math.floor(n / 1000000000)) + ' Miliar' + (n % 1000000000 !== 0 ? ' ' + terbilang(n % 1000000000) : '');
}

export function formatDateIndo(dateInput) {
  if (!dateInput) return '-';
  try {
    let dateStr = '';
    if (typeof dateInput === 'string') {
      dateStr = dateInput;
    } else if (dateInput instanceof Date) {
      dateStr = dateInput.toISOString();
    } else {
      dateStr = String(dateInput);
    }
    const [year, month, day] = dateStr.substring(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (err) {
    console.error('Error formatting date:', err);
    return '-';
  }
}

async function getCompanySettings() {
  try {
    const keys = ['company_name', 'company_address', 'company_city', 'company_phone', 'company_email', 'company_website', 'signer_name', 'signer_title'];
    const [rows] = await pool.query(
      `SELECT setting_key, setting_value FROM settings WHERE setting_key IN (${keys.map(() => '?').join(',')})`,
      keys
    );
    const cfg = {};
    rows.forEach(r => { cfg[r.setting_key] = r.setting_value; });
    return {
      name: cfg.company_name || 'Kroombox',
      address: cfg.company_address || 'Ko+Lab Hub Studio, Gd.Selaru lt.4 Universitas Telkom',
      city: cfg.company_city || 'Bandung',
      phone: cfg.company_phone || '+62-878-9000-4465',
      email: cfg.company_email || 'kroombox11@gmail.com',
      website: cfg.company_website || 'kroombox.com',
      signerName: cfg.signer_name || 'Andi Ahmad N.',
      signerTitle: cfg.signer_title || 'Bendahara',
    };
  } catch {
    return {
      name: 'Kroombox', address: 'Ko+Lab Hub Studio, Gd.Selaru lt.4 Universitas Telkom',
      city: 'Bandung', phone: '+62-878-9000-4465',
      email: 'kroombox11@gmail.com', website: 'kroombox.com',
      signerName: 'Andi Ahmad N.', signerTitle: 'Bendahara',
    };
  }
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Invoice HTML Template ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
export function buildInvoiceHtml(invoice, items, company, tandaTangan) {
  const tanggal = formatDateIndo(invoice.tanggal_terbit);
  const tanggalJatuhTempo = invoice.tanggal_jatuh_tempo 
    ? formatDateIndo(invoice.tanggal_jatuh_tempo)
    : '-';
  const customerName = invoice.nama_pelanggan || invoice.nama_manual || 'Pelanggan';
  const noWa = invoice.no_whatsapp || invoice.no_wa_manual || '-';
  const catatan = invoice.catatan || '-';
  const invNumber = invoice.nomor_invoice;
  
  const printTime = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

  // Item rows
  const itemRowsHtml = items.map(item => `
    <tr>
      <td class="td-desc">
        <span class="item-name">${item.deskripsi || ''}</span>
        ${item.sub_deskripsi ? `<span class="item-sub">${item.sub_deskripsi}</span>` : ''}
      </td>
      <td class="td-center">${item.kuantitas}</td>
      <td class="td-right">${formatRp(item.harga_satuan)}</td>
      <td class="td-right">${formatRp(item.subtotal)}</td>
    </tr>`).join('');

  const subtotal = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0) || invoice.subtotal || 0;
  const diskonHtml = invoice.diskon > 0 ? `
    <div class="s-row" style="color: #ef4444; font-weight: 700;">
      <span style="color: #ef4444; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase;">DISKON</span>
      <span>- ${formatRp(invoice.diskon)}</span>
    </div>` : '';
  const total = invoice.total !== undefined ? invoice.total : Math.max(0, subtotal - (invoice.diskon || 0));

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: A5 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
    width: 148mm; height: 210mm;
    background: #ffffff; color: #333333;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .page {
    width: 148mm; height: 210mm;
    padding: 10mm 12mm;
    display: flex; flex-direction: column;
    justify-content: space-between;
    background: #ffffff;
    box-sizing: border-box;
  }
  .top-section {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  
  /* HEADER */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .logo-img {
    height: 140px;
    object-fit: contain;
  }
  .header-right {
    text-align: right;
  }
  .invoice-title {
    font-size: 22px;
    font-weight: 900;
    color: #1a1a1a;
    letter-spacing: 2px;
    margin-bottom: 4px;
    text-transform: uppercase;
  }
  .invoice-number {
    font-size: 12px;
    font-weight: 700;
    color: #1a3a6b;
  }

  /* INFO COLUMNS */
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    padding-top: 15px;
    border-top: 1px solid #f0f0f0;
  }
  .info-col-title {
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  .info-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 11px;
    line-height: 1.4;
  }
  .info-row {
    display: flex;
  }
  .info-label {
    width: 100px;
    color: #64748b;
    flex-shrink: 0;
  }
  .info-colon {
    width: 12px;
    color: #64748b;
    flex-shrink: 0;
  }
  .info-value {
    font-weight: 500;
    color: #334155;
  }
  .info-value.bold {
    font-weight: 700;
    color: #0f172a;
  }

  .divider-main {
    height: 2px;
    background: #1a3a6b;
    margin-top: 10px;
  }

  /* TABLE */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  thead tr {
    background: #1a3a6b;
  }
  thead th {
    font-size: 10px;
    font-weight: 800;
    color: #ffffff;
    padding: 8px 10px;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  thead th:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }
  thead th:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }
  thead th.th-center { text-align: center; }
  thead th.th-right { text-align: right; }

  tbody tr {
    border-bottom: 1px solid #f1f5f9;
  }
  .td-desc {
    padding: 12px 10px;
    text-align: left;
    vertical-align: top;
  }
  .item-name {
    font-size: 12px;
    font-weight: 700;
    color: #1a3a6b;
    text-decoration: none;
  }
  .item-sub {
    display: block;
    font-size: 10px;
    color: #94a3b8;
    margin-top: 4px;
  }
  .td-center {
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    text-align: center;
    padding: 12px 10px;
    vertical-align: top;
  }
  .td-right {
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    text-align: right;
    padding: 12px 10px;
    vertical-align: top;
  }
  tr.empty-row {
    height: 35px;
  }
  tr.empty-row td {
    border-bottom: 1px solid #f8fafc;
  }

  /* SUMMARY */
  .bottom-section {
    display: flex;
    flex-direction: column;
    gap: 25px;
  }
  .summary-wrap {
    display: flex;
    justify-content: flex-end;
  }
  .summary-table {
    width: 280px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 11px;
  }
  .s-row {
    display: flex;
    justify-content: space-between;
    font-weight: 700;
    color: #475569;
    padding-bottom: 6px;
    border-bottom: 1px solid #f1f5f9;
  }
  .s-row.total-belanja {
    color: #1a3a6b;
  }
  .s-row.total-tagihan {
    border-top: 2px solid #e2e8f0;
    border-bottom: 2px solid #e2e8f0;
    padding: 8px 0;
    color: #0f172a;
  }
  .s-lbl-tagihan {
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .s-val-tagihan {
    font-size: 15px;
    font-weight: 900;
    color: #1a3a6b;
  }

  /* PAYMENT & FOOTER */
  .meta-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 1px solid #f1f5f9;
    padding-top: 15px;
  }
  .payment-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .payment-title {
    font-size: 9px;
    font-weight: 800;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .payment-val {
    font-size: 11px;
    font-weight: 700;
    color: #334155;
  }
  .update-time {
    font-size: 10px;
    color: #94a3b8;
    font-style: italic;
  }
  .footer-disclaimer {
    border-top: 1px solid #f1f5f9;
    padding-top: 10px;
    font-size: 9px;
    color: #94a3b8;
    line-height: 1.5;
  }
</style>
</head>
<body>
<div class="page">
  <div class="top-section">
    <!-- HEADER -->
    <div class="header">
      <div>
        ${logoBase64 ? `<img class="logo-img" src="${logoBase64}" alt="Logo" />` : ''}
      </div>
      <div class="header-right">
        <div class="invoice-title">I N V O I C E</div>
        <div class="invoice-number">${invNumber}</div>
      </div>
    </div>

    <!-- SENDER / RECEIVER INFO -->
    <div class="info-grid">
      <!-- Sender -->
      <div>
        <div class="info-col-title">DITERBITKAN ATAS NAMA</div>
        <div class="info-details">
          <div class="info-row">
            <span class="info-label">Penjual</span>
            <span class="info-colon">:</span>
            <span class="info-value bold">${company.name}</span>
          </div>
        </div>
      </div>

      <!-- Receiver -->
      <div>
        <div class="info-col-title">UNTUK</div>
        <div class="info-details">
          <div class="info-row">
            <span class="info-label">Pembeli</span>
            <span class="info-colon">:</span>
            <span class="info-value bold" style="text-transform: uppercase;">
              ${customerName}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Tanggal Pembelian</span>
            <span class="info-colon">:</span>
            <span class="info-value bold">${tanggal}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- DIVIDER -->
    <div class="divider-main"></div>

    <!-- TABLE -->
    <table>
      <thead>
        <tr>
          <th style="width: 55%;">INFO PRODUK</th>
          <th class="th-center" style="width: 10%;">QTY</th>
          <th class="th-right" style="width: 17%;">HARGA SATUAN</th>
          <th class="th-right" style="width: 18%;">TOTAL HARGA</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>

    <!-- SUMMARY -->
    <div class="summary-wrap" style="margin-top: 15px;">
      <div class="summary-table">
        <div class="s-row">
          <span style="color: #94a3b8; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase;">TOTAL HARGA (${items.reduce((sum, i) => sum + (Number(i.kuantitas) || 0), 0)} BARANG)</span>
          <span style="color: #334155;">${formatRp(subtotal)}</span>
        </div>
        ${diskonHtml}
        <div class="s-row total-belanja">
          <span style="color: #94a3b8; font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase;">TOTAL BELANJA</span>
          <span style="color: #334155;">${formatRp(total)}</span>
        </div>
        <div class="s-row total-tagihan">
          <span class="s-lbl-tagihan">TOTAL TAGIHAN</span>
          <span class="s-val-tagihan">${formatRp(total)}</span>
        </div>
      </div>
    </div>
  </div>

  <div class="bottom-section">
    <!-- METADATA & DISCLAIMER -->
    <div>
      <div class="meta-row">
        <div class="payment-info" style="display: flex; flex-direction: column; gap: 4px;">
          <span class="payment-title">Hubungi Kami</span>
          <span class="payment-val" style="display: flex; align-items: center; font-size: 11px; font-weight: 700; color: #334155; text-decoration: none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            kroombox11@gmail.com
          </span>
          <span class="payment-val" style="display: flex; align-items: center; font-size: 11px; font-weight: 700; color: #334155; text-decoration: none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a3a6b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 5px;"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
            kroombox.com
          </span>
        </div>
        <div class="update-time">
          Dicetak pada: ${printTime}
    </div>
  </div>
</div>
</body>
</html>`;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Kwitansi HTML Template ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
export function buildKwitansiHtml(receipt, invoice, company, tandaTangan, customSignerName = null) {
  const tanggal = formatDateIndo(receipt.tanggal_terbit);
  const customerName = (receipt.nama_pelanggan || receipt.nama_manual || 'Pelanggan').toUpperCase();
  const nominal = Number(receipt.nominal_diterima) || 0;
  const nomorKwt = receipt.nomor_kwitansi;
  const keterangan = receipt.keterangan || 'Nota Terlampir';
  const terbilangText = terbilang(nominal) + ' Rupiah';
  const ttdSrc = tandaTangan || null;
  const companyName = company.name || 'KroomBox';
  const finalSignerName = customSignerName || receipt.diterima_oleh || company.signerName || 'Pimpinan';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900&display=swap" rel="stylesheet">
<style>
  @page { size: A4 landscape; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 297mm;
    height: 210mm;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    background: #ffffff;
    overflow: hidden;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: 'Poppins', sans-serif;
    color: #111;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 210mm;
  }
  .kwt-container {
    width: 290mm !important;
    height: 200mm !important;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    padding: 45px 70px;
    position: relative;
    box-sizing: border-box;
  }
  
  /* HEADER */
  .header {
    display: flex;
    align-items: center;
    border-bottom: 2px solid #1a3a6b;
    padding-bottom: 15px;
    margin-bottom: 40px;
    position: relative;
    height: 140px;
  }
  .logo-wrapper {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
  }
  .logo-img {
    height: 120px;
    object-fit: contain;
    mix-blend-mode: multiply;
  }
  .title {
    width: 100%;
    text-align: center;
    font-size: 22px;
    font-weight: 800;
    color: #0b2559;
    letter-spacing: 2px;
    text-transform: uppercase;
    padding-left: 160px;
    padding-right: 290px;
    box-sizing: border-box;
  }
  .company-header-info {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    text-align: right;
    font-size: 10px;
    color: #64748b;
    font-weight: 600;
    line-height: 1.4;
    max-width: 320px;
  }
  .company-header-name {
    font-size: 12px;
    font-weight: 800;
    color: #0b2559;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }

  /* BODY */
  .body-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 18px;
    font-size: 16px;
  }
  .row {
    display: flex;
    line-height: 1.5;
  }
  .row-split {
    display: flex;
    justify-content: space-between;
  }
  .col-left {
    display: flex;
    width: 65%;
  }
  .col-right {
    display: flex;
    width: 35%;
  }
  .label {
    width: 180px;
    color: #111;
  }
  .label-short {
    width: 100px;
    color: #111;
  }
  .colon {
    width: 20px;
    color: #111;
  }
  .value {
    flex: 1;
    font-weight: 600;
    color: #111;
  }
  .value-box {
    flex: 1;
    border: 1px solid #111;
    padding: 4px 10px;
    font-weight: 600;
  }
  .value-nominal {
    font-size: 20px;
    font-weight: 700;
  }

  /* SIGNATURE BLOCK */
  .bottom-row {
    display: flex;
    align-items: flex-start;
    margin-top: 0;
  }
  .sign-box {
    position: absolute;
    bottom: 30px;
    right: 70px;
    width: 250px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .contact-box {
    position: absolute;
    bottom: 30px;
    left: 70px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .contact-title {
    font-size: 11px;
    font-weight: 800;
    color: #94a3b8;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .contact-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
  }
  .sign-title {
    font-size: 16px;
    color: #111;
    margin-bottom: 5px;
    font-weight: 500;
  }
  .sign-img {
    height: 100px;
    object-fit: contain;
    margin: 5px 0;
  }
  .sign-date {
    font-size: 14px;
    font-weight: bold;
    color: #111;
    margin-bottom: 5px;
  }
  .sign-name {
    font-size: 16px;
    font-weight: 700;
    color: #111;
    display: inline-block;
  }
</style>
</head>
<body>
<div class="kwt-container">
  <div class="header">
    <div class="logo-wrapper">
      ${logoBase64 ? `<img class="logo-img" src="${logoBase64}" alt="Logo" />` : `<div style="font-size:28px; font-weight:800; color:#1a3a6b;">KroomBox</div>`}
    </div>
    <div class="title">KWITANSI PEMBAYARAN</div>
    <div class="company-header-info">
      <div class="company-header-name">KroomBox</div>
      <div>${company.address}</div>
      <div>${company.website || 'kroombox.com'} | ${company.email || 'kroombox11@gmail.com'}</div>
    </div>
  </div>

  <!-- BODY CONTENT -->
  <div class="body-content">
    <div class="row-split">
      <div class="col-left">
        <div class="label">No. Kwitansi</div>
        <div class="colon">:</div>
        <div class="value">${nomorKwt}</div>
      </div>
      <div class="col-right" style="justify-content: flex-end;">
        <div class="label-short">Tanggal</div>
        <div class="colon">:</div>
        <div class="value" style="flex: none; width: 150px;">${tanggal}</div>
      </div>
    </div>

    <div class="row">
      <div class="label">Telah diterima dari</div>
      <div class="colon">:</div>
      <div class="value">${customerName}</div>
    </div>

    <div class="row">
      <div class="label">Uang Sejumlah</div>
      <div class="colon">:</div>
      <div class="value value-nominal">Rp ${nominal.toLocaleString('id-ID')}</div>
    </div>

    <div class="row">
      <div class="label">Untuk Keperluan</div>
      <div class="colon">:</div>
      <div class="value">${keterangan}</div>
    </div>

    <div class="bottom-row">
      <div style="flex: 1; display: flex;">
        <div class="label">Terbilang</div>
        <div class="colon">:</div>
        <div class="value" style="font-style: italic;">${terbilangText}</div>
      </div>
    </div>
  </div>
  <!-- SIGNATURE BLOCK -->
  <div class="sign-box">
    <div class="sign-date">Bandung, ${tanggal}</div>
    <div class="sign-title">Yang Menerima</div>
    <div style="position: relative; height: 120px; width: 100%;">
      ${ttdSrc ? `<img src="${ttdSrc}" alt="TTD" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); max-height: 100px; max-width: 220px; object-fit: contain; z-index: 1; mix-blend-mode: multiply; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />` : ''}
      ${logoBase64 ? `<img src="${logoBase64}" alt="Cap KroomBox" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 140px; height: 140px; object-fit: contain; opacity: 0.35; z-index: 2; mix-blend-mode: multiply; -webkit-print-color-adjust: exact; print-color-adjust: exact;" />` : ''}
    </div>
    <div class="sign-name">${finalSignerName}</div>
  </div>
</div>
</body>
</html>`;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Core PDF Generator ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
let _browser = null;

async function getBrowser() {
  if (_browser && _browser.connected) return _browser;
  _browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  return _browser;
}

async function htmlToPdf(html, outputPath, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: options.format || 'A5',
      landscape: options.landscape || false,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } finally {
    await page.close();
  }
}

export async function htmlToPdfBuffer(html, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      format: options.format || 'A4',
      landscape: options.landscape || false,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return buffer;
  } finally {
    await page.close();
  }
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Public API ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

/**
 * Generate Invoice PDF
 * @param {object} invoice - invoice row from DB (joined with customer)
 * @param {Array}  items   - invoice_items rows
 * @param {string|null} tandaTangan - base64 TTD (unused in invoice but kept for extensibility)
 * @returns {string} relative path like storage/invoices/INV-202607-0001.pdf
 */
export async function generateInvoicePdf(invoice, items, tandaTangan = null) {
  const company = await getCompanySettings();
  const html = buildInvoiceHtml(invoice, items, company, tandaTangan);

  const dir = join(STORAGE_DIR, 'invoices');
  await mkdir(dir, { recursive: true });
  const filename = `${invoice.nomor_invoice}.pdf`;
  const absPath = join(dir, filename);

  await htmlToPdf(html, absPath);
  return `storage/invoices/${filename}`;
}

/**
 * Generate Kwitansi PDF
 * @param {object} receipt  - receipt row from DB (joined with customer)
 * @param {object} invoice  - linked invoice row
 * @param {string|null} tandaTangan - base64 TTD
 * @returns {string} relative path like storage/receipts/KWT-202607-0001.pdf
 */
export async function generateReceiptPdf(receipt, invoice, tandaTangan = null, customSignerName = null) {
  const company = await getCompanySettings();
  const html = buildKwitansiHtml(receipt, invoice, company, tandaTangan, customSignerName);

  const dir = join(STORAGE_DIR, 'receipts');
  await mkdir(dir, { recursive: true });
  const filename = `${receipt.nomor_kwitansi}.pdf`;
  const absPath = join(dir, filename);

  await htmlToPdf(html, absPath, { format: 'A4', landscape: true });
  return `storage/receipts/${filename}`;
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Laporan Keuangan HTML Template ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
export function buildReportHtml(data, company, profile) {
  const { transactions, allTransactions, aiInsight } = data;
  let logoBase64Image = logoBase64 || company.logoBase64 || null;
  if (!logoBase64Image) {
    try {
      const lp = join(__dirname, '..', '..', 'src', 'assets', 'logo kb.jpeg');
      if (fs.existsSync(lp)) {
        logoBase64Image = `data:image/jpeg;base64,${fs.readFileSync(lp).toString('base64')}`;
      }
    } catch(e) {}
  }
  const printTime = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });
  const indoDateOnly = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const signerName = profile?.nama || company.signerName || 'Andi Ahmad N.';
  const _roleRaw = profile?.role || company.signerTitle || 'Bendahara';
  const _roleMap = { 'Treasurer': 'Bendahara', 'Manager': 'Manajer', 'Director': 'Direktur', 'President': 'Presiden', 'Secretary': 'Sekretaris', 'Chairman': 'Ketua', 'Cashier': 'Kasir', 'Accountant': 'Akuntan' };
  const signerTitle = _roleMap[_roleRaw] || _roleRaw;
  const signatureImg = profile?.tandaTangan || null;
  const signatureCity = company.city || 'Bandung';

  // Sort chronologically oldest first
  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
  );

  // Date range
  let dateRangeStr = '';
  let startDate = null;
  if (sortedTransactions.length > 0) {
    const minDate = sortedTransactions[0].tanggal;
    const maxDate = sortedTransactions[sortedTransactions.length - 1].tanggal;
    startDate = new Date(minDate);
    const fmt = (d) => { const [y, m, dd] = d.split('-'); return `${dd}/${m}/${y}`; };
    dateRangeStr = `${fmt(minDate)} - ${fmt(maxDate)}`;
  } else {
    dateRangeStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Amount helper
  const getTransactionAmount = (t) => {
    let itemsArr = [];
    if (t.items) {
      if (typeof t.items === 'string') { try { itemsArr = JSON.parse(t.items); } catch { itemsArr = []; } }
      else if (Array.isArray(t.items)) { itemsArr = t.items; }
    }
    const base = itemsArr.length > 0 ? Number(t.jumlah || 0) : Number(t.jumlah || 0) * Number(t.kuantitas || 1);
    return Math.max(0, base - Number(t.diskon || 0));
  };

  // Opening balances (before period)
  let initialCash = 0, initialFixedAssets = 0, initialLiabilities = 0;
  let initialRevenue = 0, initialExpense = 0, initialEquityFromTrx = 0;

  if (startDate && allTransactions && allTransactions.length > 0) {
    allTransactions.forEach(t => {
      if (new Date(t.tanggal).getTime() < startDate.getTime()) {
        const amount = getTransactionAmount(t);
        const desc = ((t.namaPembeli || '') + ' ' + (t.notes || '')).toLowerCase();
        const isFinancing = desc.includes('modal') || desc.includes('pinjaman') || desc.includes('utang') || desc.includes('ekuitas') || desc.includes('prive') || desc.includes('hutang');
        const isInvesting = desc.includes('aset') || desc.includes('peralatan') || desc.includes('investasi') || desc.includes('kendaraan') || desc.includes('laptop') || desc.includes('gedung') || desc.includes('komputer');
        if (t.tipe === 'Debit') initialCash += amount; else initialCash -= amount;
        if (isInvesting) { if (t.tipe === 'Kredit') initialFixedAssets += amount; else initialFixedAssets -= amount; }
        else if (isFinancing) {
          if (desc.includes('pinjam') || desc.includes('utang') || desc.includes('hutang') || desc.includes('loan')) {
            if (t.tipe === 'Debit') initialLiabilities += amount; else initialLiabilities -= amount;
          } else {
            if (t.tipe === 'Debit') initialEquityFromTrx += amount; else initialEquityFromTrx -= amount;
          }
        } else {
          if (t.tipe === 'Debit') initialRevenue += amount; else initialExpense += amount;
        }
      }
    });
  }
  const initialEquity = initialEquityFromTrx + (initialRevenue - initialExpense);

  // Current period
  let penerimaanPelanggan = 0, pendapatanLainnya = 0, pembayaranPemasok = 0, pengeluaranOperasional = 0;
  let purchaseOfAssets = 0, saleOfAssets = 0;
  let loanReceived = 0, loanPaid = 0, equityAddition = 0, equityPrive = 0;
  let totalIncome = 0, totalExpenseRaw = 0;

  sortedTransactions.forEach(t => {
    const amount = getTransactionAmount(t);
    const desc = ((t.namaPembeli || '') + ' ' + (t.notes || '')).toLowerCase();
    if (t.tipe === 'Debit') totalIncome += amount; else totalExpenseRaw += amount;
    const isFinancing = desc.includes('modal') || desc.includes('pinjaman') || desc.includes('utang') || desc.includes('ekuitas') || desc.includes('prive') || desc.includes('hutang');
    const isInvesting = desc.includes('aset') || desc.includes('peralatan') || desc.includes('investasi') || desc.includes('kendaraan') || desc.includes('laptop') || desc.includes('gedung') || desc.includes('komputer');
    if (isInvesting) {
      if (t.tipe === 'Kredit') purchaseOfAssets += amount; else saleOfAssets += amount;
    } else if (isFinancing) {
      if (desc.includes('pinjam') || desc.includes('utang') || desc.includes('hutang') || desc.includes('loan')) {
        if (t.tipe === 'Debit') loanReceived += amount; else loanPaid += amount;
      } else {
        if (t.tipe === 'Debit') equityAddition += amount; else equityPrive += amount;
      }
    } else {
      if (t.tipe === 'Debit') {
        if (desc.includes('lain') || desc.includes('bunga') || desc.includes('bonus')) pendapatanLainnya += amount;
        else penerimaanPelanggan += amount;
      } else {
        const isSupplier = desc.includes('hosting') || desc.includes('domain') || desc.includes('server') || desc.includes('cloud') || desc.includes('api') || desc.includes('layanan') || desc.includes('subscription') || desc.includes('sewa') || desc.includes('vps');
        if (isSupplier) pembayaranPemasok += amount; else pengeluaranOperasional += amount;
      }
    }
  });

  const revenueTotal = penerimaanPelanggan + pendapatanLainnya;
  const expenseTotal = pembayaranPemasok + pengeluaranOperasional;
  const labaRugiBersih = revenueTotal - expenseTotal;
  const modalSetoran = equityAddition;
  const modalPrive = equityPrive;
  const modalAkhir = initialEquity + modalSetoran - modalPrive + labaRugiBersih;
  const kasSetaraKas = initialCash + (revenueTotal - expenseTotal) + (saleOfAssets - purchaseOfAssets) + (loanReceived - loanPaid) + (modalSetoran - modalPrive);
  const endingFixedAssets = initialFixedAssets + purchaseOfAssets - saleOfAssets;
  const totalAset = kasSetaraKas + endingFixedAssets;
  const endingLiabilities = initialLiabilities + loanReceived - loanPaid;
  const totalLiabilitasEkuitas = endingLiabilities + modalAkhir;
  const totalOperating = revenueTotal - expenseTotal;
  const totalInvesting = saleOfAssets - purchaseOfAssets;
  const totalFinancing = (loanReceived - loanPaid) + (modalSetoran - modalPrive);
  const netChange = totalOperating + totalInvesting + totalFinancing;
  const endingCash = initialCash + netChange;

  // Format helper: accounting style
  function fv(n) {
    if (n === 0) return '0';
    const s = Math.abs(n).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return n < 0 ? `(${s})` : s;
  }
  function fvColor(n) {
    return n < 0 ? '#ef4444' : 'inherit';
  }

  const debitPct = totalIncome + totalExpenseRaw > 0 ? ((totalIncome / (totalIncome + totalExpenseRaw)) * 100).toFixed(1) : 0;
  const kreditPct = totalIncome + totalExpenseRaw > 0 ? ((totalExpenseRaw / (totalIncome + totalExpenseRaw)) * 100).toFixed(1) : 0;

  return renderReportHtml({
    company, profile, dateRangeStr, printTime, indoDateOnly,
    logoBase64Image, signerName, signerTitle, signatureImg, signatureCity,
    penerimaanPelanggan, pendapatanLainnya,
    pembayaranPemasok, pengeluaranOperasional,
    revenueTotal, expenseTotal, labaRugiBersih,
    saleOfAssets, purchaseOfAssets,
    loanReceived, loanPaid, equityAddition, equityPrive,
    totalOperating, totalInvesting, totalFinancing,
    netChange, initialCash, endingCash,
    aiInsight,
    fv,
  });
}

/**
 * Get HTML string for preview (no PDF write)
 */
export async function getInvoicePreviewHtml(invoice, items, tandaTangan = null) {
  const company = await getCompanySettings();
  return buildInvoiceHtml(invoice, items, company, tandaTangan);
}

export async function getReceiptPreviewHtml(receipt, invoice, tandaTangan = null) {
  const company = await getCompanySettings();
  return buildKwitansiHtml(receipt, invoice, company, tandaTangan);
}

export { getCompanySettings };

