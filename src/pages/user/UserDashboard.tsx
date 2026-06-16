import React from "react";
import {
  Menu,
  Bell,
  PlusCircle,
  ShieldCheck,
  Activity,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  User,
  Quote,
  FileText,
  Download,
  Edit,
  Trash2,
  Save
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useUserDashboard } from "./useUserDashboard";
import SidebarUser from "../../components/SidebarUser";
import UserOverview from "./components/UserOverview";
import TransactionInput from "./components/TransactionInput";
import IncomeList from "./components/IncomeList";
import ExpenseList from "./components/ExpenseList";
import PaymentPending from "./components/PaymentPending";
import ReportPanel from "./components/ReportPanel";
import UserProfile from "./components/UserProfile";
import InvoicePanel from "./components/InvoicePanel";
import KwitansiPanel from "./components/KwitansiPanel";

interface Profile {
  nama: string;
  email: string;
  tandaTangan?: string;
  fotoProfil?: string;
  role?: string;
}

interface UserDashboardProps {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  token: string | null;
  isOffline: boolean;
  setIsOffline: React.Dispatch<React.SetStateAction<boolean>>;
  onLogout: () => void;
}

export default function UserDashboard({
  profile,
  setProfile,
  token,
  isOffline,
  setIsOffline,
  onLogout
}: UserDashboardProps) {
  const {
    isSidebarOpen,
    setIsSidebarOpen,
    activeMenu,
    setActiveMenu,
    notification,
    transactions,
    form,
    setForm,
    errors,
    isSubmitting,
    handleFileUpload,
    terbilang,
    handleAmountChange,
    handleSave,
    handleDelete,
    deletingId,
    setDeletingId,
    confirmDelete,
    handleEdit,
    handleUpdate,
    handleApprove,
    timeframe,
    setTimeframe,
    activeData,
    totalIncome,
    totalExpense,
    netBalance,
    exportToExcel,
    searchTerm,
    setSearchTerm,
    filteredTransactions,
    customers,
    aiInsight,
    isEditModalOpen,
    setIsEditModalOpen,
    selectedReceipt,
    setSelectedReceipt,
    selectedDocType,
    setSelectedDocType,
    debitChangePct,
    kreditChangePct,
    debitDiffAmount,
    kreditDiffAmount,
    pctOperasional,
    pctLayananHosting,
    pctLainLain,
    pctOperasionalBudget,
    pctServerBudget
  } = useUserDashboard({
    profile,
    setProfile,
    token,
    isOffline,
    setIsOffline,
    onLogout
  });

  const [expenseTab, setExpenseTab] = React.useState<"pengeluaran" | "invoice" | "kwitansi">("pengeluaran");

  const formatRupiah = (number: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const generateUserId = () => "USR-" + Math.random().toString(36).substring(2, 11).toUpperCase();

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden w-full">
      
      {/* Sidebar - Desktop */}
      <SidebarUser
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isOffline={isOffline}
        onLogout={onLogout}
      />

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-40 lg:hidden transition-all duration-500"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-[#F8FAFC]">
        {/* Top Header */}
        <header className="h-20 bg-[#F8FAFC]/80 backdrop-blur-xl px-8 flex items-center justify-between shrink-0 z-30 sticky top-0">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-3 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 lg:hidden shadow-sm shadow-slate-200 cursor-pointer"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/50">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Secured Node</span>
            </div>

            <div className="h-10 w-[1px] bg-slate-200 hidden md:block"></div>

            <div className="flex items-center gap-4">
              <button className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm cursor-pointer">
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center p-1.5 shadow-sm group cursor-pointer hover:border-blue-200 transition-all" onClick={() => setActiveMenu("Profil")}>
                <div className="w-full h-full rounded-xl bg-slate-100 overflow-hidden">
                  <img src={profile.fotoProfil || "https://api.dicebear.com/7.x/avataaars/svg?seed=Finance"} alt="User" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 bg-[#F8FAFC] custom-scrollbar pb-24">
          <div className="w-full">
            <AnimatePresence mode="wait">
              {activeMenu === "Dashboard" ? (
                <UserOverview
                  profile={profile}
                  totalIncome={totalIncome}
                  totalExpense={totalExpense}
                  netBalance={netBalance}
                  transactions={transactions}
                  activeData={activeData}
                  timeframe={timeframe}
                  setTimeframe={setTimeframe}
                  formatRupiah={formatRupiah}
                  setActiveMenu={setActiveMenu}
                  aiInsight={aiInsight}
                  debitChangePct={debitChangePct}
                  kreditChangePct={kreditChangePct}
                  debitDiffAmount={debitDiffAmount}
                  kreditDiffAmount={kreditDiffAmount}
                  pctOperasional={pctOperasional}
                  pctLayananHosting={pctLayananHosting}
                  pctLainLain={pctLainLain}
                  pctOperasionalBudget={pctOperasionalBudget}
                  pctServerBudget={pctServerBudget}
                />
              ) : activeMenu === "Input" ? (
                <TransactionInput
                  form={form}
                  setForm={setForm}
                  errors={errors}
                  isSubmitting={isSubmitting}
                  handleSave={handleSave}
                  handleAmountChange={handleAmountChange}
                  customers={customers}
                />
              ) : activeMenu === "Pemasukan" ? (
                <IncomeList
                  filteredTransactions={filteredTransactions}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  exportToExcel={exportToExcel}
                  handleApprove={handleApprove}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  formatRupiah={formatRupiah}
                  setSelectedReceipt={setSelectedReceipt}
                  setSelectedDocType={setSelectedDocType}
                />
              ) : activeMenu === "Pengeluaran" ? (
                <div className="space-y-4 w-full">
                  <div className="flex bg-white p-2 rounded-2xl border border-slate-100 shadow-sm gap-2 w-max mx-auto md:mx-0">
                    <button
                      onClick={() => setExpenseTab("pengeluaran")}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${expenseTab === "pengeluaran" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:bg-slate-50"}`}
                    >
                      Pengeluaran
                    </button>
                    <button
                      onClick={() => setExpenseTab("invoice")}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${expenseTab === "invoice" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:bg-slate-50"}`}
                    >
                      Invoice
                    </button>
                    <button
                      onClick={() => setExpenseTab("kwitansi")}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${expenseTab === "kwitansi" ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:bg-slate-50"}`}
                    >
                      Kwitansi
                    </button>
                  </div>
                  {expenseTab === "pengeluaran" && (
                    <ExpenseList
                      filteredTransactions={filteredTransactions}
                      searchTerm={searchTerm}
                      setSearchTerm={setSearchTerm}
                      exportToExcel={exportToExcel}
                      handleEdit={handleEdit}
                      handleDelete={handleDelete}
                      formatRupiah={formatRupiah}
                    />
                  )}
                  {expenseTab === "invoice" && (
                    <InvoicePanel formatRupiah={formatRupiah} />
                  )}
                  {expenseTab === "kwitansi" && (
                    <KwitansiPanel formatRupiah={formatRupiah} />
                  )}
                </div>

              ) : activeMenu === "Pembayaran" ? (
                <PaymentPending
                  filteredTransactions={filteredTransactions}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  handleApprove={handleApprove}
                  formatRupiah={formatRupiah}
                  setSelectedReceipt={setSelectedReceipt}
                  setSelectedDocType={setSelectedDocType}
                />
              ) : activeMenu === "Laporan" ? (
                <ReportPanel
                  filteredTransactions={filteredTransactions}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  totalIncome={totalIncome}
                  totalExpense={totalExpense}
                  formatRupiah={formatRupiah}
                  profile={profile}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  terbilang={terbilang}
                  exportToExcel={exportToExcel}
                  setSelectedReceipt={setSelectedReceipt}
                  setSelectedDocType={setSelectedDocType}
                />
              ) : activeMenu === "Profil" ? (
                <UserProfile
                  profile={profile}
                  setProfile={setProfile}
                  token={token}
                  isOffline={isOffline}
                  transactionsCount={transactions.length}
                  handleFileUpload={handleFileUpload}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                  <Activity className="w-16 h-16 mb-4 opacity-10" />
                  <p className="text-lg font-bold">Menu "{activeMenu}" segera hadir.</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Tips Helper - Common for all pages */}
          <div className="bg-blue-50/30 p-6 rounded-3xl border border-blue-100 flex items-center gap-5 w-full">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-black text-sm text-blue-900 uppercase tracking-tight">
                Tips Pencatatan
              </h3>
              <p className="text-xs text-blue-600/80 leading-relaxed font-medium">
                Pastikan data yang dimasukkan sudah benar, terutama jumlah dan tipe transaksi.
                Data akan disimpan secara lokal di browser Anda.
              </p>
            </div>
          </div>
        </main>
      </div>

      {/* Global Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100] border ${notification.type === "success"
                ? "bg-emerald-50 border-emerald-100 text-emerald-800"
                : "bg-red-50 border-red-100 text-red-800"
              }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${notification.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
              {notification.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <span className="font-bold text-sm">{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Modal Konfirmasi Hapus Data */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full blur-3xl -mr-16 -mt-16 -z-10" />
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Konfirmasi Hapus Data</h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Tindakan Tidak Dapat Dibatalkan</p>
                </div>
              </div>

              <p className="text-slate-600 text-sm leading-relaxed mb-8">
                Apakah Anda yakin ingin menghapus data transaksi ini? Tindakan ini akan menghapus data secara permanen dari database.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-3.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 rounded-xl font-bold text-xs active:scale-95 transition-all cursor-pointer"
                >
                  BATAL
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-200 active:scale-95 transition-all border-none cursor-pointer"
                >
                  HAPUS DATA
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Modal Edit Transaksi */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl border border-slate-100 relative my-8"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl -mr-24 -mt-24 -z-10" />

              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Edit Transaksi</h3>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mt-0.5">Ubah Rincian Kas Transaksi</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">ID Transaksi (Read-Only)</label>
                  <input
                    readOnly
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-mono text-sm cursor-default"
                    value={form.trxId}
                  />
                </div>



                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">User ID Pelanggan</label>
                  <input
                    readOnly
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 font-mono text-sm cursor-default"
                    value={form.userId}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tanggal Transaksi</label>
                  <div className="relative">
                    <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <input
                      type="date"
                      className={`w-full pl-12 pr-6 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold ${errors.tanggal ? 'border-red-500 bg-red-50' : 'border-slate-100'}`}
                      value={form.tanggal}
                      onChange={(e) => setForm(f => ({ ...f, tanggal: e.target.value }))}
                    />
                  </div>
                  {errors.tanggal && <p className="text-[10px] text-red-500 font-bold ml-2 italic">{errors.tanggal}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tipe Transaksi</label>
                  <select
                    className="w-full px-6 py-4 bg-slate-550/10 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold appearance-none cursor-pointer font-sans"
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
                    className="w-full px-6 py-4 bg-slate-550/10 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold appearance-none cursor-pointer font-sans"
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
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold appearance-none cursor-pointer font-sans"
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

                <div className="flex items-center gap-3 pt-6 pl-2">
                  <input
                    type="checkbox"
                    id="editSertakanTandaTangan"
                    className="w-5 h-5 text-blue-600 border-slate-200 rounded focus:ring-blue-500"
                    checked={form.sertakanTandaTangan}
                    disabled={form.statusDokumen === "Draft" || form.statusDokumen === "Disetujui"}
                    onChange={(e) => setForm(f => ({ ...f, sertakanTandaTangan: e.target.checked }))}
                  />
                  <div className="flex flex-col text-left">
                    <label htmlFor="editSertakanTandaTangan" className="text-xs font-bold text-slate-700 cursor-pointer">
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
                    className={`w-full px-6 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold ${errors.jumlah ? 'border-red-500 bg-red-50' : 'border-slate-100'}`}
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nama Pelanggan / Keterangan</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <input
                      type="text"
                      className={`w-full pl-12 pr-6 py-4 bg-slate-50 border rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold ${errors.namaPembeli ? 'border-red-500 bg-red-50' : 'border-slate-100'}`}
                      value={form.namaPembeli}
                      onChange={(e) => setForm(f => ({ ...f, namaPembeli: e.target.value }))}
                    />
                  </div>
                  {errors.namaPembeli && <p className="text-[10px] text-red-500 font-bold ml-2 italic">{errors.namaPembeli}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">No WhatsApp</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <input
                      type="text"
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold"
                      value={form.noTelepon}
                      onChange={(e) => setForm(f => ({ ...f, noTelepon: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Catatan Tambahan (Notes)</label>
                  <textarea
                    rows={3}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-bold"
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                <div className="md:col-span-2 pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-4 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs transition-all cursor-pointer"
                  >
                    BATAL
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl text-xs shadow-xl shadow-blue-100 transition-all border-none flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> SIMPAN PERUBAHAN
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Global Document Viewer Modal (Nota & Kwitansi) */}
      <AnimatePresence>
        {selectedReceipt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm overflow-y-auto pt-20 pb-20 px-4 flex justify-center"
            onClick={() => setSelectedReceipt(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-[1180px] shadow-2xl rounded-sm relative self-start"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close & Actions */}
              <div className="absolute -top-14 right-0 flex gap-3 print:hidden">
                <button
                  onClick={() => {
                    const docTitle = selectedDocType === "Kwitansi" 
                      ? `Kwitansi_Kroombox_${selectedReceipt.trxId.split('-')[1] || selectedReceipt.id}`
                      : `Nota_Kroombox_${selectedReceipt.trxId.split('-')[1] || selectedReceipt.id}`;
                    // @ts-ignore
                    const element = document.getElementById("invoice-content");
                    if (element) {
                      const opt = {
                        margin: 0,
                        filename: `${docTitle}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2, useCORS: true },
                        jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
                      };
                      // @ts-ignore
                      if (window.html2pdf) {
                        // @ts-ignore
                        window.html2pdf().set(opt).from(element).save();
                      } else {
                        const script = document.createElement("script");
                        script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
                        script.onload = () => {
                          // @ts-ignore
                          window.html2pdf().set(opt).from(element).save();
                        };
                        document.body.appendChild(script);
                      }
                    }
                  }}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:bg-emerald-700 transition-all border-none cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Download PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold text-sm shadow-xl flex items-center gap-2 hover:bg-blue-700 transition-all border-none cursor-pointer"
                >
                  <FileText className="w-4 h-4" /> Cetak
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="bg-white text-slate-600 px-6 py-2 rounded-full font-bold text-sm shadow-xl hover:bg-slate-50 transition-all border-none cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {/* Document Content wrapper */}
              <div className="w-full overflow-x-auto">
                <div 
                  className="p-12 font-sans text-slate-800 relative bg-white flex flex-col justify-between box-border" 
                  style={{ width: "1123px", height: "794px" }}
                  id="invoice-content"
                >
                  {selectedDocType === "Kwitansi" ? (
                    /* ====== KWITANSI DESIGN ====== */
                    <div className="border border-slate-400 h-full flex flex-col font-sans text-slate-900 box-border" style={{ fontFamily: 'Georgia, serif' }}>
                      {/* Header */}
                      <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-slate-400">
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 text-[#002855]">
                            <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-[#002855] stroke-[4]">
                              <path d="M20 30 L50 15 L80 30 L80 70 L50 85 L20 70 Z" />
                              <path d="M20 30 L50 45 L80 30" />
                              <path d="M50 45 L50 85" />
                              <path d="M35 38 L35 78" />
                              <path d="M65 38 L65 78" />
                            </svg>
                          </div>
                          <div className="flex flex-col leading-none">
                            <span className="text-[22px] font-black text-[#002855]">Kroom</span>
                            <span className="text-[22px] font-black text-[#003d7e]">box</span>
                          </div>
                        </div>
                        <h1 className="text-xl font-black uppercase tracking-[0.15em] text-[#002855] border-b-2 border-[#002855] pb-1">
                          KWITANSI PEMBAYARAN
                        </h1>
                        <div className="w-40" />
                      </div>

                      {/* No & Tanggal */}
                      <div className="flex justify-between px-8 py-4 text-sm">
                        <span>No. : <span className="font-bold font-mono">{selectedReceipt.trxId.split('-')[1] || selectedReceipt.id}</span></span>
                        <span>Tanggal : <span className="font-bold">{new Date(selectedReceipt.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></span>
                      </div>

                      {/* Body */}
                      <div className="flex-grow px-8 py-2 space-y-5 text-sm">
                        <div className="flex gap-2">
                          <span className="min-w-[200px] text-slate-600">Terima Dari</span>
                          <span>: <strong className="text-slate-900 ml-1">{selectedReceipt.namaPembeli}</strong></span>
                        </div>
                        <div className="flex gap-2">
                          <span className="min-w-[200px] text-slate-600">Terbilang</span>
                          <span>: <strong className="ml-1">{terbilang(selectedReceipt.jumlah * selectedReceipt.kuantitas)} Rupiah</strong></span>
                        </div>
                        <div className="flex gap-2">
                          <span className="min-w-[200px] text-slate-600">Untuk Pembayaran</span>
                          <span>: <strong className="ml-1">{selectedReceipt.notes || "Nota Terlampir"}</strong></span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex justify-between items-end px-8 pb-8 mt-4">
                        {/* Big amount */}
                        <div className="text-4xl font-black tracking-tight text-slate-900">
                          Rp{(selectedReceipt.jumlah * selectedReceipt.kuantitas).toLocaleString('id-ID')},-
                        </div>

                        {/* Signature */}
                        <div className="text-center w-[220px] flex flex-col items-center relative">
                          <p className="text-xs text-slate-600 mb-1">
                            Bandung, {new Date(selectedReceipt.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </p>
                          <div className="relative w-full h-20 flex items-center justify-center">
                            {/* Logo watermark behind signature */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                              <svg viewBox="0 0 100 100" className="w-16 h-16 fill-none stroke-[#002855] stroke-[4]">
                                <path d="M20 30 L50 15 L80 30 L80 70 L50 85 L20 70 Z" />
                                <path d="M20 30 L50 45 L80 30" />
                                <path d="M50 45 L50 85" />
                                <path d="M35 38 L35 78" />
                                <path d="M65 38 L65 78" />
                              </svg>
                            </div>
                            {profile.tandaTangan ? (
                              <img
                                src={profile.tandaTangan}
                                alt="Tanda Tangan"
                                className="relative z-10 max-h-16 max-w-[180px] object-contain mix-blend-multiply select-none"
                              />
                            ) : (
                              <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider text-center relative z-10">
                                Tanda Tangan Bendahara
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-extrabold text-slate-800 border-b border-slate-800 pb-0.5 px-4 mt-1">
                            {profile.nama}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ====== INVOICE DESIGN ====== */
                    <div className="h-full flex font-sans text-slate-900 box-border">
                      {/* Left rotated label */}
                      <div className="w-14 shrink-0 flex items-center justify-center bg-white border-r border-slate-100">
                        <div
                          className="text-slate-700 font-black text-lg tracking-wide whitespace-nowrap select-none"
                          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.05em' }}
                        >
                          Invoice {selectedReceipt.trxId.split('-')[1] || selectedReceipt.id}
                        </div>
                      </div>

                      {/* Main content */}
                      <div className="flex-1 flex flex-col p-8 overflow-hidden">
                        {/* Top header */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kroombox</h1>
                            <p className="text-[11px] text-slate-500 mt-0.5">Ko+Lab Hub Studio, Gd.Selaru lt.4 Universitas Telkom</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 text-[#f05252]">
                              <svg viewBox="0 0 100 100" className="w-full h-full fill-none stroke-current stroke-[4]">
                                <path d="M20 30 L50 15 L80 30 L80 70 L50 85 L20 70 Z" />
                                <path d="M20 30 L50 45 L80 30" />
                                <path d="M50 45 L50 85" />
                                <path d="M35 38 L35 78" />
                                <path d="M65 38 L65 78" />
                              </svg>
                            </div>
                            <div className="flex flex-col leading-none">
                              <span className="text-xl font-black text-slate-900">Kroom</span>
                              <span className="text-xl font-black text-slate-600">box</span>
                            </div>
                          </div>
                        </div>

                        {/* Divider */}
                        <div className="h-[1.5px] bg-[#f05252] mb-4" />

                        {/* Date + Billing For */}
                        <div className="grid grid-cols-2 gap-8 mb-5 text-sm">
                          <div>
                            <p className="text-[#f05252] font-black text-[10px] uppercase tracking-wider mb-1">Date</p>
                            <p className="font-bold text-slate-900">
                              {new Date(selectedReceipt.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#f05252] font-black text-[10px] uppercase tracking-wider mb-1">Billing For</p>
                            <p className="font-bold text-slate-900 uppercase">{selectedReceipt.namaPembeli || "Pelanggan"}</p>
                            {selectedReceipt.noTelepon && (
                              <p className="text-[10px] text-slate-400 font-medium">WA: {selectedReceipt.noTelepon}</p>
                            )}
                          </div>
                        </div>

                        <div className="h-[1px] bg-slate-100 mb-4" />

                        {/* Items Table */}
                        <div className="flex-grow overflow-hidden">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-[#f05252] text-white text-[11px] uppercase tracking-wider font-bold">
                                <th className="px-4 py-2.5 rounded-l-lg">Description</th>
                                <th className="px-4 py-2.5 text-center">Quantity</th>
                                <th className="px-4 py-2.5 text-center">Price</th>
                                <th className="px-4 py-2.5 text-center">Discount</th>
                                <th className="px-4 py-2.5 text-right rounded-r-lg">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-slate-100 text-xs font-medium">
                                <td className="px-4 py-3">
                                  <p className="font-bold text-slate-900">{selectedReceipt.notes || "Pembelian Produk / Layanan"}</p>
                                  {selectedReceipt.userId && (
                                    <p className="text-[10px] text-slate-400 mt-0.5">Customer ID: {selectedReceipt.userId}</p>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center font-bold">{selectedReceipt.kuantitas}</td>
                                <td className="px-4 py-3 text-center font-bold">Rp{selectedReceipt.jumlah.toLocaleString('id-ID')}</td>
                                <td className="px-4 py-3 text-center font-bold">0%</td>
                                <td className="px-4 py-3 text-right font-bold">Rp{(selectedReceipt.jumlah * selectedReceipt.kuantitas).toLocaleString('id-ID')}</td>
                              </tr>
                              {[...Array(3)].map((_, i) => (
                                <tr key={"spacer-" + i} className="border-b border-slate-50 h-7">
                                  <td colSpan={5} className="py-0">&nbsp;</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Divider */}
                        <div className="h-[1px] bg-slate-200 mt-2 mb-3" />

                        {/* Totals + Status */}
                        <div className="flex justify-between items-end">
                          <div>
                            <span className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-lg ${selectedReceipt.statusPembayaran === 'Lunas' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                              {selectedReceipt.statusPembayaran}
                            </span>
                          </div>
                          <div className="w-[280px] space-y-1.5 text-xs">
                            <div className="flex justify-between text-slate-500">
                              <span>Subtotal</span>
                              <span className="font-bold text-slate-800">Rp{(selectedReceipt.jumlah * selectedReceipt.kuantitas).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between text-slate-500 border-b border-slate-100 pb-1.5">
                              <span>Sales Tax</span>
                              <span className="font-bold text-slate-800">0</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Total</span>
                              <span className="font-bold">Rp{(selectedReceipt.jumlah * selectedReceipt.kuantitas).toLocaleString('id-ID')}</span>
                            </div>
                            <div className="flex justify-between font-black text-sm pt-1 border-t-2 border-[#f05252]">
                              <span className="text-slate-900">Amount Due</span>
                              <span className="text-[#f05252]">Rp{(selectedReceipt.jumlah * selectedReceipt.kuantitas).toLocaleString('id-ID')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex gap-8 text-[10px] text-slate-400 font-medium">
                          <span>Tel: <strong className="text-slate-600">+62-878-9000-4465</strong></span>
                          <span>Email: <strong className="text-slate-600">kroombox@gmail.com</strong></span>
                          <span>Web: <strong className="text-slate-600">kroombox.com</strong></span>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
