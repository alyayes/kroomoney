import React from "react";
import { PlusCircle, Calendar, Phone, Save, Quote, Tag, Plus, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { formatDecimalInput, parseDecimalInput } from "../useUserDashboard";

interface FormState {
  trxId: string;
  tanggal: string;
  userId: string;
  tipe: "Debit" | "Kredit";
  statusPembayaran: "Lunas" | "Pending" | "Belum Lunas" | "DP";
  jumlah: string;
  kuantitas: string;
  diskon: string;
  namaPembeli: string;
  noTelepon: string;
  notes: string;
  items?: Array<{
    tanggal: string;
    tipe: "Debit" | "Kredit";
    statusPembayaran: "Lunas" | "Pending" | "Belum Lunas" | "DP";
    jumlah: string;
    kuantitas: string;
    diskon: string;
    namaPembeli: string;
    noTelepon: string;
    notes: string;
  }>;
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
  handleDiscountChange: (value: string) => void;
  customers: Customer[];
}

export default function TransactionInput({
  form,
  setForm,
  errors,
  isSubmitting,
  handleSave,
  handleAmountChange,
  handleDiscountChange,
  customers
}: TransactionInputProps) {
  const items = form.items || [];

  const handleAddItem = () => {
    setForm(f => {
      const currentItems = f.items || [];
      let newItems = [...currentItems];
      
      if (currentItems.length === 0) {
        newItems.push({
          tanggal: f.tanggal,
          tipe: f.tipe,
          statusPembayaran: f.statusPembayaran,
          jumlah: f.jumlah || "0",
          kuantitas: f.kuantitas || "1",
          diskon: f.diskon || "0",
          namaPembeli: f.namaPembeli || "",
          noTelepon: f.noTelepon || "",
          notes: f.notes || ""
        });
      }

      newItems.push({
        tanggal: f.tanggal,
        tipe: f.tipe,
        statusPembayaran: f.statusPembayaran,
        jumlah: "0",
        kuantitas: "1",
        diskon: "0",
        namaPembeli: f.namaPembeli || "",
        noTelepon: f.noTelepon || "",
        notes: ""
      });

      const totalAmount = newItems.reduce((acc, curr) => acc + (parseDecimalInput(curr.jumlah) * Number(curr.kuantitas)), 0);
      const totalQty = newItems.reduce((acc, curr) => acc + Number(curr.kuantitas), 0);
      const totalDiscount = newItems.reduce((acc, curr) => acc + parseDecimalInput(curr.diskon), 0);
      
      return {
        ...f,
        items: newItems,
        jumlah: totalAmount.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 }),
        kuantitas: totalQty.toString(),
        diskon: totalDiscount.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 })
      };
    });
  };

  const handleUpdateItem = (index: number, key: 'tanggal' | 'tipe' | 'statusPembayaran' | 'jumlah' | 'kuantitas' | 'diskon' | 'namaPembeli' | 'noTelepon' | 'notes', val: any) => {
    setForm(f => {
      const currentItems = f.items || [];
      const newItems = currentItems.map((item, idx) => {
        if (idx === index) {
          let updatedVal = val;
          if (key === 'kuantitas') updatedVal = Math.max(1, parseInt(val) || 1).toString();
          if (key === 'jumlah' || key === 'diskon') {
            updatedVal = formatDecimalInput(val);
          }
          return { ...item, [key]: updatedVal };
        }
        return item;
      });

      const totalAmount = newItems.reduce((acc, curr) => acc + (parseDecimalInput(curr.jumlah) * Number(curr.kuantitas)), 0);
      const totalQty = newItems.reduce((acc, curr) => acc + Number(curr.kuantitas), 0);
      const totalDiscount = newItems.reduce((acc, curr) => acc + parseDecimalInput(curr.diskon), 0);

      return {
        ...f,
        items: newItems,
        jumlah: totalAmount.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 }),
        kuantitas: totalQty.toString(),
        diskon: totalDiscount.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 })
      };
    });
  };

  const handleRemoveItem = (index: number) => {
    setForm(f => {
      const currentItems = f.items || [];
      const newItems = currentItems.filter((_, idx) => idx !== index);
      const totalAmount = newItems.reduce((acc, curr) => acc + (parseDecimalInput(curr.jumlah) * Number(curr.kuantitas)), 0);
      const totalQty = newItems.reduce((acc, curr) => acc + Number(curr.kuantitas), 0);
      const totalDiscount = newItems.reduce((acc, curr) => acc + parseDecimalInput(curr.diskon), 0);

      return {
        ...f,
        items: newItems,
        jumlah: totalAmount > 0 ? totalAmount.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 }) : "",
        kuantitas: totalQty > 0 ? totalQty.toString() : "1",
        diskon: totalDiscount > 0 ? totalDiscount.toLocaleString("id-ID", { minimumFractionDigits: 0, maximumFractionDigits: 4 }) : "0"
      };
    });
  };

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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Jumlah Nominal (Rupiah)</label>
              <input
                type="text"
                placeholder="e.g. 50.000"
                readOnly={items.length > 0}
                className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold border-solid ${items.length > 0 ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''} ${errors.jumlah ? 'border-red-500 bg-red-50' : 'border-slate-100'}`}
                value={form.jumlah}
                onChange={(e) => handleAmountChange(e.target.value)}
              />
              {errors.jumlah && <p className="text-[10px] text-red-500 font-bold ml-2 italic">{errors.jumlah}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Diskon (Rupiah)</label>
              <input
                type="text"
                placeholder="e.g. 10.000"
                readOnly={items.length > 0}
                className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold border-solid ${items.length > 0 ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''}`}
                value={form.diskon}
                onChange={(e) => handleDiscountChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Kuantitas / Jumlah Item</label>
              <input
                type="number"
                min="1"
                readOnly={items.length > 0}
                className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold border-solid ${items.length > 0 ? 'opacity-70 bg-slate-100 cursor-not-allowed' : ''} ${errors.kuantitas ? 'border-red-500 bg-red-50' : 'border-slate-100'}`}
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

            {/* Multi-Item Builder */}
            <div className="space-y-6 lg:col-span-3 border-t border-slate-100 pt-8 mt-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">Rincian Item (Multi-Item)</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Opsional: Tambahkan beberapa item untuk merinci invoice</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all rounded-xl text-xs font-black border-none flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Tambah Item
                </button>
              </div>

              {items.length > 0 && (
                <div className="space-y-6">
                  {items.map((item, index) => (
                    <div key={index} className="bg-slate-50/50 border border-slate-100 rounded-[2rem] p-6 relative overflow-hidden">
                      <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100/50">
                          Item #{index + 1}
                        </span>
                        <div className="flex items-center gap-4">
                          <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                            Subtotal: <span className="font-extrabold text-slate-800">Rp{Math.max(0, (Number(item.jumlah.replace(/\D/g, "")) * Number(item.kuantitas)) - Number(item.diskon.replace(/\D/g, ""))).toLocaleString("id-ID")}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all border-none bg-transparent cursor-pointer"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
                        {/* TANGGAL TRANSAKSI */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tanggal Transaksi</label>
                          <div className="relative">
                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                            <input
                              type="date"
                              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold border-solid"
                              value={item.tanggal}
                              onChange={(e) => handleUpdateItem(index, 'tanggal', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* TIPE TRANSAKSI */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tipe Transaksi</label>
                          <select
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold appearance-none cursor-pointer border-solid"
                            value={item.tipe}
                            onChange={(e) => handleUpdateItem(index, 'tipe', e.target.value as any)}
                          >
                            <option value="Debit">Debit (Uang Masuk / Pemasukan)</option>
                            <option value="Kredit">Kredit (Uang Keluar / Pengeluaran)</option>
                          </select>
                        </div>

                        {/* STATUS PEMBAYARAN */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Status Pembayaran</label>
                          <select
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold appearance-none cursor-pointer border-solid"
                            value={item.statusPembayaran}
                            onChange={(e) => handleUpdateItem(index, 'statusPembayaran', e.target.value as any)}
                          >
                            <option value="Lunas">Lunas</option>
                            <option value="Pending">Pending</option>
                            <option value="Belum Lunas">Belum Lunas</option>
                            <option value="DP">DP (Down Payment)</option>
                          </select>
                        </div>

                        {/* NAMA PEMBELI / KETERANGAN */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nama Pembeli / Keterangan</label>
                          <div className="relative">
                            <Quote className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                            <input
                              type="text"
                              placeholder="e.g. Dian Nugraha"
                              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold border-solid"
                              value={item.namaPembeli}
                              onChange={(e) => handleUpdateItem(index, 'namaPembeli', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* NO WHATSAPP PEMBELI */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">No WhatsApp Pembeli</label>
                          <div className="relative">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                            <input
                              type="text"
                              placeholder="e.g. 0812XXXXXXXX"
                              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold border-solid"
                              value={item.noTelepon}
                              onChange={(e) => handleUpdateItem(index, 'noTelepon', e.target.value)}
                            />
                          </div>
                        </div>

                        {/* JUMLAH NOMINAL (RUPIAH) */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Jumlah Nominal (Rupiah)</label>
                          <input
                            type="text"
                            placeholder="0"
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold border-solid"
                            value={item.jumlah}
                            onChange={(e) => handleUpdateItem(index, 'jumlah', e.target.value)}
                          />
                        </div>

                        {/* DISKON (RUPIAH) */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Diskon (Rupiah)</label>
                          <input
                            type="text"
                            placeholder="0"
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold border-solid"
                            value={item.diskon}
                            onChange={(e) => handleUpdateItem(index, 'diskon', e.target.value)}
                          />
                        </div>

                        {/* KUANTITAS / JUMLAH ITEM */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Kuantitas / Jumlah Item</label>
                          <input
                            type="number"
                            min="1"
                            className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold border-solid"
                            value={item.kuantitas}
                            onChange={(e) => handleUpdateItem(index, 'kuantitas', e.target.value)}
                          />
                        </div>

                        {/* CATATAN TAMBAHAN (NOTES) */}
                        <div className="space-y-2 lg:col-span-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Catatan Tambahan (Notes)</label>
                          <div className="relative">
                            <Tag className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                            <input
                              type="text"
                              placeholder="Catatan detail item..."
                              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold border-solid"
                              value={item.notes}
                              onChange={(e) => handleUpdateItem(index, 'notes', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
