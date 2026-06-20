/**
 * pdfService.js
 * PDF generation using Puppeteer.
 * Produces HTML → PDF that is pixel-perfect with user's template.
 */

import puppeteer from 'puppeteer';
import { pool } from '../config/db.js';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const STORAGE_DIR = join(__dirname, '..', 'storage');

// Load logo kb.jpeg as base64 for PDF rendering
const logoPath = join(__dirname, '..', '..', 'src', 'assests', 'logo kb.jpeg');
let logoBase64 = '';
try {
  if (fs.existsSync(logoPath)) {
    const logoData = fs.readFileSync(logoPath);
    logoBase64 = `data:image/jpeg;base64,${logoData.toString('base64')}`;
  }
} catch (err) {
  console.error('Error loading logo kb.jpeg in pdfService:', err);
}

// ─── Helpers ───────────────────────────────────────────────────
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

// ─── Invoice HTML Template ──────────────────────────────────────
export function buildInvoiceHtml(invoice, items, company, tandaTangan) {
  const tanggal = new Date(invoice.tanggal_terbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const customerName = invoice.nama_pelanggan || invoice.nama_manual || 'Pelanggan';
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
          <th class="th-center" style="width: 10%;">JUMLAH</th>
          <th class="th-right" style="width: 17%;">HARGA SATUAN</th>
          <th class="th-right" style="width: 18%;">TOTAL HARGA</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
      </tbody>
    </table>
  </div>

  <div class="bottom-section">
    <!-- SUMMARY -->
    <div class="summary-wrap">
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

// ─── Kwitansi HTML Template ─────────────────────────────────────
export function buildKwitansiHtml(receipt, invoice, company, tandaTangan) {
  const tanggal = new Date(receipt.tanggal_terbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const customerName = receipt.nama_pelanggan || receipt.nama_manual || 'Pelanggan';
  const nominal = Number(receipt.nominal_diterima) || 0;
  const nomorKwt = receipt.nomor_kwitansi;
  const nomorInv = invoice?.nomor_invoice || '-';
  const keterangan = receipt.keterangan || 'Nota Terlampir';
  const terbilangText = terbilang(nominal) + ' Rupiah';
  const ttdSrc = tandaTangan || null;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', 'Georgia', serif;
    background: #fff; color: #111;
    width: 210mm; height: 297mm;
    display: flex; align-items: center; justify-content: center;
  }
  .kwt-box {
    width: 170mm;
    border: 2px solid #1a3a6b;
    padding: 0;
    background: #fff;
    box-shadow: 0 0 10px rgba(0,0,0,0.05);
  }

  /* HEADER */
  .kwt-header {
    display: flex; align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid #aaa;
  }
  .kwt-logo { display: flex; align-items: center; gap: 8px; margin-right: auto; }
  .kwt-logo-img { height: 140px; object-fit: contain; }
  .kwt-title {
    font-size: 18px; font-weight: 700;
    letter-spacing: 2px; text-decoration: underline;
    text-align: center; flex: 1;
    font-family: Arial, sans-serif;
    color: #1a3a6b;
  }
  .kwt-header-right { margin-left: auto; width: 45px; }

  /* META ROW */
  .kwt-meta {
    display: flex; justify-content: space-between;
    padding: 14px 24px;
    font-size: 13px;
    border-bottom: 1px solid #eee;
    background: #fcfcfc;
  }

  /* BODY */
  .kwt-body { padding: 24px; min-height: 180px; }
  .kwt-row { display: flex; gap: 8px; margin-bottom: 14px; font-size: 14px; line-height: 1.6; }
  .kwt-lbl { min-width: 160px; color: #444; font-weight: 600; }
  .kwt-colon { margin-right: 8px; color: #444; }
  .kwt-val { font-weight: 700; border-bottom: 1px dotted #ccc; flex: 1; padding-bottom: 2px; }
  .kwt-terbilang { font-size: 15px; font-weight: 700; font-style: italic; background: #f9f9f9; padding: 4px 8px; border-radius: 4px; border: 1px solid #eee; }

  /* FOOTER */
  .kwt-footer {
    display: flex; justify-content: space-between; align-items: flex-end;
    padding: 16px 24px 24px 24px;
    border-top: 1px solid #eee;
    background: #fafafa;
  }
  .kwt-nominal-box {
    border: 2px double #1a3a6b;
    padding: 10px 20px;
    background: #fff;
  }
  .kwt-nominal {
    font-size: 26px; font-weight: 900; color: #1a3a6b;
    font-family: Arial, sans-serif;
    letter-spacing: -0.5px;
  }
  .kwt-sign { text-align: center; min-width: 200px; }
  .kwt-sign-city { font-size: 12px; color: #555; margin-bottom: 6px; }
  .kwt-sign-area {
    position: relative; width: 200px; height: 80px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 6px;
  }
  .kwt-sign-logo {
    position: absolute; opacity: 0.12;
    display: flex; align-items: center; justify-content: center;
  }
  .kwt-sign-logo-img { height: 55px; object-fit: contain; }
  .kwt-sign-img {
    position: relative; z-index: 2;
    max-height: 74px; max-width: 190px;
    object-fit: contain;
  }
  .kwt-sign-name {
    font-size: 13px; font-weight: 700; color: #111;
    border-top: 1.5px solid #555; padding-top: 4px;
    text-align: center; font-family: Arial, sans-serif;
  }
</style>
</head>
<body>
<div class="kwt-box">
  <!-- HEADER -->
  <div class="kwt-header">
    <div class="kwt-logo">
      ${logoBase64 ? `<img class="kwt-logo-img" src="${logoBase64}" alt="Logo" />` : ''}
    </div>
    <div class="kwt-title">KWITANSI PEMBAYARAN</div>
    <div class="kwt-header-right"></div>
  </div>

  <!-- META -->
  <div class="kwt-meta">
    <span>No. : <strong>${nomorKwt}</strong></span>
    <span>Tanggal : <strong>${tanggal}</strong></span>
  </div>

  <!-- BODY -->
  <div class="kwt-body">
    <div class="kwt-row">
      <span class="kwt-lbl">Terima Dari</span>
      <span class="kwt-colon">:</span>
      <span class="kwt-val">${customerName}</span>
    </div>
    <div class="kwt-row">
      <span class="kwt-lbl">Uang Sejumlah</span>
      <span class="kwt-colon">:</span>
      <span class="kwt-val kwt-terbilang">${terbilangText}</span>
    </div>
    <div class="kwt-row">
      <span class="kwt-lbl">Untuk Pembayaran</span>
      <span class="kwt-colon">:</span>
      <span class="kwt-val">${keterangan}</span>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="kwt-footer">
    <div class="kwt-nominal-box">
      <div class="kwt-nominal">Rp${nominal.toLocaleString('id-ID')},-</div>
    </div>
    <div class="kwt-sign">
      <div class="kwt-sign-city">${company.city}, ${tanggal}</div>
      <div class="kwt-sign-area">
        <!-- Logo watermark -->
        <div class="kwt-sign-logo">
          ${logoBase64 ? `<img class="kwt-sign-logo-img" src="${logoBase64}" alt="Watermark" />` : ''}
        </div>
        <!-- Signature image -->
        ${ttdSrc ? `<img class="kwt-sign-img" src="${ttdSrc}" alt="TTD"/>` : '<div style="height:74px;"></div>'}
      </div>
      <div class="kwt-sign-name">${company.signerName}</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── Core PDF Generator ─────────────────────────────────────────
let _browser = null;

async function getBrowser() {
  if (_browser && _browser.connected) return _browser;
  _browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  return _browser;
}

async function htmlToPdf(html, outputPath) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      format: 'A5',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } finally {
    await page.close();
  }
  return outputPath;
}

// ─── Public API ─────────────────────────────────────────────────

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
export async function generateReceiptPdf(receipt, invoice, tandaTangan = null) {
  const company = await getCompanySettings();
  const html = buildKwitansiHtml(receipt, invoice, company, tandaTangan);

  const dir = join(STORAGE_DIR, 'receipts');
  await mkdir(dir, { recursive: true });
  const filename = `${receipt.nomor_kwitansi}.pdf`;
  const absPath = join(dir, filename);

  await htmlToPdf(html, absPath);
  return `storage/receipts/${filename}`;
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
