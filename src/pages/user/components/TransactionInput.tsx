import React from "react";
import { PlusCircle, Calendar, Phone, Save, Quote, Tag } from "lucide-react";
import { motion } from "motion/react";

interface FormState {
  trxId: string;
  tanggal: string;
  userId: string;
  tipe: "Debit" | "Kredit";
  statusPembayaran: "Lunas" | "Pending" | "Belum Lunas" | "DP";
  statusDokumen: "Draft" | "Diproses" | "Disetujui";
  sertakanTandaTangan: boolean;
  jumlah: string;
  kuantitas: string;
  namaPembeli: string;
  noTelepon: string;
  notes: string;
}

interface Customer {
  id_pelanggan: string;
  nama_pelanggan: string;
  no_whatsapp: string;
  paket_hosting: string;
  nominal_tagihan: number;
  tanggal_jatuh_tempo: string;
}

interface TransactionInputProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  errors: Partial<Record<keyof FormState, string>>;
  isSubmitting: boolean;
  handleSave: (e: React.FormEvent) => void;
  handleAmountChange: (value: string) => void;
  customers: Customer[];
}

export default function TransactionInput({
  form,
  setForm,
  errors,
  isSubmitting,
  handleSave,
  handleAmountChange,
  customers
}: TransactionInputProps) {
  return (
    <motion.div
      key="input"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full"
    >
      <div className="lg:col-span-12 xl:col-span-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(30,136,229,0.1)] border border-slate-100 p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32 -z-10" />

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-blue-200">
                <PlusCircle className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Input Transaksi</h2>
                <p className="text-slate-400 text-sm font-medium">Catat aktivitas keuangan harian Anda</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TRX ID:</span>
              <span className="text-sm font-bold text-blue-600 font-mono">{form.trxId}</span>
            </div>
          </div>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">ID Transaksi</label>
              <input
                readOnly
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-mono text-sm cursor-default"
                value={form.trxId}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tanggal Transaksi</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input
                  type="date"
                  className={`w-full pl-12 pr-6 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold ${errors.tanggal ? 'border-red-500 bg-red-50 border-solid' : 'border-slate-100 border-solid'}`}
                  value={form.tanggal}
                  onChange={(e) => setForm(f => ({ ...f, tanggal: e.target.value }))}
                />
              </div>
              {errors.tanggal && <p className="text-[10px] text-red-500 font-bold ml-2 italic">{errors.tanggal}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tipe Transaksi</label>
              <select
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold appearance-none cursor-pointer"
                value={form.tipe}
                onChange={(e) => setForm(f => ({ ...f, tipe: e.target.value as any }))}
              >
                <option value="Debit">Debit (Uang Masuk / Pemasukan)</option>
                <option value="Kredit">Kredit (Uang Keluar / Pengeluaran)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Status Pembayaran</label>
              <select
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold appearance-none cursor-pointer"
                value={form.statusPembayaran}
                onChange={(e) => setForm(f => ({ ...f, statusPembayaran: e.target.value as any }))}
              >
                <option value="Lunas">Lunas</option>
                <option value="Pending">Pending</option>
                <option value="Belum Lunas">Belum Lunas</option>
                <option value="DP">DP (Down Payment)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Status Dokumen</label>
              <select
                className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold appearance-none cursor-pointer"
                value={form.statusDokumen}
                onChange={(e) => {
                  const status = e.target.value as any;
                  setForm(f => ({ 
                    ...f, 
                    statusDokumen: status,
                    sertakanTandaTangan: status === "Disetujui" ? true : f.sertakanTandaTangan
                  }));
                }}
              >
                <option value="Draft">Draft</option>
                <option value="Diproses">Diproses</option>
                <option value="Disetujui">Disetujui (Approved)</option>
              </select>
            </div>

            {/* Checkbox for Sertakan Tanda Tangan */}
            <div className="flex items-center gap-3 pt-6 pl-2 lg:col-span-1">
              <input
                type="checkbox"
                id="sertakanTandaTangan"
                className="w-5 h-5 text-blue-600 border-slate-200 rounded focus:ring-blue-500"
                checked={form.sertakanTandaTangan}
                disabled={form.statusDokumen === "Draft" || form.statusDokumen === "Disetujui"}
                onChange={(e) => setForm(f => ({ ...f, sertakanTandaTangan: e.target.checked }))}
              />
              <div className="flex flex-col">
                <label htmlFor="sertakanTandaTangan" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Centang Tanda Tangan
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {form.statusDokumen === "Draft" 
                    ? "Tanda tangan dilarang untuk Draft" 
                    : form.statusDokumen === "Disetujui" 
                      ? "Tanda tangan wajib untuk Disetujui" 
                      : "Opsional jika status Diproses"}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Jumlah Nominal (Rupiah)</label>
              <input
                type="text"
                placeholder="e.g. 50.000"
                className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold ${errors.jumlah ? 'border-red-500 bg-red-50 border-solid' : 'border-slate-100 border-solid'}`}
                value={form.jumlah}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
              {errors.jumlah && <p className="text-[10px] text-red-500 font-bold ml-2 italic">{errors.jumlah}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Kuantitas / Jumlah Item</label>
              <input
                type="number"
                min="1"
                className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold ${errors.kuantitas ? 'border-red-500 bg-red-50 border-solid' : 'border-slate-100 border-solid'}`}
                value={form.kuantitas}
                onChange={(e) => setForm(f => ({ ...f, kuantitas: e.target.value }))}
              />
              {errors.kuantitas && <p className="text-[10px] text-red-500 font-bold ml-2 italic">{errors.kuantitas}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nama Pembeli / Keterangan</label>
              <div className="relative">
                <Quote className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input
                  type="text"
                  placeholder="e.g. Dian Nugraha"
                  className={`w-full pl-12 pr-6 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold ${errors.namaPembeli ? 'border-red-500 bg-red-50 border-solid' : 'border-slate-100 border-solid'}`}
                  value={form.namaPembeli}
                  onChange={(e) => setForm(f => ({ ...f, namaPembeli: e.target.value }))}
                />
              </div>
              {errors.namaPembeli && <p className="text-[10px] text-red-500 font-bold ml-2 italic">{errors.namaPembeli}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">No WhatsApp Pembeli</label>
              <div className="relative">
                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input
                  type="text"
                  placeholder="e.g. 0812XXXXXXXX"
                  className={`w-full pl-12 pr-6 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold ${errors.noTelepon ? 'border-red-500 bg-red-50 border-solid' : 'border-slate-100 border-solid'}`}
                  value={form.noTelepon}
                  onChange={(e) => setForm(f => ({ ...f, noTelepon: e.target.value }))}
                />
              </div>
              {errors.noTelepon && <p className="text-[10px] text-red-500 font-bold ml-2 italic">{errors.noTelepon}</p>}
            </div>

            <div className="space-y-2 lg:col-span-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Catatan Tambahan (Notes)</label>
              <div className="relative">
                <Tag className="absolute left-5 top-6 w-4 h-4 text-blue-500" />
                <textarea
                  placeholder="Catatan detail transaksi..."
                  rows={3}
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold"
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div className="lg:col-span-3 pt-4 flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white font-black py-4.5 rounded-2xl text-xs shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-3 border-none cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? "MENYIMPAN..." : "SIMPAN TRANSAKSI"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
