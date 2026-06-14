import React from "react";
import { CheckCircle2, Package, Search, FileText } from "lucide-react";
import { motion } from "motion/react";
import { Transaction } from "../useUserDashboard";

interface PaymentPendingProps {
  filteredTransactions: Transaction[];
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  handleApprove: (id: string) => void;
  formatRupiah: (number: number) => string;
  setSelectedReceipt: React.Dispatch<React.SetStateAction<Transaction | null>>;
  setSelectedDocType: React.Dispatch<React.SetStateAction<"Invoice" | "Kwitansi">>;
}

export default function PaymentPending({
  filteredTransactions,
  searchTerm,
  setSearchTerm,
  handleApprove,
  formatRupiah,
  setSelectedReceipt,
  setSelectedDocType
}: PaymentPendingProps) {
  const pendingPayments = filteredTransactions.filter(
    (t) => t.statusPembayaran === "Pending"
  );

  return (
    <motion.div
      key="pembayaran"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6 w-full"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Verifikasi Pembayaran</h2>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1">Konfirmasi Pembayaran Pending Menjadi Lunas</p>
        </div>
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari tagihan pending..."
            className="w-full sm:w-64 pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse text-left min-w-[900px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest select-none">
                <th className="py-5 px-6">ID Trx</th>
                <th className="py-5 px-6">Tanggal</th>
                <th className="py-5 px-6">User ID</th>
                <th className="py-5 px-6">Pelanggan</th>
                <th className="py-5 px-6">Total Tagihan</th>
                <th className="py-5 px-6">Tipe</th>
                <th className="py-5 px-6">Status</th>
                <th className="py-5 px-6 text-right">Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingPayments.length > 0 ? (
                pendingPayments.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors text-xs font-bold text-slate-700">
                    <td className="py-5 px-6 font-mono text-blue-600">{t.trxId}</td>
                    <td className="py-5 px-6 text-slate-500">{t.tanggal}</td>
                    <td className="py-5 px-6 font-mono text-slate-400">{t.userId}</td>
                    <td className="py-5 px-6 text-slate-900">{t.namaPembeli}</td>
                    <td className="py-5 px-6 text-amber-600">{formatRupiah(t.jumlah * t.kuantitas)}</td>
                    <td className="py-5 px-6 text-slate-500">{t.tipe}</td>
                    <td className="py-5 px-6">
                      <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-amber-50 text-amber-600">
                        {t.statusPembayaran}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right space-x-2">
                      <button
                        onClick={() => { setSelectedReceipt(t); setSelectedDocType("Invoice"); }}
                        className="inline-flex items-center justify-center p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg border-none active:scale-95 transition-all cursor-pointer"
                        title="Lihat Nota"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleApprove(t.id)}
                        className="inline-flex items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-100 px-4 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Setujui Lunas
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center opacity-20">
                      <Package className="w-16 h-16 mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">Tidak ada tagihan tertunda</p>
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
