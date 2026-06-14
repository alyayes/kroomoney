import React from "react";
import { Filter, Download, Search } from "lucide-react";
import { motion } from "motion/react";

interface Transaction {
  id: string;
  trxId: string;
  tanggal: string;
  userId: string;
  tipe: "Pemasukan" | "Pengeluaran";
  statusPembayaran: "Lunas" | "Pending" | "Belum Lunas" | "DP";
  jumlah: number;
  kuantitas: number;
  namaPembeli: string;
  noTelepon: string;
  notes: string;
}

interface GlobalReportListProps {
  filteredTransactions: Transaction[];
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  filterDate: string;
  setFilterDate: (val: string) => void;
  filterUser: string;
  setFilterUser: (val: string) => void;
  filterType: string;
  setFilterType: (val: string) => void;
  handleExportExcel: () => void;
  handleExportCSV: () => void;
}

export default function GlobalReportList({
  filteredTransactions,
  searchQuery,
  setSearchQuery,
  filterDate,
  setFilterDate,
  filterUser,
  setFilterUser,
  filterType,
  setFilterType,
  handleExportExcel,
  handleExportCSV
}: GlobalReportListProps) {
  return (
    <motion.div
      key="global-reports"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 w-full"
    >
      {/* Reports Filter Widgets */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <h4 className="text-base font-black text-[#1E2D50] tracking-tight flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#2563EB]" /> Filter Laporan Keuangan Staf
          </h4>
          
          {/* EXPORTS BUTTONS */}
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 bg-slate-50 border border-slate-100 text-[#2563EB] hover:bg-slate-100 px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer border-none"
            >
              <Download className="w-4 h-4" /> EXPORT EXCEL
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-slate-50 border border-slate-100 text-[#2563EB] hover:bg-slate-100 px-4 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer border-none"
            >
              <Download className="w-4 h-4" /> EXPORT CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari TRX ID, nama..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Date filter */}
          <input
            type="date"
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all cursor-pointer"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
          />

          {/* User / Pelanggan filter */}
          <input
            type="text"
            placeholder="User ID / Pelanggan"
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
          />

          {/* Type Filter */}
          <select
            className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all cursor-pointer"
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
          >
            <option value="">Semua Tipe</option>
            <option value="Pemasukan">Pemasukan (Income)</option>
            <option value="Pengeluaran">Pengeluaran (Expense)</option>
          </select>
        </div>
      </div>

      {/* Consolidated list table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400 tracking-widest select-none">
                <th className="py-5 px-6">TRX ID</th>
                <th className="py-5 px-6">Tanggal</th>
                <th className="py-5 px-6">User ID</th>
                <th className="py-5 px-6">Pelanggan</th>
                <th className="py-5 px-6">Tipe</th>
                <th className="py-5 px-6">Status</th>
                <th className="py-5 px-6 text-right">Total Transaksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 transition-colors text-sm font-medium">
                    <td className="py-5 px-6 font-mono font-bold text-xs text-[#2563EB]">{t.trxId}</td>
                    <td className="py-5 px-6 text-xs font-bold text-[#5A6A85]">{t.tanggal}</td>
                    <td className="py-5 px-6 font-mono font-bold text-xs text-[#5A6A85]">{t.userId}</td>
                    <td className="py-5 px-6 font-bold text-[#1E2D50]">{t.namaPembeli}</td>
                    <td className="py-5 px-6">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        t.tipe === "Pemasukan" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"
                      }`}>
                        {t.tipe}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                        t.statusPembayaran === "Lunas" ? "bg-blue-50 text-[#2563EB]" : "bg-amber-50 text-amber-600"
                      }`}>
                        {t.statusPembayaran}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right font-black text-[#1E2D50]">
                      Rp {(t.jumlah * t.kuantitas).toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5A6A85]/40 text-xs font-black uppercase tracking-wider">
                    Tidak ada data transaksi yang cocok dengan filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
