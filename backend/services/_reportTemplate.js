// _reportTemplate.js — clean financial report HTML builder
// Called from pdfService.js via buildReportHtml()

export function renderReportHtml({
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
}) {
  const neg = (n) => n < 0 ? `(${fv(Math.abs(n))})` : fv(n);
  // Fix encoding: replace raw en-dash with HTML entity
  const safePeriod = (dateRangeStr || '').replace(/&/g, '&amp;');

  const logoHtml = logoBase64Image
    ? `<img class="hdr-logo" src="${logoBase64Image}" alt="Logo">`
    : '';

  const sigHtml = signatureImg
    ? `<img class="sig-img" src="${signatureImg}" alt="TTD">`
    : `<div class="sig-gap"></div>`;

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Laporan Keuangan - ${company.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 16mm 15mm 14mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Poppins', Arial, Helvetica, sans-serif;
    font-size: 9pt;
    color: #111;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── HEADER ── */
  .hdr {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid #1a3a6b;
    padding-bottom: 10px;
    margin-bottom: 14px;
  }
  .hdr-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .hdr-logo {
    height: 36px;
    object-fit: contain;
    display: block;
  }
  .hdr-brand-name {
    font-size: 13pt;
    font-weight: 700;
    color: #1a3a6b;
    line-height: 1.1;
    letter-spacing: 0.3px;
  }
  .hdr-brand-sub {
    font-size: 7pt;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    margin-top: 2px;
  }
  .hdr-right {
    text-align: right;
  }
  .hdr-title {
    font-size: 12pt;
    font-weight: 700;
    color: #1a3a6b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    line-height: 1.1;
  }
  .hdr-period {
    font-size: 8.5pt;
    font-weight: 700;
    color: #333;
    margin-top: 4px;
  }
  .hdr-curr {
    font-size: 7.5pt;
    color: #888;
    margin-top: 2px;
  }

  /* ── REPORT TABLE ── */
  .rt {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 12px;
    table-layout: fixed;
  }

  /* Section title — dark navy */
  .rt .r-sec td {
    background: #1a3a6b;
    color: #fff;
    font-size: 8.5pt;
    font-weight: 700;
    padding: 5px 10px;
    letter-spacing: 0.3px;
  }

  /* Category row — light blue-gray */
  .rt .r-cat td {
    background: #eaeff6;
    color: #1a3a6b;
    font-weight: 700;
    font-size: 8pt;
    padding: 4px 10px;
    border-top: 1px solid #c5d0e0;
    border-bottom: 1px solid #c5d0e0;
  }

  /* Item row */
  .rt .r-item td {
    padding: 3px 10px;
    font-size: 8.5pt;
    color: #222;
    border-bottom: 1px solid #f0f2f5;
  }
  .rt .r-item .c-label { padding-left: 22px; }
  .rt .r-item .c-rp    { text-align: right; color: #555; }
  .rt .r-item .c-val   { text-align: right; font-family: 'Courier New', monospace; font-size: 8pt; padding-right: 4px; }

  /* Subtotal row */
  .rt .r-sub td {
    padding: 4px 10px;
    font-size: 8.5pt;
    font-weight: 700;
    border-top: 1.5px solid #666;
    border-bottom: 1.5px solid #666;
    background: #f5f7fa;
  }
  .rt .r-sub .c-val { text-align: right; font-family: 'Courier New', monospace; padding-right: 4px; }

  /* Grand total — navy */
  .rt .r-total td {
    padding: 5px 10px;
    font-size: 9pt;
    font-weight: 700;
    background: #1a3a6b;
    color: #fff;
  }
  .rt .r-total .c-val { text-align: right; font-family: 'Courier New', monospace; padding-right: 4px; }

  /* Spacer row */
  .rt .r-gap td { padding: 3px 0; border: none; }

  /* ── AI NOTE ── */
  .ai-box {
    border: 1px solid #c5d0e0;
    border-left: 4px solid #1a3a6b;
    padding: 8px 12px;
    margin-bottom: 14px;
    font-size: 8pt;
    background: #f8fafd;
  }
  .ai-box .ai-lbl {
    font-weight: 700;
    color: #1a3a6b;
    font-size: 7.5pt;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 5px;
    border-bottom: 1px solid #dde4f0;
    padding-bottom: 4px;
  }
  .ai-box .ai-txt {
    font-style: normal;
    line-height: 1.7;
    color: #333;
    font-size: 8pt;
  }

  /* ── SIGNATURE ── */
  .sig { display: flex; justify-content: flex-end; margin-bottom: 10px; }
  .sig-blk { text-align: center; width: 160px; font-size: 8.5pt; }
  .sig-city  { color: #555; margin-bottom: 2px; }
  .sig-title { font-weight: 700; margin-bottom: 4px; }
  .sig-stamp-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 140px;
    height: 120px;
    margin: 0 auto;
  }
  .sig-stamp-logo {
    position: absolute;
    width: 120px;
    height: 120px;
    object-fit: contain;
    opacity: 0.35;
    padding: 0;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  .sig-img { 
    position: relative; 
    height: 85px; 
    width: 140px;
    display: block; 
    margin: 0 auto; 
    object-fit: contain; 
    z-index: 1; 
    mix-blend-mode: multiply;
  }
  .sig-gap   { position: relative; height: 85px; }
  .sig-name  { font-weight: 800; font-size: 10pt; margin-top: 5px; }

  /* ── PRINT DATE FOOTER ── */
  .ftr {
    border-top: 1px solid #ccc;
    padding-top: 4px;
    font-size: 7pt;
    color: #aaa;
    font-style: italic;
    text-align: left;
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="hdr">
  <div class="hdr-left">
    ${logoHtml}
    <div>
      <div class="hdr-brand-name">${company.name.toUpperCase()}</div>
      <div class="hdr-brand-sub">Dashboard Finansial</div>
    </div>
  </div>
  <div class="hdr-right">
    <div class="hdr-title">Laporan Keuangan Konsolidasi</div>
    <div class="hdr-period">Periode: ${safePeriod}</div>
    <div class="hdr-curr">Dalam Rupiah (IDR)</div>
  </div>
</div>

<!-- 1. LAPORAN LABA RUGI -->
<table class="rt">
  <colgroup>
    <col style="width:auto">
    <col style="width:30px">
    <col style="width:130px">
  </colgroup>

  <tr class="r-sec"><td colspan="3">1. Laporan Laba Rugi</td></tr>

  <tr class="r-cat"><td colspan="3">Pemasukan</td></tr>
  <tr class="r-item">
    <td class="c-label">Penerimaan dari Pelanggan</td>
    <td class="c-rp">Rp</td>
    <td class="c-val">${fv(penerimaanPelanggan)}</td>
  </tr>
  <tr class="r-item">
    <td class="c-label">Pendapatan Lain-lain</td>
    <td class="c-rp">Rp</td>
    <td class="c-val">${fv(pendapatanLainnya)}</td>
  </tr>
  <tr class="r-sub">
    <td>Total Pemasukan</td><td></td>
    <td class="c-val">${fv(revenueTotal)}</td>
  </tr>

  <tr class="r-gap"><td colspan="3"></td></tr>

  <tr class="r-cat"><td colspan="3">Pengeluaran</td></tr>
  <tr class="r-item">
    <td class="c-label">Biaya Produksi / Pembelian Barang</td>
    <td class="c-rp">Rp</td>
    <td class="c-val">(${fv(pembayaranPemasok)})</td>
  </tr>
  <tr class="r-item">
    <td class="c-label">Biaya Operasional</td>
    <td class="c-rp">Rp</td>
    <td class="c-val">(${fv(pengeluaranOperasional)})</td>
  </tr>
  <tr class="r-sub">
    <td>Total Pengeluaran</td><td></td>
    <td class="c-val">(${fv(expenseTotal)})</td>
  </tr>

  <tr class="r-gap"><td colspan="3"></td></tr>

  <tr class="r-total">
    <td>${labaRugiBersih >= 0 ? 'Keuntungan Bersih (Laba)' : 'Kerugian Bersih (Rugi)'}</td>
    <td></td>
    <td class="c-val">${neg(labaRugiBersih)}</td>
  </tr>
</table>

<!-- 2. LAPORAN ARUS KAS -->
<table class="rt">
  <colgroup>
    <col style="width:auto">
    <col style="width:30px">
    <col style="width:130px">
  </colgroup>

  <tr class="r-sec"><td colspan="3">2. Laporan Arus Kas</td></tr>

  <tr class="r-cat"><td colspan="3">Aktivitas Operasional</td></tr>
  <tr class="r-item"><td class="c-label">Penerimaan dari Pelanggan</td><td class="c-rp">Rp</td><td class="c-val">${fv(penerimaanPelanggan)}</td></tr>
  <tr class="r-item"><td class="c-label">Pendapatan Lain-lain</td><td class="c-rp">Rp</td><td class="c-val">${fv(pendapatanLainnya)}</td></tr>
  <tr class="r-item"><td class="c-label">Biaya Produksi / Pembelian Barang</td><td class="c-rp">Rp</td><td class="c-val">(${fv(pembayaranPemasok)})</td></tr>
  <tr class="r-item"><td class="c-label">Biaya Operasional</td><td class="c-rp">Rp</td><td class="c-val">(${fv(pengeluaranOperasional)})</td></tr>
  <tr class="r-sub"><td>Total Kas dari Aktivitas Operasional</td><td></td><td class="c-val">${neg(totalOperating)}</td></tr>

  <tr class="r-gap"><td colspan="3"></td></tr>

  <tr class="r-cat"><td colspan="3">Aktivitas Investasi</td></tr>
  <tr class="r-item"><td class="c-label">Penerimaan dari Penjualan Aset</td><td class="c-rp">Rp</td><td class="c-val">${fv(saleOfAssets)}</td></tr>
  <tr class="r-item"><td class="c-label">Pembayaran Pembelian Aset</td><td class="c-rp">Rp</td><td class="c-val">(${fv(purchaseOfAssets)})</td></tr>
  <tr class="r-sub"><td>Kas Bersih dari Aktivitas Investasi</td><td></td><td class="c-val">${neg(totalInvesting)}</td></tr>

  <tr class="r-gap"><td colspan="3"></td></tr>

  <tr class="r-cat"><td colspan="3">Aktivitas Pendanaan</td></tr>
  <tr class="r-item"><td class="c-label">Penerimaan Pinjaman</td><td class="c-rp">Rp</td><td class="c-val">${fv(loanReceived)}</td></tr>
  <tr class="r-item"><td class="c-label">Setoran Modal Pemilik</td><td class="c-rp">Rp</td><td class="c-val">${fv(equityAddition)}</td></tr>
  <tr class="r-item"><td class="c-label">Pembayaran Pinjaman</td><td class="c-rp">Rp</td><td class="c-val">(${fv(loanPaid)})</td></tr>
  <tr class="r-item"><td class="c-label">Penarikan Modal / Prive</td><td class="c-rp">Rp</td><td class="c-val">(${fv(equityPrive)})</td></tr>
  <tr class="r-sub"><td>Kas Bersih dari Aktivitas Pendanaan</td><td></td><td class="c-val">${neg(totalFinancing)}</td></tr>

  <tr class="r-gap"><td colspan="3"></td></tr>

  <tr class="r-item"><td>Kenaikan (Penurunan) Bersih Kas</td><td class="c-rp">Rp</td><td class="c-val">${neg(netChange)}</td></tr>
  <tr class="r-item"><td>Saldo Kas Awal Periode</td><td class="c-rp">Rp</td><td class="c-val">${fv(initialCash)}</td></tr>
  <tr class="r-total"><td>Saldo Kas Akhir Periode</td><td></td><td class="c-val">${fv(endingCash)}</td></tr>
</table>

<!-- CATATAN AI -->
<div class="ai-box">
  <div class="ai-lbl">Catatan Analisis &mdash; KrooLLM</div>
  <div class="ai-txt">${aiInsight || 'Tidak tersedia untuk periode ini.'}</div>
</div>

<!-- TANDA TANGAN -->
<div class="sig">
  <div class="sig-blk">
    <div class="sig-city">${signatureCity}, ${indoDateOnly}</div>
    <div class="sig-title">${signerTitle}</div>
    <div class="sig-stamp-wrap">
      ${logoBase64Image ? `<img class="sig-stamp-logo" src="${logoBase64Image}" alt="cap">` : ''}
      ${sigHtml}
    </div>
    <div class="sig-name">${signerName}</div>
  </div>
</div>

<!-- PRINT DATE -->
<div class="ftr">Dicetak: ${printTime}</div>

</body>
</html>`;
}
