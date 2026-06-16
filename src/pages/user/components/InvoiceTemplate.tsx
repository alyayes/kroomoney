import React from "react";

interface InvoiceItem {
  deskripsi: string;
  sub_deskripsi?: string;
  kuantitas: number;
  harga_satuan: number;
  diskon_persen: number;
  subtotal: number;
}

interface InvoiceData {
  nomor_invoice: string;
  tanggal_terbit: string;
  tanggal_jatuh_tempo?: string;
  nama_pelanggan?: string;
  nama_manual?: string;
  no_whatsapp?: string;
  no_wa_manual?: string;
  subtotal: number;
  diskon: number;
  total: number;
  catatan?: string;
}

interface CompanyData {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

interface InvoiceTemplateProps {
  invoice: InvoiceData;
  items: InvoiceItem[];
  company?: CompanyData;
}

// Kroombox SVG logo (matches template design)
const KroomboxLogo = ({ size = 48 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width={size} height={size}>
    <rect x="2" y="8" width="56" height="44" rx="3" ry="3" fill="none" stroke="#1a3a6b" strokeWidth="3.5"/>
    <rect x="10" y="16" width="18" height="28" rx="1" fill="none" stroke="#1a3a6b" strokeWidth="2.5"/>
    <line x1="10" y1="22" x2="28" y2="22" stroke="#1a3a6b" strokeWidth="2"/>
    <line x1="10" y1="28" x2="28" y2="28" stroke="#1a3a6b" strokeWidth="2"/>
    <line x1="10" y1="34" x2="28" y2="34" stroke="#1a3a6b" strokeWidth="2"/>
    <line x1="10" y1="40" x2="28" y2="40" stroke="#1a3a6b" strokeWidth="2"/>
    <rect x="33" y="24" width="20" height="20" rx="1" fill="none" stroke="#1a3a6b" strokeWidth="2.5"/>
    <line x1="33" y1="30" x2="53" y2="30" stroke="#1a3a6b" strokeWidth="2"/>
    <line x1="33" y1="36" x2="53" y2="36" stroke="#1a3a6b" strokeWidth="2"/>
  </svg>
);

function formatRp(n: number): string {
  return "Rp" + Number(n).toLocaleString("id-ID");
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric"
  });
}

const EMPTY_ROWS = 8;

const DEFAULT_COMPANY: CompanyData = {
  name: "Kroombox",
  address: "Ko+Lab Hub Studio, Gd.Selaru lt.4 Universitas Telkom",
  phone: "+62-878-9000-4465",
  email: "kroombox@gmail.com",
  website: "kroombox.com",
};

export default function InvoiceTemplate({ invoice, items, company = DEFAULT_COMPANY }: InvoiceTemplateProps) {
  const customerName = invoice.nama_pelanggan || invoice.nama_manual || "Pelanggan";
  const invShort = invoice.nomor_invoice?.split("-").slice(1).join("") || invoice.nomor_invoice;
  const emptyCount = Math.max(0, EMPTY_ROWS - (items?.length || 0));
  const subtotal = items?.reduce((s, i) => s + (Number(i.subtotal) || 0), 0) || invoice.subtotal || 0;
  const total = invoice.total || subtotal;

  return (
    <div style={{
      width: "210mm", minHeight: "297mm",
      background: "#fff", display: "flex", flexDirection: "column",
      fontFamily: "'Helvetica Neue', Arial, Helvetica, sans-serif",
      color: "#1a1a1a", fontSize: "12px",
      padding: "40px", boxSizing: "border-box",
      position: "relative"
    }}>
      {/* Decorative top border */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "8px", background: "#1a3a6b" }} />

      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "40px", marginTop: "10px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span style={{ fontSize: "28px", fontWeight: 900, color: "#1a3a6b" }}>{company.name}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#666", letterSpacing: "1.5px" }}>FINANCE & CLOUD SOLUTIONS</span>
          <div style={{ fontSize: "11px", color: "#555", lineHeight: 1.5, marginTop: "8px", maxWidth: "320px" }}>
            {company.address}<br/>
            Tel: {company.phone} | Email: {company.email}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          <img src="/logo.png" alt="Kroombox Logo" style={{ height: "50px", objectFit: "contain", marginBottom: "4px" }} />
          <div style={{ fontSize: "36px", fontWeight: 900, color: "#1a3a6b", textTransform: "uppercase", letterSpacing: "2px", lineHeight: 1 }}>INVOICE</div>
          <div style={{ fontSize: "14px", fontWeight: 700, color: "#444" }}>#{invoice.nomor_invoice}</div>
        </div>
      </div>

      {/* COMPANY & BILLING DETAILS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "40px" }}>
        {/* Dari */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "#1a3a6b", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "2px solid #f0f0f0", paddingBottom: "6px", marginBottom: "12px" }}>Dari</div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#111", marginBottom: "6px" }}>{company.name}</div>
          <div style={{ fontSize: "12px", color: "#555", lineHeight: 1.5, maxWidth: "250px" }}>{company.address}</div>
          <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>Tel: {company.phone}</div>
          <div style={{ fontSize: "12px", color: "#555", marginTop: "2px" }}>Email: {company.email}</div>
        </div>
        
        {/* Ditagih Ke */}
        <div>
          <div style={{ fontSize: "11px", fontWeight: 800, color: "#1a3a6b", textTransform: "uppercase", letterSpacing: "1px", borderBottom: "2px solid #f0f0f0", paddingBottom: "6px", marginBottom: "12px" }}>Ditagih Ke</div>
          <div style={{ fontSize: "16px", fontWeight: 800, color: "#111", marginBottom: "6px" }}>{customerName}</div>
          {(invoice.no_whatsapp || invoice.no_wa_manual) && (
            <div style={{ fontSize: "12px", color: "#555", marginTop: "4px" }}>WA: {invoice.no_whatsapp || invoice.no_wa_manual}</div>
          )}
          <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "#f8f9fa", padding: "12px", borderRadius: "6px" }}>
            <div>
              <span style={{ display: "block", fontSize: "10px", color: "#777", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>Tanggal Terbit</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#111" }}>{formatDate(invoice.tanggal_terbit)}</span>
            </div>
            <div>
              <span style={{ display: "block", fontSize: "10px", color: "#e05252", textTransform: "uppercase", fontWeight: 700, marginBottom: "2px" }}>Jatuh Tempo</span>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#e05252" }}>{invoice.tanggal_jatuh_tempo ? formatDate(invoice.tanggal_jatuh_tempo) : '-'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ITEMS TABLE */}
      <div style={{ flex: 1 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <thead>
            <tr style={{ background: "#1a3a6b" }}>
              <th style={{ color: "#fff", fontSize: "11px", fontWeight: 700, padding: "12px 16px", textAlign: "left", borderRadius: "6px 0 0 0" }}>Deskripsi</th>
              <th style={{ color: "#fff", fontSize: "11px", fontWeight: 700, padding: "12px 16px", textAlign: "center" }}>Jumlah</th>
              <th style={{ color: "#fff", fontSize: "11px", fontWeight: 700, padding: "12px 16px", textAlign: "right" }}>Harga Satuan</th>
              <th style={{ color: "#fff", fontSize: "11px", fontWeight: 700, padding: "12px 16px", textAlign: "right" }}>Diskon</th>
              <th style={{ color: "#fff", fontSize: "11px", fontWeight: 700, padding: "12px 16px", textAlign: "right", borderRadius: "0 6px 0 0" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "14px 16px", fontSize: "12px", color: "#222", verticalAlign: "top" }}>
                  <span style={{ display: "block", fontWeight: 600 }}>{item.deskripsi}</span>
                  {item.sub_deskripsi && <span style={{ display: "block", fontSize: "11px", color: "#777", marginTop: "4px" }}>{item.sub_deskripsi}</span>}
                </td>
                <td style={{ padding: "14px 16px", fontSize: "12px", color: "#444", textAlign: "center", verticalAlign: "top" }}>{item.kuantitas}</td>
                <td style={{ padding: "14px 16px", fontSize: "12px", color: "#444", textAlign: "right", verticalAlign: "top" }}>{formatRp(item.harga_satuan)}</td>
                <td style={{ padding: "14px 16px", fontSize: "12px", color: "#444", textAlign: "right", verticalAlign: "top" }}>{item.diskon_persen || 0}%</td>
                <td style={{ padding: "14px 16px", fontSize: "12px", fontWeight: 600, color: "#111", textAlign: "right", verticalAlign: "top" }}>{formatRp(item.subtotal)}</td>
              </tr>
            ))}
            {/* Empty filler rows to push summary to bottom if few items */}
            {Array(emptyCount).fill(0).map((_, idx) => (
              <tr key={`empty-${idx}`} style={{ borderBottom: "1px solid #fafafa" }}>
                <td style={{ padding: "14px 16px" }} /><td /><td /><td /><td />
              </tr>
            ))}
          </tbody>
        </table>

        {/* SUMMARY SECTION */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
          <div style={{ width: "350px", background: "#f8f9fa", borderRadius: "8px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
              <span style={{ fontSize: "12px", color: "#666", fontWeight: 600 }}>Subtotal</span>
              <span style={{ fontSize: "13px", color: "#111", fontWeight: 700 }}>{formatRp(subtotal)}</span>
            </div>
            {invoice.diskon > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", color: "#e05252", fontWeight: 600 }}>Diskon (Global)</span>
                <span style={{ fontSize: "13px", color: "#e05252", fontWeight: 700 }}>-{formatRp(invoice.diskon)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "12px", color: "#666", fontWeight: 600 }}>Pajak (0%)</span>
              <span style={{ fontSize: "13px", color: "#111", fontWeight: 700 }}>Rp0</span>
            </div>
            <div style={{ height: "1px", background: "#ddd", margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "#1a3a6b", fontWeight: 900, textTransform: "uppercase" }}>Total Tagihan</span>
              <span style={{ fontSize: "20px", color: "#1a3a6b", fontWeight: 900 }}>{formatRp(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER & TERMS */}
      <div style={{ marginTop: "40px", borderTop: "2px solid #f0f0f0", paddingTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        <div>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#1a3a6b", textTransform: "uppercase", marginBottom: "6px" }}>Syarat Pembayaran & Catatan</span>
          <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.6, margin: 0 }}>
            {invoice.catatan || "Silakan lakukan pembayaran sebelum tanggal jatuh tempo. Terima kasih atas kerja sama Anda!"}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <span style={{ display: "block", fontSize: "11px", fontWeight: 800, color: "#1a3a6b", textTransform: "uppercase", marginBottom: "6px" }}>Detail Transfer Bank</span>
          <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.6, margin: 0 }}>
            <strong>Bank BCA</strong><br/>
            No. Rekening: 1234567890<br/>
            Nama: PT Kroombox Indonesia
          </p>
        </div>
      </div>
      
      {/* Absolute bottom footer */}
      <div style={{ position: "absolute", bottom: "40px", left: "40px", right: "40px", textAlign: "center", fontSize: "10px", color: "#999" }}>
        Kroombox • {company.address} • {company.website}
      </div>
    </div>
  );
}
