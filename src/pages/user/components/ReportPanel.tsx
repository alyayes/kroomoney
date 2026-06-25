import React from "react";
import {
  Calendar,
  User,
  Quote,
  FileText,
  Edit,
  Trash2,
  Download,
  Search,
  AlertCircle,
  TrendingUp,
  Scale,
  BookOpen,
  Activity,
  BarChart2,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Transaction } from "../useUserDashboard";

interface Profile {
  nama: string;
  email: string;
  tandaTangan?: string;
  fotoProfil?: string;
  role?: string;
}

interface ReportPanelProps {
  filteredTransactions: Transaction[];
  allTransactions?: Transaction[];
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  totalIncome: number;
  totalExpense: number;
  formatRupiah: (number: number) => string;
  profile: Profile;
  handleEdit: (t: Transaction) => void;
  handleDelete: (id: string) => void;
  terbilang: (n: number) => string;
  exportToExcel: () => void;
  setSelectedReceipt: React.Dispatch<React.SetStateAction<Transaction | null>>;
  setSelectedDocType: React.Dispatch<React.SetStateAction<"Invoice" | "Kwitansi">>;
  handleDownloadDocumentPdf: (id: string, trxId: string, docType: "Invoice" | "Kwitansi") => Promise<void>;
  downloadingId: string | null;
  handleDownloadReportPdf: () => Promise<void>;
  isDownloadingReport: boolean;
  aiInsight: string;
}

type TabKey = "ringkasan" | "labarugi" | "modal" | "neraca" | "aruskas" | "bukubesar";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "ringkasan", label: "Ringkasan", icon: <BarChart2 className="w-3.5 h-3.5" /> },
  { key: "labarugi", label: "Laba Rugi", icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { key: "bukubesar", label: "Buku Besar", icon: <BookOpen className="w-3.5 h-3.5" /> },
];

export default function ReportPanel({
  filteredTransactions,
  allTransactions = [],
  searchTerm,
  setSearchTerm,
  totalIncome,
  totalExpense,
  formatRupiah,
  profile,
  handleEdit,
  handleDelete,
  terbilang,
  exportToExcel,
  setSelectedReceipt,
  setSelectedDocType,
  handleDownloadDocumentPdf,
  downloadingId,
  handleDownloadReportPdf,
  isDownloadingReport,
  aiInsight
}: ReportPanelProps) {
  const [activeTab, setActiveTab] = React.useState<TabKey>("ringkasan");

  // Correct amount calculation (respects items and discount)
  const getTransactionAmount = (t: Transaction) => {
    const hasItems = t.items && t.items.length > 0;
    const base = hasItems ? Number(t.jumlah || 0) : Number(t.jumlah || 0) * Number(t.kuantitas || 1);
    return Math.max(0, base - Number(t.diskon || 0));
  };

  // Sort oldest first
  const sortedTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
  );

  // Date range
  let dateRangeStr = "";
  let startDate: Date | null = null;
  if (sortedTransactions.length > 0) {
    const minDate = sortedTransactions[0].tanggal;
    const maxDate = sortedTransactions[sortedTransactions.length - 1].tanggal;
    startDate = new Date(minDate);
    const fmt = (dStr: string) => { const [y, m, d] = dStr.split("-"); return `${d}/${m}/${y}`; };
    dateRangeStr = `${fmt(minDate)} – ${fmt(maxDate)}`;
  } else {
    dateRangeStr = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  // Opening balances from allTransactions before period
  let initialCash = 0, initialFixedAssets = 0, initialLiabilities = 0;
  let initialRevenue = 0, initialExpense = 0, initialEquityFromTrx = 0;

  if (startDate && allTransactions.length > 0) {
    allTransactions.forEach((t) => {
      if (new Date(t.tanggal).getTime() < startDate!.getTime()) {
        const amount = getTransactionAmount(t);
        const desc = (t.namaPembeli + " " + (t.notes || "")).toLowerCase();
        const isFinancing = desc.includes("modal") || desc.includes("pinjaman") || desc.includes("utang") || desc.includes("ekuitas") || desc.includes("investor") || desc.includes("prive") || desc.includes("hutang");
        const isInvesting = desc.includes("aset") || desc.includes("peralatan") || desc.includes("investasi") || desc.includes("kendaraan") || desc.includes("laptop") || desc.includes("gedung") || desc.includes("komputer");

        if (t.tipe === "Debit") initialCash += amount; else initialCash -= amount;

        if (isInvesting) {
          if (t.tipe === "Kredit") initialFixedAssets += amount; else initialFixedAssets -= amount;
        } else if (isFinancing) {
          if (desc.includes("pinjam") || desc.includes("utang") || desc.includes("hutang") || desc.includes("loan")) {
            if (t.tipe === "Debit") initialLiabilities += amount; else initialLiabilities -= amount;
          } else {
            if (t.tipe === "Debit") initialEquityFromTrx += amount; else initialEquityFromTrx -= amount;
          }
        } else {
          if (t.tipe === "Debit") initialRevenue += amount; else initialExpense += amount;
        }
      }
    });
  }
  const initialEquity = initialEquityFromTrx + (initialRevenue - initialExpense);

  // Current period calculations
  let penerimaanPelanggan = 0, pendapatanLainnya = 0, pembayaranPemasok = 0, pengeluaranOperasional = 0;
  let purchaseOfAssets = 0, saleOfAssets = 0;
  let loanReceived = 0, loanPaid = 0, equityAddition = 0, equityPrive = 0;

  sortedTransactions.forEach((t) => {
    const amount = getTransactionAmount(t);
    const desc = (t.namaPembeli + " " + (t.notes || "")).toLowerCase();
    const isFinancing = desc.includes("modal") || desc.includes("pinjaman") || desc.includes("utang") || desc.includes("ekuitas") || desc.includes("investor") || desc.includes("prive") || desc.includes("hutang");
    const isInvesting = desc.includes("aset") || desc.includes("peralatan") || desc.includes("investasi") || desc.includes("kendaraan") || desc.includes("laptop") || desc.includes("gedung") || desc.includes("komputer");

    if (isInvesting) {
      if (t.tipe === "Kredit") purchaseOfAssets += amount; else saleOfAssets += amount;
    } else if (isFinancing) {
      if (desc.includes("pinjam") || desc.includes("utang") || desc.includes("hutang") || desc.includes("loan")) {
        if (t.tipe === "Debit") loanReceived += amount; else loanPaid += amount;
      } else {
        if (t.tipe === "Debit") equityAddition += amount; else equityPrive += amount;
      }
    } else {
      if (t.tipe === "Debit") {
        if (desc.includes("lain") || desc.includes("bunga") || desc.includes("bonus")) pendapatanLainnya += amount;
        else penerimaanPelanggan += amount;
      } else {
        const isSupplier = desc.includes("hosting") || desc.includes("domain") || desc.includes("server") || desc.includes("cloud") || desc.includes("api") || desc.includes("layanan") || desc.includes("subscription") || desc.includes("sewa") || desc.includes("vps");
        if (isSupplier) pembayaranPemasok += amount; else pengeluaranOperasional += amount;
      }
    }
  });

  // Derived totals
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
  const endingBalance = initialCash + netChange;

  // Running balance for Buku Besar
  const balanceMap = new Map<string, number>();
  let runningBalance = initialCash;
  sortedTransactions.forEach((t) => {
    const amount = getTransactionAmount(t);
    if (t.tipe === "Debit") runningBalance += amount; else runningBalance -= amount;
    balanceMap.set(t.id, runningBalance);
  });

  // Pie chart data
  const pieData = [
    { name: "Debit (Masuk)", value: totalIncome, fill: "#2563eb" },
    { name: "Kredit (Keluar)", value: totalExpense, fill: "#ef4444" },
  ];

  // Bar chart data for cash flow
  const barData = [
    { name: "Operasional", value: totalOperating, fill: totalOperating >= 0 ? "#2563eb" : "#ef4444" },
    { name: "Investasi", value: totalInvesting, fill: totalInvesting >= 0 ? "#10b981" : "#ef4444" },
    { name: "Keuangan", value: totalFinancing, fill: totalFinancing >= 0 ? "#8b5cf6" : "#ef4444" },
  ];

  const fv = (val: number) => {
    if (val < 0) return `(${formatRupiah(Math.abs(val))})`;
    return formatRupiah(val);
  };

  const balanceDiff = Math.abs(totalAset - totalLiabilitasEkuitas);
  const isBalanced = balanceDiff < 1;

  // ─── Table helpers ────────────────────────────────────────────────────────
  const SectionHeader = ({ label }: { label: string }) => (
    <tr className="bg-slate-50">
      <td colSpan={2} className="px-5 py-2.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</td>
    </tr>
  );

  const Row = ({ label, value, bold, color, indent }: { label: string; value: string; bold?: boolean; color?: string; indent?: boolean }) => (
    <tr className={bold ? "bg-[#1a3a6b]/5" : ""}>
      <td className={`${indent ? "px-10" : "px-5"} py-3 text-${bold ? "sm font-bold text-[#1a3a6b]" : "xs font-medium text-slate-600"}`}>{label}</td>
      <td className={`px-5 py-3 text-right text-xs font-bold ${color || (bold ? "text-[#1a3a6b]" : "text-slate-800")}`}>{value}</td>
    </tr>
  );

  const SubTotal = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <tr className="border-t border-slate-200 bg-blue-50/30">
      <td className="px-5 py-3 text-xs font-extrabold text-[#1a3a6b]">{label}</td>
      <td className={`px-5 py-3 text-right text-xs font-extrabold ${color || "text-[#1a3a6b]"}`}>{value}</td>
    </tr>
  );

  const GrandTotal = ({ label, value, ok }: { label: string; value: string; ok?: boolean }) => (
    <tr className="bg-[#1a3a6b] text-white">
      <td className="px-5 py-4 text-sm font-black">{label}</td>
      <td className={`px-5 py-4 text-right text-sm font-black ${ok === false ? "text-yellow-300" : ""}`}>{value}</td>
    </tr>
  );

  return (
    <motion.div
      key="laporan"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 w-full"
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Laporan Keuangan</h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Konsolidasi 4 Komponen Utama · Periode: {dateRangeStr}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleDownloadReportPdf}
            disabled={isDownloadingReport}
            className={`flex items-center gap-2 font-bold py-3 px-5 rounded-2xl text-xs transition-all shadow-md cursor-pointer border-none ${
              isDownloadingReport ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "text-white"
            }`}
            style={{ backgroundColor: isDownloadingReport ? undefined : "#1a3a6b" }}
          >
            <Download className="w-4 h-4" />
            {isDownloadingReport ? "Mengunduh..." : "Unduh PDF"}
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-5 rounded-2xl text-xs transition-all shadow-md cursor-pointer border-none"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* ── Tab Navigation ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border-none ${
                activeTab === tab.key
                  ? "bg-[#1a3a6b] text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {/* ════════ RINGKASAN ════════ */}
        {activeTab === "ringkasan" && (
          <motion.div key="ringkasan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Debit (Masuk)", value: formatRupiah(totalIncome), color: "text-emerald-600", bg: "bg-emerald-50" },
                { label: "Total Kredit (Keluar)", value: formatRupiah(totalExpense), color: "text-red-500", bg: "bg-red-50" },
                { label: "Laba / Rugi Bersih", value: fv(labaRugiBersih), color: labaRugiBersih >= 0 ? "text-blue-600" : "text-red-600", bg: "bg-blue-50" },
                { label: "Saldo Kas Akhir", value: fv(endingBalance), color: endingBalance >= 0 ? "text-[#1a3a6b]" : "text-red-600", bg: "bg-[#1a3a6b]/5" },
              ].map((kpi) => (
                <div key={kpi.label} className={`${kpi.bg} rounded-3xl p-5 border border-white`}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">{kpi.label}</p>
                  <p className={`text-lg font-black ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Rasio Debit vs Kredit</h3>
                <div className="flex items-center gap-6">
                  <div className="w-[180px] h-[180px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={6} dataKey="value">
                          {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => formatRupiah(v)} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "11px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{d.name}</p>
                          <p className="text-xs font-black text-slate-800">{formatRupiah(d.value)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cash Flow Bar Chart */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Arus Kas per Aktivitas</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={barData} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} />
                    <Tooltip formatter={(v: number) => fv(v)} contentStyle={{ borderRadius: "12px", border: "none", fontSize: "11px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Insight */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-[#1a3a6b]/10 p-2 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-[#1a3a6b]" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Analisis & Rekomendasi AI (KrooLLM)</h3>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-600 leading-relaxed italic">
                  {aiInsight ? `"${aiInsight}"` : '"Belum ada analisis untuk periode ini."'}
                </p>
              </div>
            </div>

            {/* Summary Table Ringkasan */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Ikhtisar Posisi Keuangan</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse rounded-2xl overflow-hidden">
                  <tbody>
                    <SectionHeader label="1. Laba Rugi" />
                    <Row label="Total Pemasukan" value={fv(revenueTotal)} indent />
                    <Row label="Total Pengeluaran" value={`(${fv(expenseTotal)})`} indent color="text-red-500" />
                    <Row label={labaRugiBersih >= 0 ? "Keuntungan Bersih (Laba)" : "Kerugian Bersih (Rugi)"} value={fv(Math.abs(labaRugiBersih))} bold color={labaRugiBersih >= 0 ? "text-emerald-600" : "text-red-500"} />
                    <SectionHeader label="2. Neraca (Posisi)" />
                    <Row label="Total Aset" value={fv(totalAset)} indent />
                    <Row label="Total Liabilitas" value={fv(endingLiabilities)} indent color="text-red-500" />
                    <Row label="Modal Akhir" value={fv(modalAkhir)} indent />
                    <Row label="Total Liabilitas + Ekuitas" value={fv(totalLiabilitasEkuitas)} bold color={isBalanced ? "text-emerald-600" : "text-yellow-600"} />
                    <SectionHeader label="3. Arus Kas" />
                    <Row label="Kas Awal Periode" value={fv(initialCash)} indent />
                    <Row label="Perubahan Bersih Kas" value={fv(netChange)} indent color={netChange >= 0 ? "text-emerald-600" : "text-red-500"} />
                    <Row label="Saldo Kas Akhir" value={fv(endingBalance)} bold color={endingBalance >= 0 ? "text-[#1a3a6b]" : "text-red-500"} />
                  </tbody>
                </table>
              </div>
              {!isBalanced && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-2xl border border-yellow-200 text-[10px] text-yellow-700 font-bold flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Neraca belum seimbang (selisih {formatRupiah(balanceDiff)}). Pastikan semua transaksi modal, aset &amp; pinjaman telah mencantumkan kata kunci yang sesuai di deskripsi.
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ════════ LABA RUGI ════════ */}
        {activeTab === "labarugi" && (
          <motion.div key="labarugi" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="mb-6">
                <h3 className="text-base font-black text-slate-800">Laporan Laba Rugi</h3>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Periode: {dateRangeStr} · {profile.nama}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b-2 border-slate-100">
                      <th className="px-5 py-3">Akun & Keterangan</th>
                      <th className="px-5 py-3 text-right">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    <SectionHeader label="Pemasukan" />
                    <Row indent label="Penerimaan dari Pelanggan" value={fv(penerimaanPelanggan)} />
                    <Row indent label="Pendapatan Lain-lain" value={fv(pendapatanLainnya)} />
                    <SubTotal label="Total Pemasukan" value={fv(revenueTotal)} />
                    <SectionHeader label="Pengeluaran" />
                    <Row indent label="Biaya Produksi / Pembelian Barang" value={`(${fv(pembayaranPemasok)})`} color="text-red-500" />
                    <Row indent label="Biaya Operasional" value={`(${fv(pengeluaranOperasional)})`} color="text-red-500" />
                    <SubTotal label="Total Pengeluaran" value={`(${fv(expenseTotal)})`} color="text-red-500" />
                    <GrandTotal label={labaRugiBersih >= 0 ? "KEUNTUNGAN BERSIH" : "KERUGIAN BERSIH"} value={fv(Math.abs(labaRugiBersih))} />
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ════════ BUKU BESAR ════════ */}
        {activeTab === "bukubesar" && (
          <motion.div key="bukubesar" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-base font-black text-slate-800">Rincian Transaksi (Buku Besar)</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">Daftar mutasi kas historis secara mendetail</p>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Cari transaksi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-slate-400 border-b-2 border-slate-100">
                      <th className="px-5 py-4">ID Transaksi</th>
                      <th className="px-5 py-4">Tanggal</th>
                      <th className="px-5 py-4">Keterangan</th>
                      <th className="px-5 py-4 text-right">Debit (Masuk)</th>
                      <th className="px-5 py-4 text-right">Kredit (Keluar)</th>
                      <th className="px-5 py-4 text-right">Saldo Kas</th>
                      <th className="px-5 py-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredTransactions.map((t) => {
                      const totalVal = getTransactionAmount(t);
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/80 transition-all text-xs font-bold text-slate-700">
                          <td className="px-5 py-4">
                            <div className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">{t.trxId}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-slate-500 font-medium whitespace-nowrap">
                              <Calendar className="w-3 h-3 text-slate-300" />
                              {t.tanggal}
                            </div>
                          </td>
                          <td className="px-5 py-4 min-w-[200px]">
                            <p className="text-xs font-bold text-slate-900">{t.namaPembeli || "Transaksi Manual"}</p>
                            {t.userId && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold mt-0.5">
                                <User className="w-2.5 h-2.5" /> {t.userId}
                              </div>
                            )}
                            {t.notes && (
                              <div className="flex items-start gap-1 text-[10px] text-slate-400 italic font-normal mt-0.5">
                                <Quote className="w-2.5 h-2.5 mt-0.5 shrink-0" />"{t.notes}"
                              </div>
                            )}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {t.tipe === "Debit" ? (
                              <span className="text-emerald-600 font-black">+ {formatRupiah(totalVal).replace("Rp", "").trim()}</span>
                            ) : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-5 py-4 text-right">
                            {t.tipe === "Kredit" ? (
                              <span className="text-red-500 font-black">- {formatRupiah(totalVal).replace("Rp", "").trim()}</span>
                            ) : <span className="text-slate-200">—</span>}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <span className="font-black text-slate-900">{formatRupiah(balanceMap.get(t.id) || 0)}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => { setSelectedReceipt(t); setSelectedDocType("Invoice"); }}
                                className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all border-none cursor-pointer"
                                title="Lihat Invoice"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDownloadDocumentPdf(t.id, t.trxId, "Invoice")}
                                disabled={downloadingId === t.id}
                                className={`p-2 rounded-xl transition-all border-none cursor-pointer flex items-center justify-center ${downloadingId === t.id ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white"}`}
                                title="Unduh Invoice PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {t.tipe === "Debit" && (
                                t.statusPembayaran === "Lunas" ? (
                                  <button
                                    onClick={() => { setSelectedReceipt(t); setSelectedDocType("Kwitansi"); }}
                                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border-none cursor-pointer"
                                    title="Lihat Kwitansi"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button disabled className="p-2 bg-slate-100 text-slate-300 rounded-xl cursor-not-allowed opacity-50 border-none" title="Kwitansi hanya tersedia setelah lunas">
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}
                              <button
                                onClick={() => handleEdit(t)}
                                className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-700 hover:text-white transition-all border-none cursor-pointer"
                                title="Edit Transaksi"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(t.id)}
                                className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border-none cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTransactions.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-5 py-12 text-center text-slate-400 italic uppercase font-bold text-[10px] tracking-widest">
                          Tidak ada data transaksi yang cocok
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
