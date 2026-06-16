import React from "react";
import {
  Calendar,
  User,
  Quote,
  Tag,
  FileText,
  Edit,
  Trash2,
  Download,
  Search,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
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
}

export default function ReportPanel({
  filteredTransactions,
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
  setSelectedDocType
}: ReportPanelProps) {
  const reportData = [
    { name: 'Debit', value: totalIncome, fill: '#2563eb' },
    { name: 'Kredit', value: totalExpense, fill: '#ef4444' }
  ];

  // Sort oldest first to calculate running balance correctly
  const chronologicalTransactions = [...filteredTransactions].sort(
    (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
  );

  const balanceMap = new Map<string, number>();
  let currentBalance = 0;
  chronologicalTransactions.forEach((t) => {
    const amount = t.jumlah * t.kuantitas;
    if (t.tipe === "Debit") {
      currentBalance += amount;
    } else {
      currentBalance -= amount;
    }
    balanceMap.set(t.id, currentBalance);
  });

  return (
    <motion.div
      key="laporan"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 w-full"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Laporan Keuangan</h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Ringkasan Analitik Finansial & Dokumen Penagihan</p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl text-xs transition-all shadow-md cursor-pointer border-none"
        >
          <Download className="w-4.5 h-4.5" /> Export Laporan Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* KPI Summaries */}
        <div className="lg:col-span-8 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-6">Konsolidasi Arus Kas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Debit</span>
                <p className="text-xl font-bold text-emerald-600">{formatRupiah(totalIncome)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total Kredit</span>
                <p className="text-xl font-bold text-red-500">{formatRupiah(totalExpense)}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Saldo Akhir</span>
                <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? "text-blue-600" : "text-red-600"}`}>
                  {formatRupiah(totalIncome - totalExpense)}
                </p>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-medium pt-6 border-t border-slate-50 mt-6">
            Laporan ini dibuat secara otomatis berdasarkan akumulasi data yang tersimpan di dalam sistem.
          </div>
        </div>

        {/* Donut Chart */}
        <div className="lg:col-span-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center">
          <h3 className="text-base font-bold text-slate-800 self-start mb-4">Rasio Finansial</h3>
          <div className="relative w-full aspect-square max-w-[200px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reportData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {reportData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  formatter={(value: number) => [formatRupiah(value), '']}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari TRX ID, nama pembeli, atau user..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-600 focus:bg-white transition-all text-xs font-bold"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Buku Besar / Rincian Laporan Kas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[1100px]">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <th className="px-6 py-5">ID</th>
                <th className="px-6 py-5">Tanggal</th>
                <th className="px-6 py-5">Keterangan / Deskripsi</th>
                <th className="px-6 py-5">Debit (Masuk)</th>
                <th className="px-6 py-5">Kredit (Keluar)</th>
                <th className="px-6 py-5">Saldo Kas</th>
                <th className="px-6 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-all group text-xs font-bold text-slate-700">
                  <td className="px-6 py-5">
                    <div className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">{t.trxId}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500 font-medium whitespace-nowrap">
                      <Calendar className="w-3.5 h-3.5 text-slate-300" />
                      {t.tanggal}
                    </div>
                  </td>
                  <td className="px-6 py-5 min-w-[220px]">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-slate-900">{t.namaPembeli || 'Transaksi Manual'}</p>
                      {t.userId && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                          <User className="w-3 h-3" />
                          ID: {t.userId}
                        </div>
                      )}
                      {t.notes && (
                        <div className="flex items-start gap-1 text-[10px] text-slate-400 italic font-normal">
                          <Quote className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                          "{t.notes}"
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {t.tipe === "Debit" ? (
                      <span className="text-sm font-black text-emerald-600">
                        + {formatRupiah(t.jumlah * t.kuantitas).replace("Rp", "").trim()}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-normal">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {t.tipe === "Kredit" ? (
                      <span className="text-sm font-black text-red-500">
                        - {formatRupiah(t.jumlah * t.kuantitas).replace("Rp", "").trim()}
                      </span>
                    ) : (
                      <span className="text-slate-300 font-normal">-</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-black text-slate-900">
                      {formatRupiah(balanceMap.get(t.id) || 0)}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {/* Invoice - selalu tersedia untuk semua transaksi */}
                      <button
                        onClick={() => { setSelectedReceipt(t); setSelectedDocType("Invoice"); }}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border-none cursor-pointer"
                        title="Lihat Invoice"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {/* Kwitansi - hanya jika Debit dan Lunas */}
                      {t.tipe === "Debit" && (
                        t.statusPembayaran === "Lunas" ? (
                          <button
                            onClick={() => { setSelectedReceipt(t); setSelectedDocType("Kwitansi"); }}
                            className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm border-none cursor-pointer"
                            title="Lihat Kwitansi"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-2 bg-slate-100 text-slate-300 rounded-xl cursor-not-allowed opacity-50 border-none"
                            title="Kwitansi hanya tersedia setelah pembayaran lunas."
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )
                      )}
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm border-none cursor-pointer"
                        title="Edit Transaksi"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(t.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm border-none cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic uppercase font-bold text-xs">Tidak ada data transaksi yang cocok dengan pencarian</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
