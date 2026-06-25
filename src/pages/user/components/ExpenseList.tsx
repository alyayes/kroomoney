import React from "react";
import { Search, Download, Trash2, Edit, Package, FileText } from "lucide-react";
import { motion } from "motion/react";
import { Transaction } from "../useUserDashboard";

interface ExpenseListProps {
  filteredTransactions: Transaction[];
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  exportToExcel: () => void;
  handleEdit: (t: Transaction) => void;
  handleDelete: (id: string) => void;
  formatRupiah: (number: number) => string;
  setSelectedReceipt: React.Dispatch<React.SetStateAction<Transaction | null>>;
  setSelectedDocType: React.Dispatch<React.SetStateAction<"Invoice" | "Kwitansi">>;
}

export default function ExpenseList({
  filteredTransactions,
  searchTerm,
  setSearchTerm,
  exportToExcel,
  handleEdit,
  handleDelete,
  formatRupiah,
  setSelectedReceipt,
  setSelectedDocType
}: ExpenseListProps) {
  const expenses = filteredTransactions.filter(t => t.tipe === "Kredit");

  return (
    <motion.div
      key="pengeluaran"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 w-full"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Data Kredit</h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Daftar Seluruh Aliran Kas Kredit Keluar</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi..."
              className="w-full sm:w-64 pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center gap-2 bg-[#EAF4FF] text-blue-600 border border-[#DBEEFF] px-5 py-3 rounded-xl font-bold text-xs hover:bg-[#DBEEFF] transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" /> EXPORT EXCEL
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left min-w-[1100px]">
            <thead>
              <tr className="bg-slate-550/10 bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest select-none">
                <th className="py-5 px-6">ID Trx</th>
                <th className="py-5 px-6">Tanggal</th>
                <th className="py-5 px-6">User ID</th>
                <th className="py-5 px-6">Keterangan</th>
                <th className="py-5 px-6 text-center">Qty</th>
                <th className="py-5 px-6">Harga Satuan</th>
                <th className="py-5 px-6">Total Harga</th>
                <th className="py-5 px-6">Status</th>
                <th className="py-5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length > 0 ? (
                expenses.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-700">
                    <td className="py-5 px-6 font-mono text-red-500">{t.trxId}</td>
                    <td className="py-5 px-6 text-slate-500">{t.tanggal}</td>
                    <td className="py-5 px-6 font-mono text-slate-400">{t.userId}</td>
                    <td className="py-5 px-6 text-slate-900">{t.namaPembeli}</td>
                    <td className="py-5 px-6 text-center">{t.kuantitas}</td>
                    <td className="py-5 px-6">{t.items && t.items.length > 0 ? <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-black uppercase tracking-widest">Multi-Item</span> : formatRupiah(t.jumlah)}</td>
                    <td className="py-5 px-6 text-red-500">{formatRupiah(t.items && t.items.length > 0 ? t.jumlah : t.jumlah * t.kuantitas)}</td>
                    <td className="py-5 px-6">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${t.statusPembayaran === 'Lunas' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {t.statusPembayaran}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                      {/* Invoice - selalu ada */}
                      <button
                        onClick={() => { setSelectedReceipt(t); setSelectedDocType("Invoice"); }}
                        className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border-none active:scale-95 transition-all cursor-pointer inline-flex items-center"
                        title="Lihat Invoice"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      {/* Kwitansi - hanya jika Lunas */}
                      {t.statusPembayaran === "Lunas" && (
                        <button
                          onClick={() => { setSelectedReceipt(t); setSelectedDocType("Kwitansi"); }}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border-none active:scale-95 transition-all cursor-pointer inline-flex items-center"
                          title="Lihat Kwitansi (Lunas)"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg border-none active:scale-95 transition-all cursor-pointer inline-flex items-center"
                        title="Edit Transaksi"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg border-none active:scale-95 transition-all cursor-pointer inline-flex items-center"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center opacity-20">
                      <Package className="w-16 h-16 mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">Tidak ada data pengeluaran</p>
                    </div>
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
