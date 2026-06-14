import React, { useState, useEffect } from "react";
import * as XLSX from "xlsx";

interface Transaction {
  id: string;
  trxId: string;
  tanggal: string;
  userId: string;
  tipe: "Debit" | "Kredit";
  statusPembayaran: "Lunas" | "Pending" | "Belum Lunas" | "DP";
  statusDokumen: "Draft" | "Diproses" | "Disetujui";
  sertakanTandaTangan: boolean;
  jumlah: number;
  kuantitas: number;
  namaPembeli: string;
  noTelepon: string;
  notes: string;
}

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

interface Profile {
  nama: string;
  email: string;
  tandaTangan?: string;
  fotoProfil?: string;
  role?: string;
}

const generateTrxId = () => `TRX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
const generateUserId = () => "USR-" + Math.random().toString(36).substring(2, 11).toUpperCase();

const INITIAL_FORM_STATE: FormState = {
  trxId: generateTrxId(),
  tanggal: new Date().toISOString().split("T")[0],
  userId: "", // Starts blank to allow manual entry by default
  tipe: "Debit",
  statusPembayaran: "Lunas",
  statusDokumen: "Draft",
  sertakanTandaTangan: false,
  jumlah: "",
  kuantitas: "1",
  namaPembeli: "",
  noTelepon: "",
  notes: "",
};

interface UseUserDashboardProps {
  profile: Profile;
  setProfile: React.Dispatch<React.SetStateAction<Profile>>;
  token: string | null;
  isOffline: boolean;
  setIsOffline: React.Dispatch<React.SetStateAction<boolean>>;
  onLogout: () => void;
}

export function useUserDashboard({
  profile,
  setProfile,
  token,
  isOffline,
  setIsOffline,
  onLogout
}: UseUserDashboardProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<"Invoice" | "Kwitansi">("Invoice");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("kroombox_data");
    return saved ? JSON.parse(saved) : [
      {
        id: "dummy-income",
        trxId: "TRX-1001",
        tanggal: new Date().toISOString().split("T")[0],
        userId: "USR-0001",
        tipe: "Debit",
        statusPembayaran: "Lunas",
        statusDokumen: "Disetujui",
        sertakanTandaTangan: true,
        jumlah: 1500000,
        kuantitas: 1,
        namaPembeli: "Dian Nugraha",
        noTelepon: "08122334455",
        notes: "Pembayaran Paket Premium (Lunas)"
      },
      {
        id: "dummy-1",
        trxId: "TRX-DUMMY",
        tanggal: new Date().toISOString().split("T")[0],
        userId: "USR-DUMMY",
        tipe: "Debit",
        statusPembayaran: "Pending",
        statusDokumen: "Draft",
        sertakanTandaTangan: false,
        jumlah: 250000,
        kuantitas: 1,
        namaPembeli: "Budi Dummy",
        noTelepon: "08123456789",
        notes: "Transaksi ini menunggu verifikasi (ACC)"
      }
    ];
  });

  const [form, setForm] = useState<FormState>(INITIAL_FORM_STATE);
  const [customers, setCustomers] = useState<any[]>(() => {
    const saved = localStorage.getItem("kroombox_admin_customers");
    return saved ? JSON.parse(saved) : [];
  });
  const [aiInsight, setAiInsight] = useState("Memuat analisis keuangan pintar...");
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTrxId, setEditingTrxId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Profile Edit
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({
    nama: profile.nama,
    email: profile.email,
    tandaTangan: profile.tandaTangan || ""
  });

  useEffect(() => {
    setEditProfileForm({
      nama: profile.nama,
      email: profile.email,
      tandaTangan: profile.tandaTangan || ""
    });
  }, [profile]);

  const API_BASE = "http://127.0.0.1:5000/api";

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE}${endpoint}`;
    const headers = new Headers(options.headers || {});
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    try {
      const res = await fetch(url, { ...options, headers });
      setIsOffline(false);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error ${res.status}`);
      }
      return await res.json();
    } catch (err: any) {
      if (err instanceof TypeError || err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        console.warn("Backend server is offline, falling back to local session mode.");
        setIsOffline(true);
        throw new Error("offline");
      }
      throw err;
    }
  };

  const syncWithBackend = async () => {
    if (!token || token === "offline-token-session") return;
    try {
      const profileRes = await apiRequest("/profile");
      if (profileRes && profileRes.data) {
        setProfile(profileRes.data);
        localStorage.setItem("kroombox_user_profile", JSON.stringify(profileRes.data));
      }

      const transRes = await apiRequest("/transactions");
      if (transRes && transRes.data) {
        setTransactions(transRes.data);
        localStorage.setItem("kroombox_data", JSON.stringify(transRes.data));
      }
      const custRes = await apiRequest("/customers");
      if (custRes && custRes.data) {
        setCustomers(custRes.data);
        localStorage.setItem("kroombox_admin_customers", JSON.stringify(custRes.data));
      }
      const aiRes = await apiRequest("/settings/ai-insights");
      if (aiRes && aiRes.data) {
        setAiInsight(aiRes.data);
      }
      setIsOffline(false);
    } catch (err: any) {
      setAiInsight("Sesi offline. Silakan hubungkan server backend untuk mengaktifkan AI Asisten.");
      if (err.message === "offline") {
        setIsOffline(true);
        setNotification({
          message: "Koneksi backend gagal. Berjalan dalam Sesi Lokal.",
          type: "error"
        });
      } else {
        console.error("Backend sync failed:", err);
      }
    }
  };

  useEffect(() => {
    if (token && token !== "offline-token-session") {
      syncWithBackend();
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem("kroombox_data", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "fotoProfil" | "tandaTangan") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setNotification({ message: `Gagal: Ukuran file melebihi 2MB!`, type: "error" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile(prev => ({ ...prev, [field]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const terbilang = (n: number): string => {
    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    if (n < 12) return units[n];
    if (n < 20) return terbilang(n % 10) + ' Belas';
    if (n < 100) return terbilang(Math.floor(n / 10)) + ' Puluh ' + terbilang(n % 10);
    if (n < 200) return 'Seratus ' + terbilang(n % 100);
    if (n < 1000) return terbilang(Math.floor(n / 100)) + ' Ratus ' + terbilang(n % 100);
    if (n < 2000) return 'Seribu ' + terbilang(n % 1000);
    if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' Ribu ' + terbilang(n % 1000);
    if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' Juta ' + terbilang(n % 1000000);
    return n.toString();
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.tanggal) newErrors.tanggal = "Tanggal wajib diisi";
    // User ID is optional for manual entry (e.g. general expense/cash receipts)
    if (!form.jumlah || isNaN(Number(form.jumlah.replace(/\D/g, "")))) newErrors.jumlah = "Jumlah tidak valid";
    if (!form.namaPembeli) newErrors.namaPembeli = "Keterangan / Nama pembeli wajib diisi";
    if (!form.kuantitas || Number(form.kuantitas) <= 0) newErrors.kuantitas = "Kuantitas minimal 1";

    // Signature validation for Disetujui status
    if (form.statusDokumen === "Disetujui" && !profile.tandaTangan) {
      setNotification({
        message: "Silakan upload tanda tangan bendahara terlebih dahulu pada halaman Profil.",
        type: "error"
      });
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/\D/g, "");
    setForm(prev => ({ ...prev, jumlah: numericValue }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    const newTrx: Transaction = {
      id: crypto.randomUUID(),
      trxId: form.trxId,
      tanggal: form.tanggal,
      userId: form.userId,
      tipe: form.tipe,
      statusPembayaran: form.statusPembayaran,
      statusDokumen: form.statusDokumen,
      sertakanTandaTangan: form.sertakanTandaTangan,
      jumlah: Number(form.jumlah),
      kuantitas: Number(form.kuantitas),
      namaPembeli: form.namaPembeli,
      noTelepon: form.noTelepon,
      notes: form.notes
    };

    try {
      if (token && token !== "offline-token-session") {
        await apiRequest("/transactions", {
          method: "POST",
          body: JSON.stringify(newTrx)
        });
      }
      setTransactions(prev => [newTrx, ...prev]);
      setNotification({ message: "Transaksi berhasil ditambahkan!", type: "success" });
      setForm({
        ...INITIAL_FORM_STATE,
        trxId: generateTrxId(),
        userId: "",
        tanggal: new Date().toISOString().split("T")[0]
      });
    } catch (err: any) {
      if (err.message === "offline") {
        setTransactions(prev => [newTrx, ...prev]);
        setNotification({ message: "Disimpan dalam sesi lokal (Offline).", type: "success" });
        setForm({
          ...INITIAL_FORM_STATE,
          trxId: generateTrxId(),
          userId: "",
          tanggal: new Date().toISOString().split("T")[0]
        });
      } else {
        setNotification({ message: err.message || "Gagal menyimpan transaksi.", type: "error" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    const id = deletingId;

    try {
      if (token && token !== "offline-token-session") {
        await apiRequest(`/transactions/${id}`, { method: "DELETE" });
      }
      setTransactions(prev => prev.filter(t => t.id !== id));
      setNotification({ message: "Transaksi berhasil dihapus!", type: "success" });
    } catch (err: any) {
      if (err.message === "offline") {
        setTransactions(prev => prev.filter(t => t.id !== id));
        setNotification({ message: "Transaksi dihapus dari sesi lokal (Offline).", type: "success" });
      } else {
        setNotification({ message: err.message || "Gagal menghapus transaksi.", type: "error" });
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (trx: Transaction) => {
    setEditingTrxId(trx.id);
    setForm({
      trxId: trx.trxId,
      tanggal: trx.tanggal,
      userId: trx.userId,
      tipe: trx.tipe,
      statusPembayaran: trx.statusPembayaran,
      statusDokumen: trx.statusDokumen || 'Draft',
      sertakanTandaTangan: !!trx.sertakanTandaTangan,
      jumlah: trx.jumlah.toString(),
      kuantitas: trx.kuantitas.toString(),
      namaPembeli: trx.namaPembeli,
      noTelepon: trx.noTelepon,
      notes: trx.notes
    });
    setErrors({});
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !editingTrxId) return;

    const updatedTrx: Transaction = {
      id: editingTrxId,
      trxId: form.trxId,
      tanggal: form.tanggal,
      userId: form.userId,
      tipe: form.tipe,
      statusPembayaran: form.statusPembayaran,
      statusDokumen: form.statusDokumen,
      sertakanTandaTangan: form.sertakanTandaTangan,
      jumlah: Number(form.jumlah),
      kuantitas: Number(form.kuantitas),
      namaPembeli: form.namaPembeli,
      noTelepon: form.noTelepon,
      notes: form.notes
    };

    try {
      if (token && token !== "offline-token-session") {
        await apiRequest(`/transactions/${editingTrxId}`, {
          method: "PUT",
          body: JSON.stringify(updatedTrx)
        });
      }
      setTransactions(prev => prev.map(t => t.id === editingTrxId ? updatedTrx : t));
      setNotification({ message: "Transaksi berhasil diperbarui!", type: "success" });
      setIsEditModalOpen(false);
      setEditingTrxId(null);
      setForm({
        ...INITIAL_FORM_STATE,
        trxId: generateTrxId(),
        userId: "",
        tanggal: new Date().toISOString().split("T")[0]
      });
    } catch (err: any) {
      if (err.message === "offline") {
        setTransactions(prev => prev.map(t => t.id === editingTrxId ? updatedTrx : t));
        setNotification({ message: "Transaksi diperbarui di sesi lokal (Offline).", type: "success" });
        setIsEditModalOpen(false);
        setEditingTrxId(null);
        setForm({
          ...INITIAL_FORM_STATE,
          trxId: generateTrxId(),
          userId: "",
          tanggal: new Date().toISOString().split("T")[0]
        });
      } else {
        setNotification({ message: err.message || "Gagal memperbarui transaksi.", type: "error" });
      }
    }
  };

  const handleApprove = async (id: string) => {
    try {
      if (token && token !== "offline-token-session") {
        await apiRequest(`/transactions/${id}/approve`, { method: "PATCH" });
      }
      setTransactions(prev => prev.map(t => {
        if (t.id === id) {
          return { ...t, statusPembayaran: "Lunas" };
        }
        return t;
      }));
      setNotification({ message: "Pembayaran telah disetujui (LUNAS)!", type: "success" });
    } catch (err: any) {
      if (err.message === "offline") {
        setTransactions(prev => prev.map(t => {
          if (t.id === id) {
            return { ...t, statusPembayaran: "Lunas" };
          }
          return t;
        }));
        setNotification({ message: "Verifikasi disetujui di sesi lokal (Offline).", type: "success" });
      } else {
        setNotification({ message: err.message || "Gagal menyetujui pembayaran.", type: "error" });
      }
    }
  };

  // --- Statistics ---
  const [timeframe, setTimeframe] = useState<"Harian" | "Mingguan" | "Bulanan">("Mingguan");
  const dailyData = [
    { name: 'Mon', Debit: 2100000, Kredit: 1200000, trend: 1500000 },
    { name: 'Tue', Debit: 1800000, Kredit: 1500000, trend: 1600000 },
    { name: 'Wed', Debit: 2900000, Kredit: 1100000, trend: 1800000 },
    { name: 'Thu', Debit: 1500000, Kredit: 1900000, trend: 1700000 },
    { name: 'Fri', Debit: 4200000, Kredit: 2200000, trend: 2500000 },
    { name: 'Sat', Debit: 3200000, Kredit: 1400000, trend: 2000000 },
    { name: 'Sun', Debit: 3800000, Kredit: 1800000, trend: 2200000 },
  ];

  const weeklyData = [
    { name: 'W1', Debit: 12500000, Kredit: 8400000, trend: 10000000 },
    { name: 'W2', Debit: 15800000, Kredit: 9200000, trend: 12000000 },
    { name: 'W3', Debit: 11200000, Kredit: 10500000, trend: 11000000 },
    { name: 'W4', Debit: 18400000, Kredit: 12000000, trend: 14000000 },
  ];

  const monthlyData = [
    { name: 'Jan', Debit: 45000000, Kredit: 32000000, trend: 38000000 },
    { name: 'Feb', Debit: 52000000, Kredit: 28000000, trend: 40000000 },
    { name: 'Mar', Debit: 48000000, Kredit: 35000000, trend: 42000000 },
    { name: 'Apr', Debit: 61000000, Kredit: 41000000, trend: 50000000 },
    { name: 'May', Debit: 45820000, Kredit: 28340000, trend: 42000000 },
  ];

  const activeData = timeframe === "Harian" ? dailyData : timeframe === "Mingguan" ? weeklyData : monthlyData;

  const totalIncome = transactions
    .filter(t => t.tipe === "Debit")
    .reduce((acc, curr) => acc + curr.jumlah * curr.kuantitas, 0);

  const totalExpense = transactions
    .filter(t => t.tipe === "Kredit")
    .reduce((acc, curr) => acc + curr.jumlah * curr.kuantitas, 0);

  const netBalance = totalIncome - totalExpense;

  // Chart Data for trend
  const chartData = Array.from(
    transactions.reduce((acc, t) => {
      const date = new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      if (!acc.has(date)) {
        acc.set(date, { name: date, Debit: 0, Kredit: 0 });
      }
      const data = acc.get(date)!;
      if (t.tipe === "Debit") data.Debit += t.jumlah * t.kuantitas;
      else data.Kredit += t.jumlah * t.kuantitas;
      return acc;
    }, new Map<string, { name: string; Debit: number; Kredit: number }>())
  ).map(([_, val]) => val).slice(-7);

  const exportToExcel = () => {
    if (transactions.length === 0) {
      setNotification({ message: "Tidak ada data untuk dieksport", type: "error" });
      return;
    }

    // Sort chronologically oldest first for financial running balance
    const sortedTrx = [...transactions].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    let runningBalance = 0;
    const dataToExport = sortedTrx.map((t, index) => {
      const debit = t.tipe === "Debit" ? t.jumlah * t.kuantitas : 0;
      const credit = t.tipe === "Kredit" ? t.jumlah * t.kuantitas : 0;
      runningBalance += (debit - credit);

      return {
        'No': index + 1,
        'Tanggal': t.tanggal,
        'ID Transaksi': t.trxId,
        'Keterangan / Deskripsi': t.namaPembeli + (t.notes ? ` - ${t.notes}` : ''),
        'Kontak/WhatsApp': t.noTelepon || '-',
        'Debit (Masuk)': debit,
        'Kredit (Keluar)': credit,
        'Saldo Akhir (Running Balance)': runningBalance,
        'Status': t.statusPembayaran
      };
    });

    // Append summary row at the bottom
    dataToExport.push({
      'No': '' as any,
      'Tanggal': 'TOTAL' as any,
      'ID Transaksi': '' as any,
      'Keterangan / Deskripsi': 'Akumulasi Kas Perusahaan' as any,
      'Kontak/WhatsApp': '' as any,
      'Debit (Masuk)': totalIncome as any,
      'Kredit (Keluar)': totalExpense as any,
      'Saldo Akhir (Running Balance)': (totalIncome - totalExpense) as any,
      'Status': '' as any
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Kas Perusahaan");
    XLSX.writeFile(workbook, `Laporan_Keuangan_KroomBox_${new Date().toISOString().split('T')[0]}.xlsx`);
    setNotification({ message: "Laporan kas berhasil diekspor ke Excel!", type: "success" });
  };

  // Report Search & Filter
  const [searchTerm, setSearchTerm] = useState("");
  const filteredTransactions = transactions.filter(t => 
    t.trxId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.namaPembeli.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    isSidebarOpen,
    setIsSidebarOpen,
    activeMenu,
    setActiveMenu,
    selectedReceipt,
    setSelectedReceipt,
    selectedDocType,
    setSelectedDocType,
    notification,
    setNotification,
    transactions,
    setTransactions,
    form,
    setForm,
    errors,
    isSubmitting,
    isEditModalOpen,
    setIsEditModalOpen,
    editingTrxId,
    isEditProfileModalOpen,
    setIsEditProfileModalOpen,
    editProfileForm,
    setEditProfileForm,
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
    chartData,
    exportToExcel,
    searchTerm,
    setSearchTerm,
    filteredTransactions,
    profile,
    setProfile,
    isOffline,
    onLogout,
    customers,
    aiInsight
  };
}
export type { Transaction, FormState };
