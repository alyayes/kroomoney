import React from "react";
import { Plus, X, Edit2, Trash2, User, Phone, Box, Coins, CalendarCheck } from "lucide-react";
import { motion } from "motion/react";

interface Customer {
  id_pelanggan: string;
  nama_pelanggan: string;
  no_whatsapp: string;
  paket_hosting: string;
  nominal_tagihan: number;
  tanggal_jatuh_tempo: string;
}

interface MasterDataPanelProps {
  customers: Customer[];
  showAddCustomerModal: boolean;
  setShowAddCustomerModal: (val: boolean) => void;
  editingCustomer: Customer | null;
  setEditingCustomer: (customer: Customer | null) => void;
  customerForm: {
    id_pelanggan: string;
    nama_pelanggan: string;
    no_whatsapp: string;
    paket_hosting: string;
    nominal_tagihan: string;
    tanggal_jatuh_tempo: string;
  };
  setCustomerForm: React.Dispatch<React.SetStateAction<{
    id_pelanggan: string;
    nama_pelanggan: string;
    no_whatsapp: string;
    paket_hosting: string;
    nominal_tagihan: string;
    tanggal_jatuh_tempo: string;
  }>>;
  handleSaveCustomer: (e: React.FormEvent) => void;
  handleDeleteCustomer: (id: string, name: string) => void;
}

export default function MasterDataPanel({
  customers,
  showAddCustomerModal,
  setShowAddCustomerModal,
  editingCustomer,
  setEditingCustomer,
  customerForm,
  setCustomerForm,
  handleSaveCustomer,
  handleDeleteCustomer
}: MasterDataPanelProps) {
  
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0
    }).format(num);
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setCustomerForm({
      id_pelanggan: `KRM-${Math.floor(100 + Math.random() * 900)}`,
      nama_pelanggan: "",
      no_whatsapp: "08",
      paket_hosting: "Basic Hosting",
      nominal_tagihan: "150000",
      tanggal_jatuh_tempo: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0] // default 30 days
    });
    setShowAddCustomerModal(true);
  };

  const openEditModal = (cust: Customer) => {
    setEditingCustomer(cust);
    setCustomerForm({
      id_pelanggan: cust.id_pelanggan,
      nama_pelanggan: cust.nama_pelanggan,
      no_whatsapp: cust.no_whatsapp,
      paket_hosting: cust.paket_hosting,
      nominal_tagihan: cust.nominal_tagihan.toString(),
      tanggal_jatuh_tempo: cust.tanggal_jatuh_tempo.split("T")[0]
    });
    setShowAddCustomerModal(true);
  };

  return (
    <motion.div
      key="master-customers"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 w-full font-sans text-[#1E2D50]"
    >
      {/* Upper Actions bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#DBEEFF] shadow-[0_4px_12px_-4px_rgba(58,123,213,0.04)]">
        <div>
          <h4 className="text-base font-black text-[#1E2D50]">Pangkalan Data Pelanggan Hosting Kroombox</h4>
          <p className="text-xs text-[#5A6A85] font-medium">Data ini digunakan oleh bendahara untuk membuat tagihan otomatis.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer border-none"
        >
          <Plus className="w-4 h-4" /> DAFTARKAN PELANGGAN BARU
        </button>
      </div>

      {/* Customers Table list */}
      <div className="bg-white rounded-2xl border border-[#DBEEFF] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-[#EAF4FF] border-b border-[#DBEEFF] text-[10px] font-black uppercase text-[#5A6A85] tracking-widest select-none">
                <th className="py-5 px-6">ID Pelanggan</th>
                <th className="py-5 px-6">Nama Pelanggan</th>
                <th className="py-5 px-6">No WhatsApp</th>
                <th className="py-5 px-6">Paket Hosting</th>
                <th className="py-5 px-6 text-right">Nominal Tagihan</th>
                <th className="py-5 px-6">Jatuh Tempo</th>
                <th className="py-5 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DBEEFF]">
              {customers.length > 0 ? (
                customers.map(cust => (
                  <tr key={cust.id_pelanggan} className="hover:bg-slate-50 transition-colors text-sm font-medium">
                    <td className="py-5 px-6 font-mono font-bold text-xs text-[#2563EB]">{cust.id_pelanggan}</td>
                    <td className="py-5 px-6 font-bold text-[#1E2D50]">{cust.nama_pelanggan}</td>
                    <td className="py-5 px-6 font-mono text-xs text-slate-500">{cust.no_whatsapp}</td>
                    <td className="py-5 px-6">
                      <span className="bg-[#EAF4FF] text-[#2563EB] px-2.5 py-1 rounded-lg text-xs font-bold border border-[#DBEEFF]">
                        {cust.paket_hosting}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right font-black text-[#1E2D50]">
                      {formatRupiah(cust.nominal_tagihan)}
                    </td>
                    <td className="py-5 px-6 text-xs text-[#5A6A85] font-semibold">
                      {cust.tanggal_jatuh_tempo ? cust.tanggal_jatuh_tempo.split("T")[0] : "-"}
                    </td>
                    <td className="py-5 px-6 text-right space-x-2">
                      {/* Edit button */}
                      <button
                        onClick={() => openEditModal(cust)}
                        className="p-2 bg-slate-50 border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-100 transition-all active:scale-90 cursor-pointer"
                        title="Edit Data Pelanggan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteCustomer(cust.id_pelanggan, cust.nama_pelanggan)}
                        className="p-2 bg-red-50 border border-red-200 text-red-500 rounded-lg hover:bg-red-100 transition-all active:scale-90 cursor-pointer"
                        title="Hapus Pelanggan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#5A6A85]/40 text-xs font-black uppercase tracking-wider">
                    Belum ada data pelanggan terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CRUD CUSTOMER MODAL */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-[#1E2D50]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-[#DBEEFF] shadow-2xl p-6 w-full max-w-md relative overflow-hidden"
          >
            <button
              onClick={() => setShowAddCustomerModal(false)}
              className="absolute right-4 top-4 p-2 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-xl border-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-black text-[#1E2D50] tracking-tight mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-[#2563EB]" />
              {editingCustomer ? "Edit Profil Pelanggan" : "Daftarkan Pelanggan Baru"}
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">ID Pelanggan (Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="KRM-XXX"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-mono font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  value={customerForm.id_pelanggan}
                  onChange={e => setCustomerForm(prev => ({ ...prev, id_pelanggan: e.target.value.toUpperCase() }))}
                  readOnly={!!editingCustomer}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1">Nama Lengkap Pelanggan</label>
                <input
                  type="text"
                  required
                  placeholder="Budi Santoso"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  value={customerForm.nama_pelanggan}
                  onChange={e => setCustomerForm(prev => ({ ...prev, nama_pelanggan: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" /> No WhatsApp Aktif
                </label>
                <input
                  type="text"
                  required
                  placeholder="08XXXXXXXXXX"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                  value={customerForm.no_whatsapp}
                  onChange={e => setCustomerForm(prev => ({ ...prev, no_whatsapp: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1 flex items-center gap-1">
                  <Box className="w-3 h-3" /> Paket Hosting Kroombox
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all cursor-pointer"
                  value={customerForm.paket_hosting}
                  onChange={e => setCustomerForm(prev => ({ ...prev, paket_hosting: e.target.value }))}
                >
                  <option value="Basic Hosting">Basic Hosting (Rp 150.000)</option>
                  <option value="Pro Hosting">Pro Hosting (Rp 250.000)</option>
                  <option value="Enterprise Hosting">Enterprise Hosting (Rp 500.000)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1 flex items-center gap-1">
                    <Coins className="w-3 h-3" /> Tagihan (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="150000"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all"
                    value={customerForm.nominal_tagihan}
                    onChange={e => setCustomerForm(prev => ({ ...prev, nominal_tagihan: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-[#5A6A85] tracking-widest ml-1 flex items-center gap-1">
                    <CalendarCheck className="w-3 h-3" /> Jatuh Tempo
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:outline-none focus:border-[#2563EB] focus:bg-white transition-all cursor-pointer"
                    value={customerForm.tanggal_jatuh_tempo}
                    onChange={e => setCustomerForm(prev => ({ ...prev, tanggal_jatuh_tempo: e.target.value }))}
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl text-xs shadow-md transition-all active:scale-98 cursor-pointer border-none"
                >
                  SIMPAN DATABASE PELANGGAN
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
