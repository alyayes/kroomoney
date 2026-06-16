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

// Load logo.png as base64 for PDF rendering
const logoPath = join(__dirname, '..', '..', 'public', 'logo.png');
let logoBase64 = '';
try {
  if (fs.existsSync(logoPath)) {
    const logoData = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
  }
} catch (err) {
  console.error('Error loading logo.png in pdfService:', err);
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
      email: cfg.company_email || 'kroombox@gmail.com',
      website: cfg.company_website || 'kroombox.com',
      signerName: cfg.signer_name || 'Andi Ahmad N.',
      signerTitle: cfg.signer_title || 'Bendahara',
    };
  } catch {
    return {
      name: 'Kroombox', address: 'Ko+Lab Hub Studio, Gd.Selaru lt.4 Universitas Telkom',
      city: 'Bandung', phone: '+62-878-9000-4465',
      email: 'kroombox@gmail.com', website: 'kroombox.com',
      signerName: 'Andi Ahmad N.', signerTitle: 'Bendahara',
    };
  }
}

// ─── Invoice HTML Template ──────────────────────────────────────
export function buildInvoiceHtml(invoice, items, company, tandaTangan) {
  const tanggal = new Date(invoice.tanggal_terbit).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const customerName = invoice.nama_pelanggan || invoice.nama_manual || 'Pelanggan';
  const invNumber = invoice.nomor_invoice;
  const invShort = invNumber.split('-').slice(1).join(''); // "2026060001"

  // Item rows
  const EMPTY_ROWS = 8;
  const itemRowsHtml = items.map(item => `
    <tr>
      <td class="td-desc">
        <span class="item-name">${item.deskripsi || ''}</span>
        ${item.sub_deskripsi ? `<span class="item-sub">${item.sub_deskripsi}</span>` : ''}
      </td>
      <td class="td-center">${item.kuantitas}</td>
      <td class="td-center">${formatRp(item.harga_satuan)}</td>
      <td class="td-center">${item.diskon_persen || 0}%</td>
      <td class="td-right">${formatRp(item.subtotal)}</td>
    </tr>`).join('');

  const emptyRowsHtml = Array(Math.max(0, EMPTY_ROWS - items.length)).fill(
    `<tr class="empty-row"><td></td><td></td><td></td><td></td><td></td></tr>`
  ).join('');

  const subtotal = items.reduce((s, i) => s + (Number(i.subtotal) || 0), 0) || invoice.subtotal || 0;
  const total = invoice.total || subtotal;
  const diskon = invoice.diskon || 0;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4 portrait; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
    width: 210mm; min-height: 297mm;
    background: #fff; color: #1a1a1a;
  }
  .page {
    width: 210mm; min-height: 297mm;
    display: flex; flex-direction: row;
  }

  /* LEFT GUTTER — rotated invoice number */
  .gutter {
    width: 44px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    border-right: 1px solid #f0f0f0;
  }
  .gutter-label {
    font-size: 30px; font-weight: 900; color: #1a3a6b;
    white-space: nowrap; letter-spacing: 2px;
    writing-mode: vertical-rl; transform: rotate(180deg);
    font-style: italic;
  }

  /* MAIN CONTENT */
  .main {
    flex: 1; padding: 36px 36px 28px 28px;
    display: flex; flex-direction: column;
  }

  /* HEADER */
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .company-info { display: flex; flex-direction: column; gap: 3px; }
  .company-name { font-size: 24px; font-weight: 900; color: #1a3a6b; }
  .company-subtitle { font-size: 10px; font-weight: 700; color: #666; letter-spacing: 1px; margin-bottom: 5px; }
  .company-addr { font-size: 11px; color: #555; line-height: 1.4; max-width: 320px; }
  .header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .logo-img { height: 45px; object-fit: contain; margin-bottom: 4px; }
  .title-invoice { font-size: 30px; font-weight: 900; color: #1a3a6b; letter-spacing: 1.5px; line-height: 1; }
  .invoice-num { font-size: 13px; font-weight: 700; color: #444; }

  .redline { height: 1.5px; background: #e05252; margin-bottom: 14px; }

  /* DATE / BILLING FOR */
  .info-row { display: grid; grid-template-columns: 220px 1fr; gap: 0; margin-bottom: 16px; }
  .info-label { font-size: 9.5px; font-weight: 700; color: #e05252; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 5px; }
  .info-val { font-size: 13px; font-weight: 600; color: #111; }
  .info-sub { font-size: 10px; color: #666; margin-top: 2px; }
  .thinline { height: 0.5px; background: #d0d0d0; margin-bottom: 18px; }

  /* ITEMS TABLE */
  table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  thead tr { background: #1a3a6b; }
  thead th {
    color: #fff; font-size: 10.5px; font-weight: 700;
    padding: 9px 10px; text-align: left;
    letter-spacing: 0.3px;
  }
  thead th.th-center { text-align: center; }
  thead th.th-right { text-align: right; }

  tbody tr { border-bottom: 1px solid #e0e0e0; }
  .td-desc { padding: 9px 10px; font-size: 11px; color: #222; }
  .item-name { display: block; font-weight: 500; }
  .item-sub { display: block; font-size: 10px; color: #666; margin-top: 1px; }
  .td-center { text-align: center; padding: 9px 10px; font-size: 11px; color: #222; }
  .td-right { text-align: right; padding: 9px 10px; font-size: 11px; color: #222; }
  tr.empty-row { height: 26px; }
  tr.empty-row td { border-bottom: 1px solid #f0f0f0; }

  /* SUMMARY */
  .summary-wrap { display: flex; justify-content: flex-end; margin-top: 6px; }
  .summary-table { width: 310px; }
  .s-row { display: flex; justify-content: space-between; border-bottom: 0.5px solid #e8e8e8; }
  .s-lbl { padding: 7px 10px; font-size: 11.5px; color: #555; text-align: right; flex: 1; }
  .s-val { padding: 7px 0 7px 10px; font-size: 11.5px; color: #222; min-width: 130px; text-align: right; }
  .s-row.amount-due { border-top: 2px solid #1a3a6b; border-bottom: none; }
  .s-row.amount-due .s-lbl { font-weight: 700; font-size: 12.5px; color: #1a3a6b; }
  .s-row.amount-due .s-val { font-weight: 700; font-size: 12.5px; color: #1a3a6b; }

  /* FOOTER */
  .footer {
    margin-top: auto; padding-top: 18px;
    border-top: 0.5px solid #ddd;
    display: flex; gap: 24px;
    font-size: 10px; color: #999;
  }
  .footer strong { color: #555; font-weight: 600; }
</style>
</head>
<body>
<div class="page">
  <div class="gutter">
    <div class="gutter-label">Invoice ${invShort}</div>
  </div>
  <div class="main">
    <!-- HEADER -->
    <div class="header">
      <div class="company-info">
        <div class="company-name">${company.name}</div>
        <div class="company-subtitle">FINANCE & CLOUD SOLUTIONS</div>
        <div class="company-addr">
          ${company.address}<br/>
          Tel: ${company.phone} | Email: ${company.email}
        </div>
      </div>
      <div class="header-right">
        ${logoBase64 ? `<img class="logo-img" src="${logoBase64}" alt="Logo" />` : ''}
        <div class="title-invoice">INVOICE</div>
        <div class="invoice-num">#${invoice.nomor_invoice}</div>
      </div>
    </div>

    <div class="redline"></div>

    <!-- DATE & BILLING FOR -->
    <div class="info-row">
      <div>
        <div class="info-label">Tanggal Terbit</div>
        <div class="info-val">${tanggal}</div>
      </div>
      <div>
        <div class="info-label">Ditagih Ke</div>
        <div class="info-val">${customerName}</div>
        ${invoice.no_whatsapp || invoice.no_wa_manual ? `<div class="info-sub">WA: ${invoice.no_whatsapp || invoice.no_wa_manual}</div>` : ''}
      </div>
    </div>
    <div class="thinline"></div>

    <!-- ITEMS TABLE -->
    <table>
      <thead>
        <tr>
          <th>Deskripsi</th>
          <th class="th-center">Jumlah</th>
          <th class="th-center">Harga Satuan</th>
          <th class="th-center">Diskon</th>
          <th class="th-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRowsHtml}
        ${emptyRowsHtml}
      </tbody>
    </table>

    <!-- SUMMARY -->
    <div class="summary-wrap">
      <div class="summary-table">
        <div class="s-row"><div class="s-lbl">Subtotal</div><div class="s-val">${formatRp(subtotal)}</div></div>
        <div class="s-row"><div class="s-lbl">Pajak (0%)</div><div class="s-val">Rp0</div></div>
        <div class="s-row amount-due"><div class="s-lbl"><strong>Total Tagihan</strong></div><div class="s-val"><strong>${formatRp(total)}</strong></div></div>
      </div>
    </div>

    <!-- TERMS & BANK DETAILS -->
    <div style="margin-top: 24px; padding-top: 14px; border-top: 1px solid #eee; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <div style="font-size: 9.5px; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Syarat Pembayaran & Catatan</div>
        <div style="font-size: 10px; color: #666; line-height: 1.4;">
          ${invoice.catatan || "Silakan lakukan pembayaran sebelum tanggal jatuh tempo. Terima kasih atas kerja sama Anda!"}
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 9.5px; font-weight: 700; color: #1a3a6b; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px;">Detail Transfer Bank</div>
        <div style="font-size: 10px; color: #666; line-height: 1.4;">
          <strong>Bank BCA</strong><br/>
          No. Rekening: 1234567890<br/>
          Nama: PT Kroombox Indonesia
        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <div class="footer">
      <span>Tel: <strong>${company.phone}</strong></span>
      <span>Email: <strong>${company.email}</strong></span>
      <span>Web: <strong>${company.website}</strong></span>
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
  @page { size: A4 portrait; margin: 30mm 20mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', 'Georgia', serif;
    background: #fff; color: #111;
    display: flex; align-items: flex-start; justify-content: center;
    padding: 0;
  }
  .kwt-box {
    width: 680px;
    border: 1.5px solid #555;
    padding: 0;
    background: #fff;
  }

  /* HEADER */
  .kwt-header {
    display: flex; align-items: center;
    padding: 14px 20px 12px 20px;
    border-bottom: 1px solid #aaa;
  }
  .kwt-logo { display: flex; align-items: center; gap: 6px; margin-right: auto; }
  .kwt-logo-txt { display: flex; flex-direction: column; line-height: 1.1; }
  .kwt-logo-kroom { font-size: 14px; font-weight: 900; color: #1a3a6b; font-family: Arial, sans-serif; }
  .kwt-logo-box   { font-size: 14px; font-weight: 900; color: #1a3a6b; font-family: Arial, sans-serif; }
  .kwt-logo-img { height: 35px; object-fit: contain; }
  .kwt-title {
    font-size: 15px; font-weight: 700;
    letter-spacing: 1.5px; text-decoration: underline;
    text-align: center; flex: 1;
    font-family: Arial, sans-serif;
  }
  .kwt-header-right { margin-left: auto; width: 80px; }

  /* META ROW */
  .kwt-meta {
    display: flex; justify-content: space-between;
    padding: 12px 20px 10px 20px;
    font-size: 12.5px;
    border-bottom: 0.5px solid #ddd;
  }

  /* BODY */
  .kwt-body { padding: 18px 20px 14px 20px; min-height: 160px; }
  .kwt-row { display: flex; gap: 4px; margin-bottom: 10px; font-size: 13px; }
  .kwt-lbl { min-width: 160px; color: #333; }
  .kwt-colon { margin-right: 6px; }
  .kwt-val { font-weight: 700; }
  .kwt-terbilang { font-size: 15px; font-weight: 700; }

  /* FOOTER */
  .kwt-footer {
    display: flex; justify-content: space-between; align-items: flex-end;
    padding: 10px 20px 16px 20px;
    border-top: 0.5px solid #ddd;
  }
  .kwt-nominal {
    font-size: 34px; font-weight: 900; color: #111;
    font-family: Arial, sans-serif;
    letter-spacing: -0.5px;
  }
  .kwt-sign { text-align: center; min-width: 180px; }
  .kwt-sign-city { font-size: 11px; color: #555; margin-bottom: 4px; }
  .kwt-sign-area {
    position: relative; width: 180px; height: 70px;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 4px;
  }
  .kwt-sign-logo {
    position: absolute; opacity: 0.18;
    display: flex; align-items: center; justify-content: center;
  }
  .kwt-sign-logo-img { height: 48px; object-fit: contain; }
  .kwt-sign-img {
    position: relative; z-index: 2;
    max-height: 64px; max-width: 170px;
    object-fit: contain;
  }
  .kwt-sign-name {
    font-size: 12px; font-weight: 700; color: #111;
    border-top: 1px solid #555; padding-top: 3px;
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
      <span class="kwt-lbl">Terbilang</span>
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
    <div class="kwt-nominal">Rp${nominal.toLocaleString('id-ID')},-</div>
    <div class="kwt-sign">
      <div class="kwt-sign-city">${company.city}, ${tanggal}</div>
      <div class="kwt-sign-area">
        <!-- Logo watermark -->
        <div class="kwt-sign-logo">
          ${logoBase64 ? `<img class="kwt-sign-logo-img" src="${logoBase64}" alt="Watermark" />` : ''}
        </div>
        <!-- Signature image -->
        ${ttdSrc ? `<img class="kwt-sign-img" src="${ttdSrc}" alt="TTD"/>` : '<div style="height:64px;"></div>'}
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
      format: 'A4',
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
