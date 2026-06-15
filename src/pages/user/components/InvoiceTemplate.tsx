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
  nama_pelanggan?: string;
  nama_manual?: string;
  no_whatsapp?: string;
  no_wa_manual?: string;
  subtotal: number;
  diskon: number;
  total: number;
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
      background: "#fff", display: "flex", flexDirection: "row",
      fontFamily: "'Helvetica Neue', Arial, Helvetica, sans-serif",
      color: "#1a1a1a", fontSize: "12px",
    }}>
      {/* LEFT GUTTER — rotated invoice number */}
      <div style={{
        width: "44px", flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRight: "1px solid #f0f0f0",
      }}>
        <div style={{
          fontSize: "30px", fontWeight: 900, color: "#1a1a1a",
          whiteSpace: "nowrap", letterSpacing: "2px",
          writingMode: "vertical-rl" as const,
          transform: "rotate(180deg)",
          fontStyle: "italic",
        }}>
          Invoice {invShort}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, padding: "36px 36px 28px 28px", display: "flex", flexDirection: "column" }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: 900, color: "#111", marginBottom: "3px" }}>{company.name}</div>
            <div style={{ fontSize: "10.5px", color: "#666" }}>{company.address}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <KroomboxLogo size={52} />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
              <span style={{ fontSize: "19px", fontWeight: 900, color: "#111" }}>Kroom</span>
              <span style={{ fontSize: "19px", fontWeight: 900, color: "#555" }}>box</span>
            </div>
          </div>
        </div>

        {/* RED LINE */}
        <div style={{ height: "1.5px", background: "#e05252", marginBottom: "14px" }} />

        {/* DATE & BILLING FOR */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#e05252", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>Date</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>{formatDate(invoice.tanggal_terbit)}</div>
          </div>
          <div>
            <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#e05252", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "5px" }}>Billing For</div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: "#111" }}>{customerName}</div>
            {(invoice.no_whatsapp || invoice.no_wa_manual) && (
              <div style={{ fontSize: "10px", color: "#666", marginTop: "2px" }}>WA: {invoice.no_whatsapp || invoice.no_wa_manual}</div>
            )}
          </div>
        </div>

        {/* THIN LINE */}
        <div style={{ height: "0.5px", background: "#d0d0d0", marginBottom: "18px" }} />

        {/* ITEMS TABLE */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#e05252" }}>
              <th style={{ color: "#fff", fontSize: "10.5px", fontWeight: 700, padding: "9px 10px", textAlign: "left" }}>Description</th>
              <th style={{ color: "#fff", fontSize: "10.5px", fontWeight: 700, padding: "9px 10px", textAlign: "center" }}>Quantity</th>
              <th style={{ color: "#fff", fontSize: "10.5px", fontWeight: 700, padding: "9px 10px", textAlign: "center" }}>Price</th>
              <th style={{ color: "#fff", fontSize: "10.5px", fontWeight: 700, padding: "9px 10px", textAlign: "center" }}>Discount</th>
              <th style={{ color: "#fff", fontSize: "10.5px", fontWeight: 700, padding: "9px 10px", textAlign: "right" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(items || []).map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #e0e0e0" }}>
                <td style={{ padding: "9px 10px", fontSize: "11px", color: "#222", verticalAlign: "top" }}>
                  <span style={{ display: "block", fontWeight: 500 }}>{item.deskripsi}</span>
                  {item.sub_deskripsi && <span style={{ display: "block", fontSize: "10px", color: "#666", marginTop: "1px" }}>{item.sub_deskripsi}</span>}
                </td>
                <td style={{ padding: "9px 10px", fontSize: "11px", color: "#222", textAlign: "center" }}>{item.kuantitas}</td>
                <td style={{ padding: "9px 10px", fontSize: "11px", color: "#222", textAlign: "center" }}>{formatRp(item.harga_satuan)}</td>
                <td style={{ padding: "9px 10px", fontSize: "11px", color: "#222", textAlign: "center" }}>{item.diskon_persen || 0}%</td>
                <td style={{ padding: "9px 10px", fontSize: "11px", color: "#222", textAlign: "right" }}>{formatRp(item.subtotal)}</td>
              </tr>
            ))}
            {Array(emptyCount).fill(0).map((_, idx) => (
              <tr key={`empty-${idx}`} style={{ height: "26px", borderBottom: "1px solid #f0f0f0" }}>
                <td /><td /><td /><td /><td />
              </tr>
            ))}
          </tbody>
        </table>

        {/* SUMMARY */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "6px" }}>
          <div style={{ width: "310px" }}>
            {[
              { label: "Subtotal", value: formatRp(subtotal), bold: false },
              { label: "Sales Tax", value: "0", bold: false },
              { label: "Total", value: formatRp(total), bold: false },
            ].map(row => (
              <div key={row.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "0.5px solid #e8e8e8" }}>
                <div style={{ flex: 1, padding: "7px 10px", fontSize: "11.5px", color: "#555", textAlign: "right" }}>{row.label}</div>
                <div style={{ padding: "7px 0 7px 10px", fontSize: "11.5px", color: "#222", minWidth: "130px", textAlign: "right" }}>{row.value}</div>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "2px solid #e05252" }}>
              <div style={{ flex: 1, padding: "7px 10px", fontSize: "12.5px", fontWeight: 700, color: "#111", textAlign: "right" }}>Amount Due</div>
              <div style={{ padding: "7px 0 7px 10px", fontSize: "12.5px", fontWeight: 700, color: "#111", minWidth: "130px", textAlign: "right" }}>{formatRp(total)}</div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ marginTop: "auto", paddingTop: "18px", borderTop: "0.5px solid #ddd", display: "flex", gap: "24px", fontSize: "10px", color: "#999" }}>
          <span>Tel: <strong style={{ color: "#555" }}>{company.phone}</strong></span>
          <span>Email: <strong style={{ color: "#555" }}>{company.email}</strong></span>
          <span>Web: <strong style={{ color: "#555" }}>{company.website}</strong></span>
        </div>
      </div>
    </div>
  );
}
